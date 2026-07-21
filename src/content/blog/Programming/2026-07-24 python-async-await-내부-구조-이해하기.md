---
title: "Python async/await 내부 구조 이해하기"
description: "Coroutine, Task, Future, Event Loop가 asyncio 안에서 어떻게 연결되는지 MCP 클라이언트 예제로 추적합니다."
pubDate: "2026-07-24T00:00:00+09:00"
categories: "Programming"
slug: "programming/python-asyncio-internals"
tags: ["Async", "Python", "asyncio"]
---

## Coroutine, Task, Future, Event Loop는 어떻게 연결되는가

앞선 글에서는 비동기 실행의 공통 원리와 C++20 코루틴의 내부 구조를 살펴봤다.

C++20에서는 다음 요소가 비교적 직접적으로 드러났다.

```text
Coroutine Frame
coroutine_handle
Awaiter
await_ready()
await_suspend()
await_resume()
```

Python의 비동기 코드도 해결하려는 문제는 같다.

```python
async def load_data():
    result = await request_data()
    return result
```

`request_data()`의 결과가 아직 준비되지 않았다면 현재 함수의 실행 상태를 보존하고, 다른 작업에 실행권을 넘긴 뒤, 결과가 준비되면 `await` 다음 위치에서 다시 실행해야 한다.

다만 Python에서는 C++처럼 `coroutine_handle`이나 awaiter 프로토콜을 직접 구현하는 경우가 드물다.

대신 다음 객체와 런타임이 그 역할을 나누어 맡는다.

```text
Coroutine Object
Awaitable
Task
Future
Event Loop
```

이 글에서는 이 다섯 요소가 서로 무엇이 다르고, 실제 실행 과정에서 어떻게 연결되는지 살펴본다.

특히 다음 MCP 코드가 실제로 어떻게 실행되는지를 추적한다.

```python
async def list_tools(self) -> list[types.Tool]:
    result = await self.session.list_tools()
    return result.tools
```

핵심 질문은 다음과 같다.

> `await self.session.list_tools()`에서 Python은 정확히 무엇을 중단하고, 누가 그것을 나중에 다시 실행하는가?

---

## 1. Python의 `async def`는 일반 함수와 다르다

먼저 일반 함수를 보자.

```python
def add(a: int, b: int) -> int:
    return a + b
```

이 함수를 호출하면 함수 본문이 즉시 실행되고 결과가 반환된다.

```python
result = add(1, 2)

print(result)  # 3
```

실행 흐름은 다음과 같다.

```text
add 호출
→ 함수 본문 실행
→ 3 반환
→ result에 저장
```

이번에는 `async def`로 정의한 함수를 보자.

```python
async def add_async(a: int, b: int) -> int:
    return a + b
```

호출 방식은 비슷해 보인다.

```python
result = add_async(1, 2)
```

하지만 `result`에는 정수 `3`이 들어가지 않는다.

대신 **코루틴 객체**가 반환된다.

```python
print(result)

# <coroutine object add_async at 0x...>
```

즉, 다음 두 호출은 의미가 다르다.

```python
add(1, 2)
```

```text
일반 함수 본문 실행
→ int 반환
```

```python
add_async(1, 2)
```

```text
코루틴 객체 생성
→ 함수의 최종 결과는 아직 반환하지 않음
```

Python의 `async def` 함수는 호출 결과로 실제 반환값이 아니라, 실행 가능한 코루틴 객체를 만든다.

---

## 2. Coroutine Object는 무엇인가

코루틴 객체는 중단과 재개가 가능한 함수 실행 상태를 표현한다.

```python
async def example():
    value = 10
    result = await some_operation()
    return value + result
```

다음 호출은 `example()`의 계산 결과가 아니라 코루틴 객체를 만든다.

```python
coroutine = example()
```

이 코루틴 객체에는 개념적으로 다음과 같은 정보가 연결되어 있다.

```text
어떤 async 함수에서 만들어졌는가
현재 어디까지 실행했는가
현재 지역변수는 무엇인가
어떤 객체를 기다리고 있는가
실행이 완료되었는가
```

C++20과 비교하면 대략 다음과 같은 대응 관계를 생각할 수 있다.

```text
Python Coroutine Object
≈
C++ Coroutine Frame을 참조하는 실행 객체
```

정확한 구현은 다르지만 정신 모델은 비슷하다.

코루틴 객체는 단순한 결과 저장소가 아니다.

> 코루틴 객체는 실행 전이거나, 실행 중 중단되었거나, 완료된 `async` 함수의 실행 상태다.

---

## 3. 코루틴 객체를 만들기만 하면 실행되는가

다음 코드를 보자.

```python
async def hello():
    print("hello")
    return 10


coroutine = hello()

print("created")
```

일반적으로 출력되는 것은 다음뿐이다.

```text
created
```

`hello`는 출력되지 않는다.

즉, `async` 함수를 호출해 코루틴 객체를 만드는 것과 그 코루틴을 실제로 실행하는 것은 별개의 일이다.

```text
hello()
→ 실행 가능한 코루틴 객체 생성

코루틴 실행
→ 별도의 실행 주체가 필요
```

코루틴을 실행하는 대표적인 방법은 다음과 같다.

```python
result = await hello()
```

또는 프로그램의 최상위 진입점에서:

```python
import asyncio

result = asyncio.run(hello())
```

를 사용할 수 있다.

---

## 4. `asyncio.run()`은 무엇을 하는가

일반적인 Python 스크립트에서는 최상위 코드에 바로 `await`를 작성할 수 없는 경우가 많다.

그래서 다음과 같이 실행한다.

```python
import asyncio


async def main():
    print("start")
    await asyncio.sleep(1)
    print("end")


asyncio.run(main())
```

`asyncio.run()`은 단순히 코루틴 함수를 호출하는 함수가 아니다.

개념적으로 다음 작업을 수행한다.

```text
새 이벤트 루프 생성
→ 전달받은 코루틴을 실행할 Task 구성
→ Task가 완료될 때까지 이벤트 루프 실행
→ 남은 비동기 작업 정리
→ 이벤트 루프 종료
→ 코루틴의 최종 결과 반환
```

단순화하면 다음과 비슷하다.

```python
def run(coroutine):
    loop = create_event_loop()
    task = loop.create_task(coroutine)

    try:
        return loop.run_until_complete(task)
    finally:
        loop.close()
```

실제 구현은 비동기 제너레이터와 Executor 종료 등 더 많은 정리 작업을 수행하지만, 기본 구조는 이와 같다.

여기서 처음 등장하는 중요한 객체가 **Task**다.

---

## 5. Coroutine과 Task는 무엇이 다른가

Python 비동기 코드를 이해할 때 가장 먼저 구분해야 할 것이 Coroutine과 Task다.

### Coroutine

코루틴은 `async` 함수의 실행 상태다.

```python
coroutine = load_data()
```

아직 이것만으로는 이벤트 루프에 독립적인 작업으로 예약되었다고 볼 수 없다.

### Task

Task는 코루틴을 이벤트 루프에서 실행하고 관리하는 객체다.

```python
task = asyncio.create_task(load_data())
```

구조를 단순화하면 다음과 같다.

```text
Coroutine
중단과 재개가 가능한 함수 실행 상태

Task
Coroutine을 소유하고 Event Loop에서 실행되도록 관리
```

C++ 관점에서는 다음과 같이 비교할 수 있다.

```text
Python Coroutine
≈ coroutine frame

Python Task
≈ coroutine handle을 소유하고 스케줄러와 연결하는 task<T>
```

다만 Python의 `asyncio.Task`는 이벤트 루프와 긴밀하게 통합되어 있다는 점이 중요하다.

Task는 다음을 관리한다.

```text
코루틴 실행 시작
코루틴이 기다리는 Future 추적
코루틴의 완료 결과 저장
예외 저장
취소 요청 전달
완료 콜백 실행
코루틴 재개 예약
```

---

## 6. `await coroutine`과 `create_task()`는 다르다

다음 두 코드는 비슷해 보이지만 실행 구조가 다르다.

```python
result = await load_data()
```

```python
task = asyncio.create_task(load_data())
result = await task
```

첫 번째 코드는 현재 코루틴이 `load_data()` 코루틴의 완료를 직접 기다린다.

```text
현재 코루틴 실행
→ load_data 코루틴 실행
→ load_data 완료까지 현재 흐름이 연결됨
→ 결과 반환
```

두 번째 코드는 `load_data()`를 독립적인 Task로 이벤트 루프에 등록한다.

```text
load_data 코루틴 생성
→ Task로 감쌈
→ 이벤트 루프의 실행 대상에 등록
→ 현재 코루틴도 계속 진행 가능
```

예를 들어 다음 코드를 보자.

```python
async def job(name: str):
    print(f"{name} start")
    await asyncio.sleep(1)
    print(f"{name} end")
```

순차적으로 기다리면:

```python
async def main():
    await job("A")
    await job("B")
```

실행 흐름은 다음과 같다.

```text
A 시작
→ 1초 대기
→ A 종료
→ B 시작
→ 1초 대기
→ B 종료
```

전체 시간은 약 2초다.

Task를 먼저 생성하면:

```python
async def main():
    task_a = asyncio.create_task(job("A"))
    task_b = asyncio.create_task(job("B"))

    await task_a
    await task_b
```

실행 흐름은 다음과 같다.

```text
A 시작
→ A 대기

B 시작
→ B 대기

약 1초 후
→ A 재개 및 종료
→ B 재개 및 종료
```

전체 시간은 약 1초다.

Task를 생성했다고 두 작업이 CPU에서 병렬 실행되는 것은 아니다.

두 작업의 대기 시간이 겹친 것이다.

---

## 7. `await`는 무엇을 기다릴 수 있는가

Python에서 `await` 뒤에는 아무 객체나 올 수 없다.

**Awaitable**인 객체만 올 수 있다.

```python
result = await awaitable
```

대표적인 awaitable은 다음과 같다.

```text
Coroutine Object
Task
Future
__await__()를 구현한 사용자 정의 객체
```

즉, Awaitable은 특정 클래스 이름이 아니라 다음 의미를 가진다.

> `await`를 통해 완료를 기다릴 수 있는 객체

C++에서 `co_await`가 awaiter 프로토콜을 지원하는 객체를 기다리는 것과 비슷하다.

```text
C++ Awaitable
operator co_await 또는 awaiter 프로토콜 제공

Python Awaitable
__await__() 프로토콜 제공
```

Python 코루틴 객체도 내부적으로 awaitable 프로토콜을 제공한다.

---

## 8. `__await__()`는 무엇인가

Python에서 awaitable 객체는 `__await__()` 메서드를 통해 대기 과정을 표현할 수 있다.

매우 단순화한 사용자 정의 예시는 다음과 같다.

```python
class ImmediateValue:
    def __init__(self, value):
        self.value = value

    def __await__(self):
        if False:
            yield

        return self.value
```

사용할 때는:

```python
async def main():
    result = await ImmediateValue(42)
    print(result)
```

처럼 쓸 수 있다.

여기서 `__await__()`는 iterator를 반환해야 한다.

Python의 코루틴 실행기는 이 iterator를 진행하면서, 현재 코루틴이 어떤 대상에 실행권을 양보하는지를 처리한다.

다만 일반 애플리케이션 개발자가 `__await__()`를 직접 구현하는 경우는 많지 않다.

대부분 `asyncio.Future`, `Task`, 비동기 라이브러리가 제공하는 awaitable을 사용한다.

C++과 연결하면 다음과 같이 볼 수 있다.

```text
C++ awaiter
await_ready
await_suspend
await_resume

Python awaitable
__await__() iterator를 통해 중단과 결과 전달 표현
```

두 언어의 구체적인 프로토콜은 다르지만, 다음 목적은 같다.

```text
지금 결과를 받을 수 있는가
아직 없다면 무엇을 기다릴 것인가
재개되었을 때 어떤 결과를 반환할 것인가
```

---

## 9. Future는 무엇인가

Future는 아직 완료되지 않은 미래의 결과를 표현하는 객체다.

개념적으로 다음 상태를 가진다.

```text
Pending
아직 결과나 예외가 없음

Finished
결과 또는 예외가 설정됨

Cancelled
작업이 취소됨
```

Future에는 나중에 결과를 설정할 수 있다.

```python
future.set_result(value)
```

실패를 저장할 수도 있다.

```python
future.set_exception(error)
```

Future를 기다리는 코드는 다음과 같다.

```python
result = await future
```

Future가 이미 완료되었다면 결과를 즉시 반환한다.

```text
Future Finished
→ await 즉시 결과 반환
→ 실제 중단 없음
```

Future가 아직 완료되지 않았다면 현재 Task는 Future를 기다리는 상태가 된다.

```text
Future Pending
→ 현재 Task 중단
→ Future에 완료 콜백 연결
→ Event Loop에 제어권 반환
```

Future가 완료되면 기다리던 Task를 다시 실행할 수 있도록 이벤트 루프에 예약한다.

```text
future.set_result()
→ Future 완료
→ 기다리던 Task의 재개 예약
→ Event Loop가 Task 실행
→ await 표현식이 결과 반환
```

---

## 10. Task와 Future의 관계

Python의 `asyncio.Task`는 Future와 완전히 별개의 객체가 아니다.

Task는 Future의 인터페이스를 확장하여 코루틴 실행을 관리하는 객체라고 볼 수 있다.

```text
Future
나중에 완료될 결과를 관리

Task
코루틴을 실행하여 Future의 결과를 만들어 냄
```

Future는 그 자체로 코루틴을 실행하지 않을 수 있다.

누군가 외부에서 결과를 설정해야 할 수 있다.

```python
future.set_result(42)
```

반면 Task는 자신이 가진 코루틴을 실행한다.

```python
task = asyncio.create_task(coroutine)
```

코루틴이 `return`하면 Task의 결과가 설정된다.

```python
async def get_number():
    return 42
```

```text
get_number 코루틴 완료
→ return 42
→ Task가 완료 상태로 변경
→ Task의 result가 42가 됨
```

코루틴에서 처리되지 않은 예외가 발생하면 Task에 예외가 저장된다.

```python
async def fail():
    raise ValueError("failed")
```

```text
fail 코루틴 예외 발생
→ Task에 예외 저장
→ Task 완료
→ Task를 await한 위치에서 예외 재발생
```

---

## 11. Event Loop는 무엇을 하는가

이벤트 루프는 실행 가능한 Task와 외부 이벤트를 관리하는 스케줄러다.

아주 단순화하면 다음과 같은 반복 구조를 가진다.

```python
while running:
    process_ready_callbacks()
    wait_for_io_events()
    move_completed_io_to_ready_queue()
    run_ready_tasks()
```

이벤트 루프가 관리하는 대표적인 대상은 다음과 같다.

```text
즉시 실행 가능한 콜백
실행 가능한 Task
네트워크 I/O 완료 이벤트
타이머
Future 완료 콜백
스레드 풀 작업 완료 알림
```

Task는 한 번 실행되면 무조건 완료될 때까지 계속 실행되는 것이 아니다.

다음 상태 중 하나가 될 때까지만 진행될 수 있다.

```text
코루틴 완료
예외 발생
다른 awaitable을 기다림
명시적으로 제어권 양보
```

Task가 미완료 Future를 `await`하면 이벤트 루프는 그 Task를 실행 대상에서 잠시 제외한다.

```text
Task A 실행
→ Future X를 await
→ Future X가 Pending
→ Task A 중단
→ 다른 Task 실행
```

나중에 Future X가 완료되면 Task A를 다시 준비 큐에 넣는다.

```text
Future X 완료
→ Task A를 Ready Queue에 등록
→ Event Loop가 적절한 시점에 Task A 재개
```

---

## 12. 이벤트 루프는 코루틴을 어떻게 실행하는가

Python의 코루틴은 내부적으로 iterator와 비슷하게 단계적으로 진행할 수 있다.

개념적인 코루틴이 있다고 하자.

```python
async def example():
    print("before")
    value = await operation()
    print("after")
    return value
```

Task는 코루틴을 실행하다가 `await operation()`에서 대기 대상을 만날 수 있다.

매우 단순화하면 Task의 동작은 다음과 비슷하다.

```python
class ConceptualTask:
    def step(self, value=None, error=None):
        try:
            if error is not None:
                awaited = self.coroutine.throw(error)
            else:
                awaited = self.coroutine.send(value)
        except StopIteration as completed:
            self.set_result(completed.value)
            return
        except BaseException as exception:
            self.set_exception(exception)
            return

        self.wait_for(awaited)
```

실제 `asyncio.Task` 구현은 훨씬 복잡하지만, 정신 모델은 이와 같다.

```text
코루틴에 값을 전달하며 실행
→ 코루틴이 다음 await 지점까지 진행
→ 기다릴 객체를 반환
→ 해당 객체가 완료될 때까지 Task 중단
→ 완료 결과를 다시 코루틴에 전달
```

C++20의 `handle.resume()`과 비교하면 Python에서는 Task가 코루틴을 단계적으로 진행시키는 역할을 한다.

```text
C++
coroutine_handle.resume()

Python
Task가 coroutine.send() 계열 동작을 통해 코루틴 진행
```

일반 Python 개발자는 이 동작을 직접 호출하지 않는다.

Task와 이벤트 루프가 대신 수행한다.

---

## 13. `await` 호출 체인은 어떻게 중단되는가

다음과 같은 코드를 보자.

```python
async def main():
    tools = await list_tools()
    print(tools)


async def list_tools():
    result = await session.list_tools()
    return result.tools
```

`session.list_tools()`가 네트워크 응답을 기다려야 한다고 하자.

논리적인 대기 관계는 다음과 같다.

```text
main Task
└─ main coroutine
   └─ list_tools coroutine
      └─ session.list_tools coroutine
         └─ network Future
```

가장 안쪽의 네트워크 Future가 아직 완료되지 않았다면 `session.list_tools()`는 중단된다.

`list_tools()`도 그 결과를 기다리므로 더 진행할 수 없다.

`main()` 역시 `list_tools()` 결과를 기다리므로 진행할 수 없다.

```text
network Future Pending
↑
session.list_tools 중단
↑
list_tools 중단
↑
main 중단
```

하지만 이것이 운영체제 스레드의 호출 스택이 그대로 멈춰 있다는 뜻은 아니다.

각 코루틴의 실행 상태는 별도로 보존되고, 최상위 Task는 네트워크 Future의 완료를 기다리는 상태가 된다.

```text
main coroutine state 보존
list_tools coroutine state 보존
session.list_tools coroutine state 보존
Task는 Future 완료 대기
Event Loop는 다른 Task 실행
```

네트워크 응답이 도착하면 반대 순서로 결과가 전달된다.

```text
network Future 완료
→ session.list_tools 재개
→ 결과 반환
→ list_tools 재개
→ result.tools 반환
→ main 재개
→ print 실행
```

---

## 14. MCP의 `list_tools()` 호출 흐름

이제 실제 코드에 적용해보자.

```python
async def list_tools(self) -> list[types.Tool]:
    result = await self.session.list_tools()
    return result.tools
```

호출자가 다음과 같이 사용한다고 하자.

```python
tools = await client.list_tools()
```

전체 흐름은 개념적으로 다음과 같다.

```text
1. client.list_tools() 호출

2. list_tools 코루틴 객체 생성

3. 호출자가 해당 코루틴을 await

4. list_tools 함수 본문 실행 시작

5. self.session.list_tools() 호출

6. MCP Session의 list_tools 코루틴 또는 awaitable 생성

7. 해당 awaitable 실행

8. MCP 요청 메시지 생성

9. 전송 계층을 통해 서버로 요청 전달

10. 서버 응답을 기다리는 Future 또는 유사 객체 생성

11. 응답이 아직 없으므로 현재 Task 중단

12. Event Loop에 제어권 반환

13. Event Loop가 다른 Task, 타이머, I/O 이벤트 처리

14. MCP 서버 응답 도착

15. 전송 계층이 대기 중인 Future에 결과 설정

16. Future 완료 콜백이 현재 Task 재개를 예약

17. Event Loop가 Task를 다시 실행

18. self.session.list_tools()가 응답 객체 반환

19. 바깥쪽 list_tools의 await 표현식이 결과를 받음

20. result 변수에 응답 객체 저장

21. result.tools 추출

22. list[types.Tool] 반환

23. 호출자의 await가 해당 목록을 결과로 받음
```

핵심은 다음 부분이다.

```python
result = await self.session.list_tools()
```

이 코드는 현재 스레드를 MCP 서버 응답이 올 때까지 붙잡아 두는 것이 아니다.

```text
현재 Task의 코루틴 상태 보존
→ MCP 응답 Future 대기
→ Event Loop에 실행권 반환
→ 응답 완료 후 Task 재개
```

---

## 15. `call_tool()`도 같은 구조인가

다음 코드도 동일한 원리로 동작한다.

```python
async def call_tool(
    self,
    tool_name: str,
    tool_input: dict,
) -> types.CallToolResult | None:
    return await self.session.call_tool(
        tool_name,
        tool_input,
    )
```

실행 흐름은 다음과 같다.

```text
call_tool 코루틴 실행
→ Session.call_tool 코루틴 실행
→ MCP 요청 전송
→ 응답 Future 대기
→ 현재 Task 중단
→ Event Loop가 다른 작업 처리
→ MCP 결과 도착
→ Future 완료
→ Task 재개
→ CallToolResult 반환
```

이 함수는 결과를 별도로 가공하지 않고 그대로 반환한다.

```python
return await self.session.call_tool(...)
```

다음과 사실상 같은 구조다.

```python
result = await self.session.call_tool(
    tool_name,
    tool_input,
)
return result
```

하지만 다음 코드는 의미가 다르다.

```python
return self.session.call_tool(
    tool_name,
    tool_input,
)
```

`self.session.call_tool()`이 async 함수라면 이 코드는 최종 `CallToolResult`가 아니라 코루틴 객체를 반환하게 된다.

정리하면:

```python
self.session.call_tool(...)
```

```text
Coroutine 또는 Awaitable
```

```python
await self.session.call_tool(...)
```

```text
CallToolResult
```

---

## 16. `return await`는 항상 필요한가

다음 래퍼 함수는 결과를 그대로 전달한다.

```python
async def call_tool(...):
    return await self.session.call_tool(...)
```

기능적으로는 유효하다.

이 래퍼가 존재하는 이유는 다음과 같을 수 있다.

```text
상위 코드에 단순한 인터페이스 제공
세션 객체를 외부에 노출하지 않음
타입 힌트 통일
추후 로깅이나 예외 처리 추가
입력값 검증 추가
결과 변환 가능
```

하지만 아무런 추가 동작도 하지 않는다면 래퍼 자체가 반드시 필요한 것은 아닐 수 있다.

예를 들어 나중에 다음과 같이 확장할 수 있다.

```python
async def call_tool(
    self,
    tool_name: str,
    tool_input: dict,
) -> types.CallToolResult | None:
    try:
        result = await self.session.call_tool(
            tool_name,
            tool_input,
        )
        return result
    except Exception as error:
        logger.exception(
            "Tool call failed: %s",
            tool_name,
        )
        raise
```

`return await`를 사용하면 내부 작업에서 발생한 예외도 현재 async 함수의 실행 문맥에서 전달된다.

---

## 17. `await`는 동시 실행을 자동으로 만들지 않는다

다음 코드를 보자.

```python
async def load_all():
    user = await load_user()
    orders = await load_orders()
    return user, orders
```

이 코드는 비동기 함수이지만 두 작업은 순차적으로 실행된다.

```text
load_user 시작
→ load_user 완료

load_orders 시작
→ load_orders 완료
```

두 작업 사이에 의존 관계가 없다면 동시에 진행하도록 Task를 생성할 수 있다.

```python
async def load_all():
    user_task = asyncio.create_task(load_user())
    orders_task = asyncio.create_task(load_orders())

    user = await user_task
    orders = await orders_task

    return user, orders
```

또는 다음처럼 작성할 수 있다.

```python
async def load_all():
    user, orders = await asyncio.gather(
        load_user(),
        load_orders(),
    )

    return user, orders
```

이 경우 두 작업의 대기 시간이 겹칠 수 있다.

```text
load_user 시작
→ I/O 대기

load_orders 시작
→ I/O 대기

각 결과가 준비되는 순서대로 재개
```

따라서 `await` 자체는 "동시에 실행하라"는 문법이 아니다.

```text
await
현재 작업의 결과를 기다림

create_task / gather
여러 코루틴을 독립적으로 예약하여 동시 진행
```

---

## 18. `asyncio.gather()`는 무엇을 하는가

여러 awaitable을 함께 기다릴 때 `asyncio.gather()`를 사용할 수 있다.

```python
results = await asyncio.gather(
    operation_a(),
    operation_b(),
    operation_c(),
)
```

개념적으로 다음 역할을 한다.

```text
여러 코루틴을 Task로 예약
→ 각 Task가 독립적으로 진행
→ 모든 Task 완료 대기
→ 입력 순서에 맞춰 결과 목록 반환
```

예를 들어 B가 가장 먼저 끝나더라도 결과 순서는 입력 순서를 따른다.

```python
result_a, result_b, result_c = await asyncio.gather(
    operation_a(),
    operation_b(),
    operation_c(),
)
```

다만 하나의 작업이 실패했을 때 나머지 작업을 어떻게 처리할지는 프로그램 요구사항에 따라 신중히 생각해야 한다.

비동기 동시 실행에서는 성공 결과뿐 아니라 다음 항목도 설계 대상이다.

```text
하나가 실패하면 전체를 실패시킬 것인가
나머지 작업을 취소할 것인가
일부 성공 결과를 사용할 것인가
타임아웃은 어디에 적용할 것인가
취소 후 정리 작업은 어떻게 할 것인가
```

---

## 19. Python의 협력적 스케줄링

일반적인 `asyncio` 이벤트 루프에서는 여러 Task가 협력적으로 실행된다.

즉, 하나의 Task가 `await` 등을 통해 실행권을 돌려줘야 다른 Task가 실행될 수 있다.

다음 코드는 문제가 된다.

```python
async def bad_task():
    while True:
        perform_cpu_work()
```

함수 이름에 `async`가 붙었지만 내부에 실행권을 양보하는 지점이 없다.

이 Task가 이벤트 루프 스레드에서 계속 실행되면 다른 Task가 실행되지 못한다.

```text
bad_task 실행
→ CPU 작업 반복
→ await 없음
→ Event Loop로 제어권이 돌아오지 않음
→ 다른 Task 실행 불가
```

간단한 반복 작업에서 명시적으로 실행권을 양보하려면 다음과 같은 코드를 볼 수 있다.

```python
async def cooperative_task():
    while True:
        perform_small_cpu_work()
        await asyncio.sleep(0)
```

`asyncio.sleep(0)`은 긴 시간을 기다리기 위한 것이 아니라, 다른 Task가 실행될 기회를 주기 위해 사용될 수 있다.

다만 CPU 집약적인 작업을 작은 단위로 억지로 나누는 것이 항상 좋은 해결책은 아니다.

CPU 연산은 스레드나 프로세스 등 별도의 실행 자원으로 넘기는 것이 더 적절할 수 있다.

---

## 20. 블로킹 함수는 Event Loop 전체를 막는다

다음 코드를 보자.

```python
import time


async def bad_sleep():
    print("start")
    time.sleep(5)
    print("end")
```

`time.sleep(5)`는 현재 운영체제 스레드를 실제로 블로킹한다.

이 함수가 이벤트 루프 스레드에서 실행되면:

```text
현재 코루틴만 대기하는 것이 아님
→ Event Loop Thread 자체가 5초간 정지
→ 다른 Task와 I/O 이벤트 처리 불가
```

비동기 버전은 다음과 같다.

```python
import asyncio


async def good_sleep():
    print("start")
    await asyncio.sleep(5)
    print("end")
```

`asyncio.sleep(5)`는 대략 다음처럼 동작한다.

```text
5초 뒤 현재 Task를 재개하도록 타이머 등록
→ 현재 Task 중단
→ Event Loop에 제어권 반환
```

이벤트 루프는 그동안 다른 Task를 실행할 수 있다.

중요한 원칙은 다음과 같다.

> `async def` 안에 작성했다고 동기 함수가 자동으로 비동기 함수가 되지는 않는다.

---

## 21. 동기 라이브러리를 비동기 코드에서 호출해야 한다면

기존의 블로킹 함수를 반드시 호출해야 할 수도 있다.

예를 들어 파일 처리나 외부 SDK가 동기 API만 제공할 수 있다.

```python
def blocking_operation():
    ...
```

이를 이벤트 루프에서 직접 호출하면 다른 Task를 막을 수 있다.

Python에서는 `asyncio.to_thread()`를 통해 일반 함수를 별도의 스레드에서 실행할 수 있다.

```python
async def call_blocking_operation():
    result = await asyncio.to_thread(
        blocking_operation
    )
    return result
```

실행 구조는 다음과 같다.

```text
Event Loop Task
→ blocking_operation을 worker thread에 제출
→ worker 결과 Future 대기
→ 현재 Task 중단
→ Event Loop는 다른 작업 처리
→ worker thread 작업 완료
→ Future 완료
→ 현재 Task 재개
```

여기서 블로킹이 사라진 것은 아니다.

블로킹 작업은 여전히 스레드 하나를 사용한다.

다만 이벤트 루프 스레드가 블로킹되지 않도록 다른 스레드로 옮긴 것이다.

CPU 집약적인 Python 코드라면 멀티프로세싱이나 별도 작업 시스템이 더 적절할 수도 있다.

---

## 22. 예외는 어떻게 전달되는가

다음 비동기 함수가 실패한다고 하자.

```python
async def load_data():
    raise ValueError("invalid response")
```

호출자가 이를 `await`하면 해당 위치에서 예외가 발생한다.

```python
async def main():
    try:
        result = await load_data()
    except ValueError as error:
        print(error)
```

실행 구조는 다음과 같다.

```text
load_data 코루틴 실행
→ ValueError 발생
→ 코루틴 완료
→ Task에 예외 저장
→ main의 await 재개
→ await 표현식에서 ValueError 다시 발생
```

C++ 코루틴의 `promise_type::unhandled_exception()`에 예외를 저장하고, `await_resume()` 또는 결과 조회 시 다시 던지는 구조와 비슷하다.

```text
C++
코루틴 예외
→ promise에 exception_ptr 저장
→ await_resume에서 재발생

Python
코루틴 예외
→ Task 또는 Future에 예외 저장
→ await 시 재발생
```

따라서 비동기 코드도 일반 코드처럼 `try/except`를 사용할 수 있다.

```python
async def call_tool_safely():
    try:
        return await session.call_tool(
            "search",
            {},
        )
    except TimeoutError:
        return None
```

---

## 23. 생성한 Task의 예외를 무시하면 어떻게 되는가

다음 코드를 보자.

```python
async def fail():
    raise RuntimeError("failed")


async def main():
    asyncio.create_task(fail())
    await asyncio.sleep(1)
```

`fail()` Task를 만들었지만 아무도 그 결과를 `await`하지 않는다.

Task에서 예외가 발생하면 이벤트 루프가 다음과 비슷한 경고를 출력할 수 있다.

```text
Task exception was never retrieved
```

이는 Task의 예외가 발생했지만 어떤 코드도 결과나 예외를 확인하지 않았다는 뜻이다.

따라서 Task를 생성할 때는 소유권과 완료 처리를 생각해야 한다.

```text
누가 이 Task를 기다리는가
예외는 누가 처리하는가
취소는 누가 요청하는가
Task 참조는 어디에 보관하는가
프로그램 종료 전 완료를 보장하는가
```

단순히 `create_task()`를 호출하고 참조를 버리는 방식은 작업 손실이나 예외 누락으로 이어질 수 있다.

---

## 24. Task 취소는 강제 종료와 다르다

Python Task는 취소할 수 있다.

```python
task.cancel()
```

하지만 `cancel()`은 일반적으로 실행 중인 코루틴을 즉시 강제로 제거하는 동작이 아니다.

Task가 다음 취소 가능 지점에 도달하면 `CancelledError`가 전달된다.

```python
async def worker():
    try:
        while True:
            await do_work()
    except asyncio.CancelledError:
        print("cleanup")
        raise
```

실행 구조는 다음과 같다.

```text
task.cancel()
→ Task에 취소 요청 표시
→ 코루틴의 await 지점 등에 CancelledError 전달
→ 코루틴이 정리 코드 수행 가능
→ 취소 상태로 완료
```

따라서 취소는 협력적이다.

코루틴이 이벤트 루프에 제어권을 반환하지 않는 CPU 반복문을 실행 중이라면 취소 처리도 늦어질 수 있다.

또한 `CancelledError`를 잡고 다시 발생시키지 않으면 취소를 의도치 않게 무시할 수 있다.

```python
except asyncio.CancelledError:
    cleanup()
    raise
```

자원 정리가 필요하다면 `finally`를 사용할 수도 있다.

```python
async def worker():
    resource = await acquire_resource()

    try:
        await use_resource(resource)
    finally:
        await release_resource(resource)
```

---

## 25. 타임아웃은 작업 취소와 연결된다

비동기 작업이 무한정 기다리지 않도록 타임아웃을 설정할 수 있다.

```python
async def main():
    try:
        result = await asyncio.wait_for(
            session.list_tools(),
            timeout=5,
        )
    except TimeoutError:
        print("request timed out")
```

타임아웃이 발생하면 기다리던 작업에 취소가 전달될 수 있다.

따라서 타임아웃은 단순히 호출자만 먼저 빠져나오는 기능으로 생각하면 부족하다.

```text
타임아웃 발생
→ 대기 중인 작업 취소 요청
→ 내부 코루틴이 취소 처리
→ 소켓, 스트림, 임시 상태 정리 필요
```

최근 Python에서는 다음과 같은 컨텍스트 관리자 형태도 사용할 수 있다.

```python
async def main():
    async with asyncio.timeout(5):
        result = await session.list_tools()
```

어떤 방식을 사용하든 중요한 것은 내부 작업이 취소에 안전하게 설계되어 있는가이다.

---

## 26. TaskGroup과 구조화된 동시성

여러 Task를 생성하면 누가 그 Task를 관리하는지가 중요하다.

다음처럼 Task를 개별적으로 만들 수 있다.

```python
task_a = asyncio.create_task(operation_a())
task_b = asyncio.create_task(operation_b())
```

하지만 함수가 중간에 실패하면 생성한 Task를 정리하기 어려울 수 있다.

Python은 `asyncio.TaskGroup`을 통해 여러 Task의 수명을 하나의 블록 안에서 관리할 수 있다.

```python
async def main():
    async with asyncio.TaskGroup() as group:
        task_a = group.create_task(operation_a())
        task_b = group.create_task(operation_b())

    result_a = task_a.result()
    result_b = task_b.result()
```

`TaskGroup` 블록은 내부 Task가 완료될 때까지 종료되지 않는다.

하나의 Task가 실패하면 관련 Task의 취소와 예외 수집도 함께 관리한다.

이런 방식을 **구조화된 동시성**이라고 한다.

핵심 원칙은 다음과 같다.

> 생성된 동시 작업의 수명이 코드의 구조적인 범위를 벗어나지 않도록 관리한다.

C++에서도 structured concurrency가 중요한 설계 주제로 다뤄지는 이유가 같다.

무작정 Task를 생성하고 버리면 작업 수명, 취소, 예외 처리가 불명확해진다.

---

## 27. 비동기 컨텍스트 관리자

비동기 코드에서는 자원 획득과 해제 자체가 비동기 작업일 수 있다.

일반적인 컨텍스트 관리자는 다음과 같이 사용한다.

```python
with open("data.txt") as file:
    data = file.read()
```

비동기 자원은 다음처럼 사용할 수 있다.

```python
async with session:
    result = await session.list_tools()
```

비동기 컨텍스트 관리자는 다음 메서드를 사용한다.

```python
__aenter__()
__aexit__()
```

개념적으로:

```python
resource = await manager.__aenter__()

try:
    ...
finally:
    await manager.__aexit__(...)
```

와 연결된다.

MCP 클라이언트나 네트워크 세션에서 `async with`를 사용하는 이유는 다음 작업이 비동기일 수 있기 때문이다.

```text
연결 수립
핸드셰이크
스트림 준비
종료 메시지 전송
남은 Task 정리
소켓 닫기
```

---

## 28. 비동기 반복자와 `async for`

비동기 작업은 한 번의 결과만 반환하지 않고, 시간이 지나면서 여러 값을 전달할 수도 있다.

이때 비동기 반복자를 사용할 수 있다.

```python
async for message in message_stream:
    print(message)
```

일반 `for`와 달리 다음 값을 얻는 과정에서 `await`가 필요할 수 있다.

개념적으로는:

```python
iterator = message_stream.__aiter__()

while True:
    try:
        message = await iterator.__anext__()
    except StopAsyncIteration:
        break

    print(message)
```

비동기 반복자는 다음과 같은 상황에서 유용하다.

```text
스트리밍 API 응답
웹소켓 메시지
로그 스트림
데이터베이스 커서
이벤트 구독
LLM 토큰 스트리밍
```

각 값을 기다리는 동안 현재 Task는 중단되고 이벤트 루프는 다른 작업을 실행할 수 있다.

---

## 29. Python async 함수의 지역변수는 어디에 남는가

다음 함수를 보자.

```python
async def example():
    value = 10
    result = await operation()
    return value + result
```

`await operation()`에서 코루틴이 중단되어도 `value`는 사라지지 않는다.

코루틴 객체가 함수 프레임과 실행 상태를 유지하기 때문이다.

개념적으로 다음 정보가 보존된다.

```text
현재 바이트코드 실행 위치
지역변수 value
현재 대기 중인 awaitable
예외 처리 상태
호출 중인 코루틴 관계
```

C++ 코루틴 프레임과 비교하면 다음과 같다.

```text
C++ Coroutine Frame
컴파일러가 필요한 지역변수와 state를 저장

Python Coroutine Frame
Python 실행 프레임이 지역변수와 instruction state를 유지
```

Python은 인터프리터 기반 실행 구조를 사용하므로 C++처럼 소스 코드를 명시적인 `switch(state)` 형태로 변환한다고 단정하면 부정확하다.

하지만 실행 모델로는 여전히 상태 머신처럼 이해할 수 있다.

```text
실행 전
실행 중
Await 중단
재개
완료
```

---

## 30. C++ Coroutine과 Python asyncio 비교

앞선 C++ 글의 요소를 Python에 대응해보면 다음과 같다.

| 역할        | C++20                          | Python asyncio      |
| --------- | ------------------------------ | -------------------- |
| 중단 가능한 실행 | Coroutine Frame                | Coroutine Object    |
| 실행 제어 객체  | `coroutine_handle`             | `Task`               |
| 기다릴 대상    | Awaitable/Awaiter              | Awaitable/Future     |
| 중단 표현     | `co_await`                     | `await`              |
| 결과 보관     | `promise_type` 또는 task 상태      | Future/Task 상태       |
| 재개 주체     | Awaiter, Executor, I/O Runtime | Event Loop           |
| 재개 실행     | `handle.resume()`              | Task 재실행 예약          |
| 수명 관리     | `task<T>`, `destroy()`         | GC와 Task 참조, 이벤트 루프  |
| 실행 스레드    | 라이브러리가 결정                      | 일반적으로 이벤트 루프 스레드     |

가장 중요한 차이는 실행 환경의 통합 정도다.

C++20은 중단과 재개의 언어 규약을 제공하지만, 스케줄러와 표준 `task<T>`는 제공하지 않는다.

Python의 `asyncio`는 다음을 함께 제공한다.

```text
Task
Future
Event Loop
Timer
비동기 네트워크 API
Task 취소
동시 작업 조합
```

즉, Python에서는 코루틴을 실행할 런타임 구조가 비교적 표준화되어 있다.

---

## 31. Python 비동기 코드의 실행 스레드

Python 비동기 코드를 "스레드를 사용하지 않는 코드"라고 생각하면 안 된다.

코드는 항상 어떤 스레드에서 실행된다.

일반적인 `asyncio` 프로그램에서는 하나의 이벤트 루프가 하나의 운영체제 스레드에서 Python 코드를 실행한다.

```text
Event Loop Thread
├─ Task A 일부 실행
├─ Task B 일부 실행
├─ Task C 일부 실행
└─ Task A 나머지 실행
```

한 시점에 하나의 Task만 Python 코드를 실행할 수 있지만, 각 Task의 I/O 대기 시간이 겹친다.

```text
Task A: 요청 ───────── 응답
Task B:   요청 ───────── 응답
Task C:     요청 ───────── 응답
```

이 구조는 I/O 중심 프로그램에 적합하다.

```text
네트워크 서버
API 클라이언트
데이터베이스 호출
메시지 큐
MCP 통신
스트리밍 처리
```

반면 CPU 연산이 중심이라면 이벤트 루프만으로 실행 시간을 줄이지 못한다.

---

## 32. MCP 클라이언트에서 async가 필요한 이유

MCP 클라이언트는 서버와 메시지를 주고받는다.

대표적인 작업은 다음과 같다.

```text
서버 초기화
도구 목록 조회
리소스 조회
프롬프트 조회
도구 실행 요청
서버 응답 대기
알림 수신
```

이 중 많은 시간은 CPU 계산이 아니라 I/O 대기다.

예를 들어 도구 실행 요청을 보낸 뒤 서버가 실제 작업을 수행하는 동안 클라이언트는 응답을 기다려야 한다.

동기 블로킹 방식이라면 해당 스레드는 응답이 올 때까지 다른 일을 하지 못할 수 있다.

비동기 방식에서는:

```text
MCP 요청 전송
→ 응답 Future 대기
→ 현재 Task 중단
→ 다른 메시지와 작업 처리
→ MCP 응답 도착
→ 현재 Task 재개
```

가 가능하다.

특히 여러 MCP 서버나 여러 도구를 함께 호출할 때 동시성이 유용하다.

```python
async def call_multiple_tools():
    weather_task = asyncio.create_task(
        weather_session.call_tool(
            "get_weather",
            {"city": "Seoul"},
        )
    )

    calendar_task = asyncio.create_task(
        calendar_session.call_tool(
            "list_events",
            {},
        )
    )

    weather, calendar = await asyncio.gather(
        weather_task,
        calendar_task,
    )

    return weather, calendar
```

두 서버 호출 사이에 의존성이 없다면 대기 시간을 겹칠 수 있다.

---

## 33. MCP 호출을 상태 변화로 표현하기

MCP의 `list_tools()` 호출을 Task 상태 중심으로 다시 표현해보자.

초기 상태:

```text
Task 상태: Ready
Coroutine 위치: list_tools 시작 전
```

실행 시작:

```text
Task 상태: Running
Coroutine 위치: self.session.list_tools() 호출
```

네트워크 응답 대기:

```text
Task 상태: Waiting
Coroutine 위치: await self.session.list_tools()
대기 대상: MCP 응답 Future
Event Loop: 다른 Task 실행 가능
```

응답 도착:

```text
MCP 응답 Future: Finished
Task 상태: Ready
Task가 Event Loop 준비 큐에 등록
```

재개:

```text
Task 상태: Running
Coroutine 위치: await 다음
result에 ListToolsResult 저장
```

완료:

```text
return result.tools
Task 상태: Finished
Task 결과: list[types.Tool]
```

이 상태 변화를 이해하면 `await`가 "멈춰 있는 코드"가 아니라 "이벤트 루프가 관리하는 상태 전이"라는 점이 분명해진다.

---

## 34. 디버깅할 때 볼 수 있는 객체

Python에서는 현재 Task를 조회할 수 있다.

```python
task = asyncio.current_task()

print(task)
```

실행 중인 모든 Task를 확인할 수도 있다.

```python
tasks = asyncio.all_tasks()

for task in tasks:
    print(task)
```

Task의 완료 여부는 다음처럼 확인한다.

```python
task.done()
```

취소 여부:

```python
task.cancelled()
```

완료 결과:

```python
task.result()
```

예외:

```python
task.exception()
```

단, 완료되지 않은 Task에서 `result()`를 호출하면 아직 결과를 읽을 수 없다.

일반적인 코드에서는 직접 상태를 반복 확인하기보다 `await task`를 사용한다.

이러한 API는 Task가 단순한 함수 호출이 아니라 상태를 가진 실행 객체라는 점을 보여준다.

---

## 35. 직접 확인할 수 있는 작은 실험

다음 코드를 실행하면 코루틴과 Task의 차이를 확인할 수 있다.

```python
import asyncio


async def job(name: str) -> str:
    print(f"{name}: start")
    await asyncio.sleep(1)
    print(f"{name}: end")
    return name


async def main() -> None:
    coroutine = job("A")

    print(type(coroutine))
    print("coroutine created")

    task = asyncio.create_task(coroutine)

    print(type(task))
    print("task created")

    result = await task

    print(f"result: {result}")


asyncio.run(main())
```

확인할 부분은 다음과 같다.

```text
job("A")를 호출한 직후에는 본문이 실행되는가
create_task() 이후에는 언제 본문이 실행되는가
asyncio.sleep() 동안 프로그램은 어디에 있는가
await task는 무엇을 반환하는가
```

동시 실행도 비교해볼 수 있다.

```python
import asyncio
import time


async def job(name: str) -> None:
    print(f"{name}: start")
    await asyncio.sleep(1)
    print(f"{name}: end")


async def sequential() -> None:
    await job("A")
    await job("B")


async def concurrent() -> None:
    await asyncio.gather(
        job("A"),
        job("B"),
    )


async def main() -> None:
    start = time.perf_counter()
    await sequential()
    print(
        "sequential:",
        time.perf_counter() - start,
    )

    start = time.perf_counter()
    await concurrent()
    print(
        "concurrent:",
        time.perf_counter() - start,
    )


asyncio.run(main())
```

대략 다음 차이를 볼 수 있다.

```text
sequential: 약 2초
concurrent: 약 1초
```

두 번째 코드가 CPU 병렬 실행을 한 것이 아니라, 두 개의 타이머 대기를 동시에 진행했기 때문이다.

---

## 36. 가장 중요한 정신 모델

Python에서 다음 코드를 보면:

```python
result = await operation()
```

머릿속에서는 다음과 같이 해석하면 된다.

```text
1. operation()을 호출해 awaitable을 얻는다.

2. 현재 Task가 awaitable의 완료를 요청한다.

3. 결과가 이미 준비되어 있다면:
   즉시 결과를 받아 다음 줄을 실행한다.

4. 결과가 준비되지 않았다면:
   현재 코루틴의 실행 위치와 지역변수를 보존한다.
   현재 Task를 대기 상태로 만든다.
   완료될 Future와 Task를 연결한다.
   Event Loop에 실행권을 반환한다.

5. 작업이 완료되면:
   Future에 결과 또는 예외가 저장된다.
   현재 Task가 실행 가능 상태로 예약된다.

6. Event Loop가 Task를 다시 실행한다.

7. await 표현식이 결과를 반환하거나 예외를 발생시킨다.

8. 다음 줄부터 실행을 계속한다.
```

Python의 핵심 객체를 압축하면 다음과 같다.

```text
Coroutine
중단과 재개가 가능한 async 함수의 실행 상태

Task
Coroutine을 Event Loop에서 실행하고 관리

Future
나중에 완료될 결과 또는 예외

Event Loop
실행 가능한 Task와 I/O 이벤트를 스케줄링

Awaitable
await를 통해 완료를 기다릴 수 있는 객체
```

이 다섯 요소의 관계는 다음과 같다.

```text
async 함수 호출
→ Coroutine 생성
→ Task가 Coroutine 실행
→ Coroutine이 Future를 await
→ Task 중단
→ Event Loop가 다른 작업 실행
→ Future 완료
→ Event Loop가 Task 재개
→ Coroutine 계속 실행
```

---

## 마무리

Python의 `async/await`는 단순히 함수를 비동기로 실행하는 문법이 아니다.

그 내부에는 다음과 같은 실행 구조가 있다.

```text
Coroutine Object
함수의 실행 상태를 보존한다.

Task
코루틴을 이벤트 루프에서 실행한다.

Future
아직 준비되지 않은 결과를 표현한다.

Event Loop
실행 가능한 Task와 완료된 I/O를 연결한다.

await
현재 Task를 필요할 때 중단하고,
결과가 준비된 뒤 다시 실행되도록 연결한다.
```

MCP 코드의 다음 한 줄도 같은 원리로 동작한다.

```python
result = await self.session.list_tools()
```

이 코드는 MCP 서버의 응답이 올 때까지 이벤트 루프 스레드를 정지시키는 것이 아니다.

```text
MCP 요청 전송
→ 응답 Future 대기
→ 현재 Task 중단
→ Event Loop가 다른 작업 처리
→ MCP 응답 도착
→ Future 완료
→ Task 재개
→ result에 응답 저장
```

C++20과 비교하면 Python은 다음 요소를 런타임 뒤에 숨긴다.

```text
C++ coroutine_handle
→ Python Task가 실행과 재개를 관리

C++ Awaiter
→ Python Awaitable과 Future가 대기 관계를 표현

C++ Executor 또는 I/O Runtime
→ Python asyncio Event Loop가 스케줄링
```

따라서 Python의 `await`를 가장 정확하게 설명하면 다음과 같다.

> `await`는 현재 스레드를 멈추는 문법이 아니라, 현재 Task가 특정 awaitable의 완료를 기다리도록 등록하고 이벤트 루프에 실행권을 반환하는 문법이다.

다음 글에서는 JavaScript의 `async/await`를 살펴본다.

Python과 문법은 매우 비슷하지만 내부 중심 객체는 다르다.

```text
Python
Coroutine + Task + Future + Event Loop

JavaScript
async function + Promise + Microtask Queue + Event Loop
```

특히 Promise의 `.then()`과 `await`가 어떤 관계인지, Promise 완료 후 코드가 왜 `setTimeout()`보다 먼저 실행되는지, microtask queue를 중심으로 살펴볼 것이다.
