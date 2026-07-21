---
title: "async/await는 스레드를 멈추는 문법이 아니다"
description: "C++, JavaScript, Python, Java에 공통으로 적용되는 비동기 실행의 구조를 코루틴, continuation, Future/Promise, 이벤트 루프 중심으로 정리합니다."
pubDate: "2026-07-22T00:00:00+09:00"
categories: "Programming"
slug: "programming/async-await-common-principles"
tags: ["Async", "Coroutine", "C++", "JavaScript", "Python", "Java"]
---

## 비동기 실행의 공통 원리 이해하기

`async`와 `await`를 처음 배우면 보통 이렇게 이해하기 쉽습니다.

> `async`는 비동기 함수이고, `await`는 작업이 끝날 때까지 기다리는 문법이다.

틀린 설명은 아닙니다. 하지만 이 정도만 알고 있으면 곧 여러 의문이 생깁니다.

* `await`로 기다리는데 왜 프로그램 전체는 멈추지 않을까?
* 함수가 중간에 멈췄다가 어떻게 같은 위치에서 다시 실행될까?
* `Promise`, `Future`, `Task`, `Coroutine`은 서로 무엇이 다를까?
* 비동기와 멀티스레드는 같은 개념일까?
* `async` 함수 안에서 일반적인 블로킹 함수를 호출하면 왜 문제가 될까?

이 글에서는 특정 언어의 문법보다 먼저, C++, JavaScript, Python, Java에 공통으로 적용되는 **비동기 실행의 구조**를 정리한다.

핵심 질문은 하나다.

> 함수가 아직 끝나지 않았는데 어떻게 실행권을 돌려주고, 나중에 중단한 위치에서 다시 실행할 수 있을까?

---

## 1. 먼저 동기 실행부터 생각해보자

일반적인 함수 호출은 다음과 같이 동작한다.

```text
호출자
  ↓
함수 호출
  ↓
함수 실행
  ↓
결과 반환
  ↓
호출자 다음 코드 실행
```

예를 들어 다음 코드를 보자.

```cpp
int result = request_data();
print(result);
```

`request_data()`가 끝나기 전에는 `print(result)`를 실행할 수 없다.

함수 호출 중에는 호출한 함수의 실행 상태가 스택에 저장된다.

```text
main 함수의 스택 프레임
└─ request_data 함수의 스택 프레임
```

여기서 **스택 프레임**은 함수 실행에 필요한 정보를 저장하는 공간이다.

보통 다음과 같은 정보가 들어간다.

```text
지역변수
매개변수
함수가 끝난 뒤 돌아갈 위치
중간 계산 결과
```

`request_data()`가 반환되면 해당 스택 프레임은 사라지고, 호출자는 다음 줄부터 실행한다.

이 방식은 이해하기 쉽고 코드 흐름도 명확하다.

문제는 함수 내부에 오래 걸리는 대기 작업이 포함될 때 발생한다.

---

## 2. 블로킹은 무엇인가

다음 함수가 네트워크를 통해 서버에 데이터를 요청한다고 해보자.

```cpp
Data request_data() {
    send_request();
    return wait_for_response();
}
```

요청을 전송하는 시간은 매우 짧을 수 있다.

하지만 서버 응답을 받기까지는 수십 밀리초에서 수초가 걸릴 수 있다.

그동안 CPU가 계속 계산하고 있는 것은 아니다.

```text
요청 전송
→ 서버 응답 대기
→ 응답 수신
```

대부분의 시간은 단순히 기다리는 시간이다.

이때 현재 스레드가 응답이 올 때까지 아무 일도 하지 못하면 이를 **블로킹**이라고 한다.

```text
현재 스레드
  ↓
네트워크 응답 대기
  ↓
다른 작업 수행 불가
```

블로킹 자체가 항상 나쁜 것은 아니다.

작업 수가 적고 구조가 단순하다면 오히려 블로킹 코드가 읽기 쉽고 관리하기 편하다.

문제는 동시에 많은 작업을 처리해야 할 때다.

예를 들어 서버가 1,000개의 네트워크 요청을 동시에 처리해야 한다고 하자.

각 요청마다 하나의 스레드를 사용하면 다음과 같은 비용이 생긴다.

```text
스레드별 스택 메모리
운영체제 스케줄링 비용
컨텍스트 스위칭
동기화 비용
스레드 수 증가에 따른 관리 부담
```

네트워크 응답을 기다리는 작업이 대부분이라면, 많은 스레드를 만들어 놓고 실제로는 대부분 대기시키는 구조가 된다.

비동기 처리는 바로 이 문제를 해결하려고 등장했다.

---

## 3. 비동기의 핵심은 "기다리지 않는 것"이 아니다

비동기를 단순히 다음처럼 설명하는 경우가 많다.

> 비동기는 작업이 끝날 때까지 기다리지 않는 방식이다.

하지만 조금 더 정확하게 말하면 다음과 같다.

> 현재 실행 흐름을 붙잡은 채 기다리지 않고, 결과가 준비되면 나중에 이어서 실행하는 방식이다.

비동기 작업도 결국 결과를 기다린다.

차이는 기다리는 동안 무엇이 멈추는가에 있다.

동기 블로킹 방식에서는 현재 스레드가 멈춘다.

```text
작업 A 실행
→ I/O 대기
→ 스레드 정지
→ 응답 도착
→ 작업 A 계속 실행
```

비동기 방식에서는 현재 작업만 중단되고, 실행 주체는 다른 작업을 처리할 수 있다.

```text
작업 A 실행
→ I/O 대기
→ 작업 A 중단
→ 작업 B 실행
→ 작업 C 실행
→ A의 응답 도착
→ 작업 A 재개
```

따라서 비동기 처리에서 중요한 것은 단순히 "기다리지 않는다"가 아니다.

다음 세 가지가 핵심이다.

```text
현재 작업의 실행 상태 저장
실행권 반환
결과가 준비되면 중단한 작업 재개
```

---

## 4. 함수가 중간에 멈추려면 무엇을 저장해야 할까

다음과 같은 함수가 있다고 하자.

```python
async def load_user():
    user_id = 10
    user = await request_user(user_id)
    return user.name
```

이 함수가 `await`에서 중단되었다면, 나중에 재개하기 위해 최소한 다음 정보가 필요하다.

```text
현재 실행 위치
지역변수 user_id
기다리고 있는 작업
예외 처리 상태
재개된 뒤 결과를 저장할 위치
```

일반 함수라면 이러한 정보는 스택 프레임에 저장된다.

하지만 함수가 실행을 중단하고 호출자에게 제어권을 돌려주려면, 일반적인 함수 호출 스택만으로는 관리하기 어렵다.

그래서 코루틴은 별도의 실행 상태를 유지한다.

이를 개념적으로 **코루틴 프레임**이라고 부를 수 있다.

```cpp
struct CoroutineFrame {
    int state;
    int user_id;
    AwaitedOperation operation;
};
```

실제 언어 구현은 이보다 훨씬 복잡하지만, 핵심 구조는 비슷하다.

`state`는 현재 함수가 어디까지 실행되었는지를 나타낸다.

```text
state = 0: 실행 전
state = 1: request_user를 기다리는 중
state = 2: await 이후 재개됨
state = 3: 실행 완료
```

이렇게 보면 코루틴은 단순한 함수라기보다, 실행 상태를 내부에 보관하는 객체에 가깝다.

---

## 5. 코루틴은 상태 머신처럼 동작한다

다음 코드를 다시 보자.

```python
async def load_user():
    user_id = 10
    user = await request_user(user_id)
    return user.name
```

이 코드는 개념적으로 다음과 같은 상태 머신으로 변환할 수 있다.

```cpp
Result resume(CoroutineFrame& frame) {
    switch (frame.state) {
    case 0:
        frame.user_id = 10;
        frame.operation = request_user(frame.user_id);

        if (!frame.operation.is_ready()) {
            frame.state = 1;
            return Suspended;
        }

        [[fallthrough]];

    case 1:
        User user = frame.operation.get_result();
        frame.state = 2;
        return Completed(user.name);
    }
}
```

실제 Python, JavaScript, C++ 컴파일러나 런타임이 정확히 이 코드를 생성한다는 뜻은 아니다.

하지만 정신 모델로는 매우 유용하다.

코루틴의 동작을 정리하면 다음과 같다.

```text
처음 실행
→ 첫 번째 중단 지점까지 진행
→ 현재 상태 저장
→ 실행 중단
→ 나중에 재개
→ 저장된 상태를 확인
→ 중단 지점 다음 코드부터 진행
```

따라서 코루틴은 "함수가 잠시 얼어붙었다가 깨어난다"기보다 다음에 가깝다.

> 실행 상태를 객체에 저장하고, 나중에 상태 번호에 따라 다음 부분을 실행한다.

---

## 6. suspend와 resume

코루틴을 이해할 때 가장 중요한 두 단어는 `suspend`와 `resume`이다.

### suspend

`suspend`는 현재 코루틴의 실행을 중단하고 제어권을 외부에 돌려주는 것이다.

```text
현재 위치 저장
지역변수 저장
대기 작업 등록
호출자 또는 스케줄러에 제어권 반환
```

중요한 점은 현재 코루틴이 종료된 것이 아니라는 것이다.

```text
종료됨: 다시 실행할 수 없음
중단됨: 나중에 이어서 실행 가능
```

### resume

`resume`은 중단된 코루틴을 다시 실행하는 것이다.

```text
저장된 상태 확인
중단 지점 복원
await 결과 전달
다음 코드 실행
```

C++ 관점에서는 코루틴 핸들을 통해 다음과 같이 생각할 수 있다.

```cpp
coroutine_handle.resume();
```

실제 다른 언어에서는 이 과정이 런타임이나 이벤트 루프 뒤에 숨겨져 있다.

하지만 공통 원리는 같다.

```text
중단된 실행 상태를 보관
→ 결과가 준비됨
→ 실행 가능 상태로 변경
→ 다시 실행
```

---

## 7. continuation이란 무엇인가

비동기 실행을 이해하기 위해 꼭 알아야 하는 개념이 하나 있다.

**Continuation**은 현재 작업이 끝난 뒤 이어서 실행할 코드 또는 실행 위치를 의미한다.

예를 들어 다음 코드가 있다고 하자.

```python
result = await request_data()
print(result)
```

여기서 continuation은 개념적으로 다음 부분이다.

```python
print(result)
```

즉, `request_data()`가 끝난 뒤 무엇을 실행해야 하는지를 나타낸다.

콜백 방식에서는 continuation을 함수로 직접 전달한다.

```javascript
requestData(function (result) {
    console.log(result);
});
```

여기서 콜백 함수가 continuation이다.

Promise에서는 `.then()`으로 continuation을 등록한다.

```javascript
requestData().then(function (result) {
    console.log(result);
});
```

async/await에서는 continuation이 문법 뒤에 숨겨진다.

```javascript
const result = await requestData();
console.log(result);
```

겉으로는 순차 코드처럼 보이지만 내부적으로는 다음 구조가 존재한다.

```text
requestData 완료
→ await 이후 코드 실행
```

즉, async/await는 콜백을 없앤 것이 아니다.

> 콜백과 continuation을 코루틴 상태 머신 뒤에 숨겨, 동기 코드처럼 읽히게 만든 문법이다.

---

## 8. Future와 Promise는 무엇인가

비동기 작업은 시작했지만 결과가 아직 준비되지 않을 수 있다.

이때 "나중에 생길 결과"를 표현하는 객체가 필요하다.

언어와 라이브러리에 따라 이를 다음과 같이 부른다.

```text
Future
Promise
Task
Deferred
CompletionStage
```

이 객체는 일반적으로 다음 상태를 가진다.

```text
Pending
아직 결과가 준비되지 않음

Completed / Fulfilled
결과가 준비됨

Failed / Rejected
예외 또는 오류로 종료됨
```

개념적인 구조는 다음과 같다.

```cpp
template<typename T>
struct Future {
    bool completed;
    T result;
    Exception error;
    List<Continuation> continuations;
};
```

결과가 아직 없다면 대기 중인 작업을 등록한다.

```text
Future가 미완료
→ 현재 continuation 등록
→ 현재 코루틴 중단
```

나중에 작업이 완료되면 결과를 저장하고 등록된 continuation을 실행 가능 상태로 만든다.

```text
I/O 작업 완료
→ Future에 결과 저장
→ 기다리던 작업 깨우기
→ 중단된 코루틴 재개
```

여기서 중요한 점은 Future나 Promise가 실제 작업 자체와 동일하지 않을 수도 있다는 것이다.

Future는 보통 다음을 표현한다.

> 이 작업의 결과는 지금 없지만 나중에 제공될 것이다.

---

## 9. await는 실제로 무엇을 하는가

`await`를 단순히 "기다리는 문법"으로 이해하면 블로킹과 구분하기 어렵다.

조금 더 정확하게 분해하면 `await`는 개념적으로 다음 작업을 수행한다.

```text
1. 기다릴 객체를 얻는다.
2. 결과가 이미 준비됐는지 확인한다.
3. 준비되지 않았다면 현재 실행 상태를 저장한다.
4. 현재 코루틴을 대기 상태로 만든다.
5. 실행권을 스케줄러나 이벤트 루프에 반환한다.
6. 결과가 준비되면 코루틴을 재개한다.
7. 완료 결과를 await 표현식의 반환값으로 전달한다.
```

C++20 코루틴의 awaiter 모델로 표현하면 이해하기 쉽다.

```cpp
awaiter.await_ready();
awaiter.await_suspend(handle);
awaiter.await_resume();
```

각각의 역할은 다음과 같다.

```text
await_ready
결과가 이미 준비되었는가?

await_suspend
준비되지 않았다면 현재 코루틴을 중단하고 재개 정보를 저장

await_resume
코루틴이 재개되었을 때 결과를 반환하거나 예외를 전달
```

다른 언어가 이 세 메서드를 그대로 사용하지 않더라도, 구조적으로는 유사한 단계를 거친다.

---

## 10. await가 있다고 반드시 중단되는 것은 아니다

다음 코드를 보자.

```python
result = await operation()
```

`await`가 있으므로 반드시 코루틴이 중단될 것처럼 보인다.

하지만 결과가 이미 준비되어 있다면 실제 중단이 필요하지 않다.

예를 들어 다음과 같은 경우다.

```text
캐시에 결과가 존재함
Future가 이미 완료됨
즉시 반환할 수 있는 작업
```

이 경우에는 실행권을 넘기지 않고 바로 다음 코드를 실행할 수 있다.

따라서 `await`의 정확한 의미는 다음과 같다.

> 결과가 준비되지 않았다면 현재 코루틴을 중단하고, 준비되었다면 즉시 계속 실행한다.

즉, `await`는 반드시 발생하는 중단 명령이 아니라 **조건부 중단 지점**이다.

---

## 11. 이벤트 루프와 스케줄러

중단된 작업을 나중에 다시 실행하려면 누군가 다음을 관리해야 한다.

```text
현재 실행 가능한 작업
I/O를 기다리는 작업
타이머를 기다리는 작업
완료된 작업
다시 실행할 작업
```

이 역할을 하는 것이 이벤트 루프 또는 스케줄러다.

아주 단순화하면 다음과 같다.

```python
while running:
    completed_events = check_io_events()

    for event in completed_events:
        mark_task_runnable(event.task)

    task = get_next_runnable_task()
    task.run_until_suspend_or_complete()
```

이벤트 루프는 작업을 끝까지 무조건 실행시키지 않는다.

하나의 작업은 보통 다음 중 하나가 될 때까지 실행된다.

```text
완료됨
await에서 중단됨
예외 발생
명시적으로 실행권을 양보함
```

작업이 I/O를 기다리게 되면 이벤트 루프는 다른 실행 가능한 작업을 선택한다.

```text
Task A 실행
→ I/O 대기
→ Task A 중단

Task B 실행
→ 타이머 대기
→ Task B 중단

Task C 실행
→ 완료

A의 I/O 완료
→ Task A 재개
```

이 구조 덕분에 하나의 스레드에서도 여러 작업의 대기 시간을 겹칠 수 있다.

---

## 12. 운영체제는 I/O 완료를 어떻게 알려줄까

이벤트 루프가 수많은 네트워크 연결을 계속 반복해서 확인하는 것은 비효율적이다.

대신 운영체제가 제공하는 I/O 알림 기능을 사용한다.

개념적으로 애플리케이션은 운영체제에 다음과 같이 요청한다.

```text
이 소켓에서 데이터를 읽을 수 있게 되면 알려줘.
```

운영체제는 해당 소켓에 데이터가 도착했을 때 이벤트를 전달한다.

플랫폼에 따라 대표적인 메커니즘은 다음과 같다.

```text
Linux: epoll
macOS, BSD: kqueue
Windows: IOCP 계열
```

이벤트 루프는 운영체제에서 완료 이벤트를 받고, 해당 작업을 다시 실행 가능 상태로 바꾼다.

```text
네트워크 데이터 도착
→ 운영체제가 이벤트 전달
→ 이벤트 루프가 Future 완료 처리
→ 기다리던 Task를 runnable 상태로 변경
→ 코루틴 재개
```

따라서 비동기 네트워크 처리는 언어 문법만으로 이루어지는 것이 아니다.

다음 계층이 함께 동작한다.

```text
언어의 async/await 문법
코루틴 또는 continuation
Future/Promise
이벤트 루프 또는 스케줄러
운영체제의 비동기 I/O 기능
```

---

## 13. 동시성과 병렬성은 다르다

비동기를 이해할 때 가장 자주 혼동되는 개념이 동시성과 병렬성이다.

### 동시성

동시성은 여러 작업의 진행 시간이 겹치는 것이다.

```text
Task A 실행
→ A 대기
→ Task B 실행
→ B 대기
→ Task A 재개
```

한 순간에 하나의 작업만 CPU에서 실행되더라도, 여러 작업이 번갈아 진행되므로 동시성이 존재한다.

### 병렬성

병렬성은 여러 작업이 실제로 같은 순간에 실행되는 것이다.

```text
CPU Core 1: Task A
CPU Core 2: Task B
```

병렬 실행에는 일반적으로 여러 CPU 코어나 여러 스레드가 필요하다.

async/await는 기본적으로 동시성을 위한 도구다.

```text
async/await
→ 대기 시간을 겹침
→ I/O 중심 작업에서 효율적
```

반면 CPU 계산을 동시에 처리하려면 병렬 처리 기법이 필요하다.

```text
멀티스레딩
멀티프로세싱
병렬 알고리즘
GPU 연산
```

물론 비동기와 병렬성을 함께 사용할 수도 있다.

예를 들어 이벤트 루프가 CPU 작업을 별도의 스레드 풀에 넘길 수 있다.

하지만 두 개념은 같은 것이 아니다.

---

## 14. 코루틴과 스레드는 무엇이 다른가

스레드와 코루틴은 모두 실행 흐름을 표현하지만 관리 방식이 다르다.

### 스레드

스레드는 운영체제가 스케줄링한다.

운영체제는 실행 중인 스레드를 임의의 시점에 중단할 수 있다.

이를 **선점형 스케줄링**이라고 한다.

```text
스레드 A 실행 중
→ 운영체제가 실행권 회수
→ 스레드 B 실행
```

스레드를 전환할 때는 다음 상태를 저장해야 한다.

```text
CPU 레지스터
스택 포인터
명령어 포인터
스레드 로컬 상태
```

### 코루틴

코루틴은 보통 특정 중단 지점에서 스스로 실행권을 돌려준다.

이를 **협력적 스케줄링**이라고 한다.

```text
코루틴 A 실행
→ await 도달
→ 실행권 양보
→ 코루틴 B 실행
```

코루틴 전환 시에는 해당 코루틴이 재개되는 데 필요한 상태를 저장한다.

```text
실행 위치
살아 있는 지역변수
대기 중인 객체
예외 상태
```

코루틴은 일반적으로 스레드보다 가볍다.

하지만 중요한 단점이 있다.

코루틴이 실행권을 양보하지 않으면 다른 코루틴이 실행되지 못할 수 있다.

---

## 15. async 함수가 이벤트 루프를 막을 수도 있다

`async`가 붙은 함수라고 해서 내부 코드가 자동으로 비동기가 되는 것은 아니다.

다음 코드를 보자.

```python
async def calculate():
    while True:
        do_heavy_cpu_work()
```

이 함수에는 다른 작업에 실행권을 넘기는 지점이 없다.

따라서 이벤트 루프의 한 스레드에서 실행된다면 다른 비동기 작업이 실행되지 못할 수 있다.

또한 다음 코드도 문제가 된다.

```python
async def load():
    time.sleep(5)
    return "done"
```

`time.sleep(5)`는 현재 스레드를 실제로 멈추는 블로킹 함수다.

따라서 이벤트 루프 스레드에서 실행하면 다음과 같이 된다.

```text
현재 코루틴만 중단되는 것이 아님
→ 이벤트 루프 스레드 전체 정지
→ 다른 모든 코루틴 실행 불가
```

비동기 타이머를 사용하면 다르게 동작한다.

```python
async def load():
    await asyncio.sleep(5)
    return "done"
```

이 경우에는 현재 코루틴만 대기 상태가 되고 이벤트 루프는 다른 작업을 실행한다.

중요한 원칙은 다음과 같다.

> `async` 함수 안에 있다고 해서 블로킹 코드가 비동기 코드로 바뀌는 것은 아니다.

비동기의 이점을 얻으려면 내부 작업 역시 비동기 I/O를 지원하거나, 블로킹 작업을 별도의 스레드나 프로세스로 넘겨야 한다.

---

## 16. 비동기 코드도 결국 누군가는 실행해야 한다

가끔 비동기 코드를 "아무 스레드도 사용하지 않는 실행"처럼 오해한다.

하지만 코드는 항상 어떤 스레드에서 실행된다.

비동기 처리의 핵심은 스레드를 없애는 것이 아니다.

> 하나의 스레드가 I/O 대기 때문에 붙잡히지 않도록 하는 것이다.

예를 들어 단일 스레드 이벤트 루프에서는 다음과 같이 실행될 수 있다.

```text
Event Loop Thread
├─ Task A의 일부 실행
├─ Task B의 일부 실행
├─ Task C의 일부 실행
└─ Task A의 나머지 실행
```

각 Task는 동시에 실행되는 것처럼 보이지만, 실제 Python 또는 JavaScript 코드가 한 시점에 하나씩 실행될 수 있다.

다만 네트워크, 파일 시스템, 데이터베이스 같은 외부 작업은 운영체제나 별도 스레드에서 진행될 수 있다.

---

## 17. 일반적인 비동기 실행 흐름

지금까지의 내용을 하나의 흐름으로 정리해보자.

다음 코드가 있다고 하자.

```python
async def call_api():
    result = await send_request()
    return parse(result)
```

실행 흐름은 다음과 같다.

```text
1. call_api 실행 시작

2. send_request 호출
   비동기 작업을 나타내는 객체 반환

3. await 실행
   결과가 준비됐는지 확인

4. 아직 준비되지 않음
   현재 실행 위치와 지역변수 저장

5. 현재 코루틴 중단
   이벤트 루프에 제어권 반환

6. 이벤트 루프가 다른 작업 실행

7. 네트워크 응답 도착
   운영체제가 완료 이벤트 전달

8. Future 또는 Promise 완료

9. call_api를 다시 실행 가능 상태로 변경

10. 이벤트 루프가 call_api 재개

11. await 표현식이 결과 반환

12. parse(result) 실행

13. 코루틴 완료
```

이를 한 줄로 압축하면 다음과 같다.

```text
작업 시작
→ 결과 객체 생성
→ 현재 코루틴 중단
→ 다른 작업 실행
→ 결과 준비
→ 코루틴 재개
```

---

## 18. 언어마다 이름은 달라도 구조는 비슷하다

C++, JavaScript, Python, Java는 서로 다른 실행 모델을 가지고 있다.

하지만 공통된 질문은 같다.

```text
비동기 결과를 무엇으로 표현하는가?
현재 실행 상태를 어디에 저장하는가?
중단은 어떻게 일어나는가?
결과 완료를 누가 감지하는가?
중단된 작업을 누가 재개하는가?
```

언어별로 대응하면 대략 다음과 같다.

| 역할        | C++20            | JavaScript           | Python                | Java                                   |
| --------- | ---------------- | -------------------- | --------------------- | -------------------------------------- |
| 중단 가능한 실행 | Coroutine        | async function       | Coroutine             | 방식에 따라 다름                              |
| 중단 지점     | `co_await`       | `await`              | `await`               | continuation 또는 가상 스레드 대기              |
| 미래 결과     | `task<T>` 등      | `Promise<T>`         | `Future`, `Task`      | `CompletableFuture<T>`                 |
| 실행 관리자    | 라이브러리 실행기        | Event Loop           | asyncio Event Loop    | Executor, Reactor, JVM                 |
| 재개 정보     | coroutine handle | Promise continuation | Task와 coroutine frame | callback, continuation, virtual thread |

구현 방식은 다르지만 근본적인 구조는 비슷하다.

```text
실행 상태 저장
→ 결과 대기
→ 실행권 양보
→ 결과 완료
→ 저장된 실행 상태 재개
```

---

## 19. 블로킹, 논블로킹, 비동기라는 단어의 관계

이 세 단어도 자주 섞여 사용된다.

### 블로킹

호출한 작업이 끝날 때까지 현재 실행 흐름이 멈춘다.

```text
호출
→ 완료될 때까지 대기
→ 결과 반환
```

### 논블로킹

호출한 작업이 즉시 반환된다.

결과가 아직 준비되지 않았다면 "아직 준비되지 않음"을 반환할 수도 있다.

```text
호출
→ 즉시 반환
→ 호출자가 나중에 다시 확인
```

### 비동기

작업 완료를 나중에 알림받거나 continuation을 실행한다.

```text
작업 시작
→ 즉시 제어권 반환
→ 완료 시 콜백, Future, 이벤트 등으로 통지
```

논블로킹은 호출 방식에 관한 개념이고, 비동기는 완료 전달 방식에 관한 개념에 가깝다.

실제 프레임워크에서는 두 개념이 함께 사용되는 경우가 많다.

```text
논블로킹 I/O
+
이벤트 기반 완료 알림
+
코루틴 또는 callback
```

그 결과 개발자는 async/await 문법으로 순차적인 코드처럼 작성할 수 있다.

---

## 20. async/await가 해결하는 진짜 문제

async/await의 목적을 단순히 코드를 짧게 만드는 것으로 보면 부족하다.

이 문법이 해결하는 진짜 문제는 다음과 같다.

콜백 기반 비동기 코드는 작업 흐름이 중첩되기 쉽다.

```javascript
getUser(function (user) {
    getOrders(user, function (orders) {
        saveOrders(orders, function () {
            console.log("done");
        });
    });
});
```

Promise를 사용하면 중첩을 줄일 수 있다.

```javascript
getUser()
    .then(getOrders)
    .then(saveOrders)
    .then(() => console.log("done"));
```

async/await를 사용하면 순차적인 코드처럼 표현할 수 있다.

```javascript
const user = await getUser();
const orders = await getOrders(user);
await saveOrders(orders);
console.log("done");
```

세 코드 모두 본질적으로 continuation을 연결한다.

차이는 표현 방식이다.

async/await는 다음을 가능하게 한다.

```text
비동기 작업을 순차 코드처럼 표현
지역변수를 자연스럽게 유지
try/catch로 예외 처리
반복문과 조건문을 일반 코드처럼 사용
콜백 중첩 감소
```

즉, async/await는 비동기를 새로 만든 기능이라기보다 다음에 가깝다.

> 기존의 callback, Future, Promise 기반 비동기 실행을 함수 중단과 재개 문법으로 표현한 것

---

## 21. 가장 중요한 정신 모델

`await`를 만났을 때 다음처럼 생각하면 된다.

```text
여기서 스레드를 멈춘다
```

가 아니라:

```text
이 작업의 결과가 아직 없다면
현재 함수의 실행 상태를 저장하고
실행권을 스케줄러에 돌려준다.

결과가 준비되면
저장된 상태에서 다시 실행한다.
```

C++식으로 더 압축하면 다음과 같다.

```text
Coroutine Frame
+
State
+
Continuation
+
Scheduler
```

비동기 실행은 이 네 요소의 협력이다.

* **Coroutine Frame**: 지역변수와 실행 상태를 보존한다.
* **State**: 어디까지 실행했는지 나타낸다.
* **Continuation**: 완료 후 어디서 이어서 실행할지 나타낸다.
* **Scheduler**: 실행 가능한 작업을 선택하고 재개한다.

Future나 Promise는 그 사이에서 결과와 완료 상태를 전달한다.

```text
비동기 작업
→ Future/Promise
→ 완료 알림
→ continuation 실행
→ coroutine resume
```

---

## 마무리

async/await는 스레드를 자동으로 만들거나 코드를 병렬로 실행하는 마법 같은 문법이 아니다.

그 핵심은 훨씬 구조적이다.

```text
함수의 실행 상태를 저장하고
대기하는 동안 실행권을 양보한 뒤
결과가 준비되면 중단한 위치에서 다시 실행한다.
```

이를 가능하게 만드는 요소는 다음과 같다.

```text
Coroutine
Suspend / Resume
Continuation
Future / Promise
Event Loop / Scheduler
운영체제 I/O 알림
```

언어마다 사용하는 이름과 구현 방식은 다르지만 해결하려는 문제는 같다.

> 오래 걸리는 대기 작업 때문에 실행 스레드를 붙잡지 않으면서도, 코드를 순차적인 형태로 작성하고 싶다.

다음 글에서는 이 공통 구조가 C++20에서 어떻게 구현되는지 살펴본다.

특히 다음 요소를 중심으로 코루틴 내부를 더 낮은 수준에서 확인할 것이다.

```text
코루틴 프레임
promise_type
coroutine_handle
co_await
await_ready
await_suspend
await_resume
initial_suspend
final_suspend
```

C++20 코루틴을 이해하면 JavaScript와 Python의 async/await 역시 단순한 문법이 아니라, 상태 머신과 continuation 위에서 동작하는 실행 모델이라는 점이 더 명확해진다.
