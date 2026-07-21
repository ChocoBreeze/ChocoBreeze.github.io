---
title: "JavaScript async/await 내부 구조 이해하기"
description: "Promise, Microtask Queue, Event Loop가 어떻게 연결되어 async/await의 중단과 재개를 만드는지 MCP 호출 예제로 정리합니다."
pubDate: "2026-07-25T00:00:00+09:00"
categories: "Programming"
slug: "programming/javascript-promise-event-loop-internals"
tags: ["Async", "JavaScript", "Promise", "Event Loop"]
---

## Promise, Microtask Queue, Event Loop는 어떻게 연결되는가

앞선 글에서는 Python의 비동기 실행 구조를 살펴봤다.

Python에서는 다음 객체들이 중심이었다.

```text
Coroutine
Task
Future
Event Loop
```

JavaScript에서도 `async`와 `await`를 사용한다.

```javascript
async function loadData() {
    const result = await requestData();
    return result;
}
```

문법만 보면 Python과 거의 같다.

```python
async def load_data():
    result = await request_data()
    return result
```

하지만 내부에서 중심이 되는 객체는 다르다.

Python에서는 코루틴을 `Task`가 실행하고, `Future`가 완료되면 이벤트 루프가 Task를 다시 실행한다.

JavaScript에서는 **Promise**가 비동기 결과와 continuation을 연결하는 중심 역할을 한다.

```text
Python
Coroutine
→ Task
→ Future
→ Event Loop

JavaScript
async function
→ Promise
→ Microtask
→ Event Loop
```

이 글에서는 JavaScript의 다음 코드를 기준으로 내부 구조를 살펴본다.

```javascript
async function callTool(toolName, toolInput) {
    return await session.callTool(toolName, toolInput);
}
```

핵심 질문은 다음과 같다.

> `await session.callTool()`에서 함수가 중단되었을 때, JavaScript는 무엇을 저장하고 누가 `await` 다음 코드를 다시 실행하는가?

---

## 1. JavaScript의 `async function`은 항상 Promise를 반환한다

먼저 일반 함수를 보자.

```javascript
function add(a, b) {
    return a + b;
}
```

함수를 호출하면 결과가 바로 반환된다.

```javascript
const result = add(1, 2);

console.log(result); // 3
```

이번에는 같은 함수를 `async`로 선언해보자.

```javascript
async function addAsync(a, b) {
    return a + b;
}
```

호출하면 숫자 `3`이 직접 반환되지 않는다.

```javascript
const result = addAsync(1, 2);

console.log(result);
// Promise { 3 }
```

`async function`은 반환값을 자동으로 Promise로 감싼다.

개념적으로 다음 두 함수는 비슷한 결과를 만든다.

```javascript
async function addAsync(a, b) {
    return a + b;
}
```

```javascript
function addWithPromise(a, b) {
    return Promise.resolve(a + b);
}
```

즉:

```javascript
return 3;
```

이라고 작성했더라도 `async function`의 호출자가 받는 값은 다음과 같다.

```javascript
Promise.resolve(3)
```

따라서 다음 코드에서:

```javascript
const value = addAsync(1, 2);
```

`value`의 타입은 숫자가 아니라 Promise다.

실제 숫자를 사용하려면 Promise의 완료를 기다려야 한다.

```javascript
const value = await addAsync(1, 2);

console.log(value); // 3
```

또는 `.then()`을 사용한다.

```javascript
addAsync(1, 2).then((value) => {
    console.log(value);
});
```

---

## 2. Promise는 무엇인가

Promise는 지금은 없지만 나중에 제공될 수 있는 결과를 표현하는 객체다.

Promise는 일반적으로 다음 세 상태 중 하나를 가진다.

```text
pending
아직 작업이 완료되지 않음

fulfilled
작업이 성공했고 결과가 존재함

rejected
작업이 실패했고 오류가 존재함
```

Promise는 생성된 뒤 `pending` 상태에서 시작한다.

```javascript
const promise = new Promise((resolve, reject) => {
    // 비동기 작업 실행
});
```

작업이 성공하면 `resolve()`를 호출한다.

```javascript
resolve(result);
```

작업이 실패하면 `reject()`를 호출한다.

```javascript
reject(error);
```

상태 변화는 한 방향으로만 일어난다.

```text
pending
→ fulfilled

또는

pending
→ rejected
```

한 번 완료된 Promise는 다시 pending 상태로 돌아갈 수 없다.

결과를 다른 값으로 다시 변경할 수도 없다.

```text
Promise는 한 번만 완료된다.
```

개념적으로 Promise를 다음과 같은 객체로 생각할 수 있다.

```javascript
class ConceptualPromise {
    state = "pending";
    value = undefined;
    reactions = [];

    fulfill(value) {
        if (this.state !== "pending") {
            return;
        }

        this.state = "fulfilled";
        this.value = value;

        scheduleReactions();
    }

    reject(error) {
        if (this.state !== "pending") {
            return;
        }

        this.state = "rejected";
        this.value = error;

        scheduleReactions();
    }
}
```

실제 JavaScript 엔진 내부 구현은 훨씬 복잡하지만, 핵심 구조는 비슷하다.

```text
현재 상태
완료 결과 또는 오류
완료 후 실행할 continuation 목록
```

---

## 3. Promise를 만드는 코드와 비동기 작업은 같은 것이 아니다

다음 코드를 보자.

```javascript
const promise = new Promise((resolve) => {
    setTimeout(() => {
        resolve("done");
    }, 1000);
});
```

여기에는 서로 다른 역할이 존재한다.

```text
Promise
나중에 결과가 생길 것을 표현

setTimeout
타이머 작업을 런타임에 등록

resolve
Promise를 fulfilled 상태로 변경
```

Promise가 타이머를 직접 실행하는 것은 아니다.

Promise는 타이머 작업의 결과를 표현하고, 완료 후 실행할 코드들을 연결한다.

네트워크 요청도 마찬가지다.

```javascript
const responsePromise = fetch("/api/data");
```

`fetch()`는 네트워크 작업을 시작하고 Promise를 반환한다.

```text
네트워크 작업
브라우저 또는 런타임이 수행

Promise
네트워크 작업의 미래 결과를 표현
```

따라서 Promise를 "비동기 작업 자체"라고만 설명하면 부족하다.

> Promise는 비동기 작업의 완료 결과와, 완료 후 실행할 continuation을 관리하는 객체다.

---

## 4. `.then()`은 continuation을 등록한다

Promise가 완료된 뒤 실행할 코드는 `.then()`으로 등록할 수 있다.

```javascript
fetch("/api/data")
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        console.log(data);
    });
```

첫 번째 `.then()`의 콜백은 HTTP 응답이 준비된 뒤 실행된다.

두 번째 `.then()`의 콜백은 JSON 변환 작업이 끝난 뒤 실행된다.

앞선 공통 개념 글에서 continuation은 다음과 같이 정의했다.

> 현재 작업이 완료된 다음 이어서 실행할 코드 또는 실행 위치

따라서 `.then()`에 전달한 콜백은 continuation이다.

```javascript
promise.then((value) => {
    use(value);
});
```

구조는 다음과 같다.

```text
Promise 완료
→ 등록된 continuation 실행
→ value 전달
```

C++20과 비교하면 다음처럼 볼 수 있다.

```text
C++
Awaiter가 coroutine_handle을 저장
→ 작업 완료 후 handle.resume()

JavaScript
Promise가 reaction callback을 저장
→ Promise 완료 후 callback을 microtask로 예약
```

---

## 5. `.then()`은 원래 Promise를 변경하지 않는다

다음 코드를 보자.

```javascript
const promise1 = Promise.resolve(10);

const promise2 = promise1.then((value) => {
    return value * 2;
});
```

`promise2`는 `promise1`과 다른 Promise다.

```javascript
console.log(promise1 === promise2); // false
```

`.then()`은 새로운 Promise를 반환한다.

```text
promise1 완료
→ then 콜백 실행
→ 콜백 결과로 promise2 완료
```

콜백이 일반 값을 반환하면 새 Promise는 그 값으로 fulfilled 된다.

```javascript
const promise2 = promise1.then((value) => {
    return value * 2;
});
```

```text
콜백 반환값: 20
→ promise2 fulfilled with 20
```

콜백이 Promise를 반환하면 새 Promise는 그 Promise의 완료 상태를 따라간다.

```javascript
const promise2 = promise1.then((value) => {
    return requestMoreData(value);
});
```

```text
requestMoreData가 반환한 Promise 대기
→ 해당 Promise 완료
→ promise2도 같은 결과로 완료
```

콜백에서 예외가 발생하면 새 Promise는 rejected 된다.

```javascript
const promise2 = promise1.then(() => {
    throw new Error("failed");
});
```

```text
콜백 예외 발생
→ promise2 rejected
```

이 구조 덕분에 Promise 체인을 만들 수 있다.

```javascript
getUser()
    .then(getOrders)
    .then(saveOrders)
    .then(showSuccess)
    .catch(handleError);
```

---

## 6. async/await는 Promise를 없앤 것이 아니다

다음 Promise 체인을 보자.

```javascript
function loadUserName() {
    return getUser().then((user) => {
        return user.name;
    });
}
```

`async/await`로 작성하면 다음과 같다.

```javascript
async function loadUserName() {
    const user = await getUser();
    return user.name;
}
```

두 코드는 표현 방식은 다르지만, 모두 Promise를 기반으로 한다.

```text
getUser가 Promise 반환
→ Promise 완료 대기
→ user 추출
→ 이름 반환
```

`async/await`는 Promise를 대체하지 않는다.

> Promise 기반 continuation을 순차적인 코드 형태로 표현할 수 있게 만든 문법이다.

다음 코드에서:

```javascript
const user = await getUser();
console.log(user.name);
```

`await` 이후 코드는 개념적으로 Promise의 `.then()` continuation과 연결된다.

```javascript
getUser().then((user) => {
    console.log(user.name);
});
```

실제 언어 의미가 단순한 문자열 치환과 완전히 같다는 뜻은 아니다.

하지만 실행 흐름을 이해하는 데는 매우 유용한 정신 모델이다.

---

## 7. `await`는 무엇을 하는가

다음 코드를 보자.

```javascript
const result = await operation();
```

개념적으로 `await`는 다음 과정을 수행한다.

```text
1. operation()을 호출한다.

2. 반환값을 Promise로 취급한다.

3. Promise가 완료될 때까지
   현재 async 함수의 나머지 실행을 보류한다.

4. 현재 JavaScript 실행 흐름을 호출자에게 돌려준다.

5. Promise가 fulfilled 되면
   완료 값을 await 결과로 전달한다.

6. Promise가 rejected 되면
   await 위치에서 예외를 발생시킨다.

7. await 다음 코드를 microtask로 실행한다.
```

여기서 중요한 표현은 "반환값을 Promise로 취급한다"는 것이다.

`await` 뒤에는 반드시 Promise만 올 필요는 없다.

```javascript
const value = await 42;
```

이 코드도 유효하다.

개념적으로는 다음처럼 처리할 수 있다.

```javascript
const value = await Promise.resolve(42);
```

따라서 `value`에는 `42`가 들어간다.

하지만 Promise가 이미 완료되어 있거나 일반 값을 기다리더라도, `await` 이후 코드는 현재 동기 실행 흐름에서 바로 이어지지 않고 비동기적으로 재개된다.

---

## 8. async 함수의 실행 상태는 어떻게 보존되는가

다음 코드를 보자.

```javascript
async function example() {
    const base = 10;
    const value = await operation();
    return base + value;
}
```

`operation()`의 Promise가 아직 완료되지 않았다면 `example()`은 `await`에서 실행을 멈춘다.

나중에 다시 실행하려면 다음 정보가 필요하다.

```text
현재 실행 위치
지역변수 base
기다리고 있는 Promise
await 결과가 저장될 위치
예외 처리 상태
```

JavaScript 엔진은 async 함수의 실행 상태를 내부적으로 보존한다.

개념적으로는 다음과 같은 상태 머신으로 생각할 수 있다.

```javascript
function resumeExample(frame, input, isError) {
    switch (frame.state) {
        case 0:
            frame.base = 10;
            frame.state = 1;

            waitForPromise(
                operation(),
                frame
            );

            return;

        case 1:
            if (isError) {
                throw input;
            }

            frame.value = input;
            return frame.base + frame.value;
    }
}
```

실제 엔진이 정확히 이런 JavaScript 코드를 생성한다는 뜻은 아니다.

하지만 다음 핵심은 같다.

```text
await 이전 상태 저장
→ Promise 완료 대기
→ 완료 후 저장된 상태에서 재개
```

C++20에서 컴파일러가 코루틴 프레임과 재개 코드를 생성하는 것과 구조적으로 비슷하다.

---

## 9. JavaScript에서는 무엇이 멈추는가

다음 코드를 보자.

```javascript
async function loadData() {
    console.log("before");

    const result = await fetch("/api/data");

    console.log("after");
    return result;
}
```

`fetch()` 응답을 기다리는 동안 전체 JavaScript 런타임이 정지하는 것은 아니다.

중단되는 것은 현재 `loadData()` async 함수의 이후 실행이다.

```text
loadData
→ await에서 논리적으로 중단

JavaScript 실행 스레드
→ 다른 함수와 이벤트 처리 가능
```

예를 들어:

```javascript
loadData();
console.log("other work");
```

대략 다음 순서로 실행된다.

```text
loadData 시작
→ "before" 출력
→ fetch Promise 대기
→ loadData 실행 보류
→ "other work" 출력
→ 나중에 fetch 완료
→ loadData 재개
→ "after" 출력
```

즉, `await`는 현재 async 함수의 continuation을 분리한다.

현재 운영체제 스레드를 네트워크 응답이 올 때까지 블로킹하는 문법이 아니다.

---

## 10. JavaScript 실행 모델의 기본 구성 요소

JavaScript의 비동기 실행을 이해하려면 다음 요소를 구분해야 한다.

```text
Call Stack
현재 실행 중인 JavaScript 함수

Host Runtime
브라우저 또는 Node.js가 제공하는 타이머, 네트워크, 파일 I/O 등

Task Queue
타이머, 사용자 이벤트 등 일반 작업 대기열

Microtask Queue
Promise continuation 등 우선적으로 처리할 작업 대기열

Event Loop
Call Stack과 Queue의 상태를 확인하고 다음 작업을 실행
```

JavaScript 언어 자체와 실행 환경도 구분해야 한다.

브라우저에서는 다음 기능들이 브라우저 환경에서 제공된다.

```text
fetch
setTimeout
DOM 이벤트
WebSocket
```

Node.js에서는 Node.js 런타임이 다음 기능들을 제공한다.

```text
파일 I/O
네트워크 I/O
타이머
프로세스 이벤트
```

JavaScript 엔진은 JavaScript 코드를 실행하지만, 실제 비동기 I/O 작업은 호스트 환경과 협력하여 처리된다.

---

## 11. Call Stack

Call Stack은 현재 실행 중인 함수 호출을 관리한다.

다음 코드를 보자.

```javascript
function first() {
    second();
}

function second() {
    console.log("hello");
}

first();
```

실행 중 스택은 개념적으로 다음과 같이 변한다.

```text
first
```

```text
first
└─ second
```

```text
first
└─ second
   └─ console.log
```

함수가 반환되면 스택에서 제거된다.

JavaScript는 일반적으로 하나의 Call Stack에서 코드를 실행한다.

따라서 현재 스택에서 오래 걸리는 동기 코드가 실행되면 다른 JavaScript 작업이 실행되지 못한다.

---

## 12. Event Loop

이벤트 루프는 Call Stack이 비어 있을 때 실행 가능한 작업을 선택한다.

매우 단순화하면 다음처럼 생각할 수 있다.

```javascript
while (runtimeIsRunning) {
    if (callStackIsEmpty()) {
        runAllMicrotasks();

        const nextTask = taskQueue.take();
        run(nextTask);
    }
}
```

실제 브라우저와 Node.js의 이벤트 루프는 더 복잡하며, 렌더링 단계와 여러 이벤트 루프 단계가 존재한다.

하지만 학습 초기에는 다음 원칙이 중요하다.

```text
현재 JavaScript 실행이 끝난다.
→ Microtask Queue를 처리한다.
→ 다음 Task를 처리한다.
```

Promise의 continuation과 `await` 이후 코드는 주로 Microtask Queue를 통해 실행된다.

---

## 13. Task Queue와 Microtask Queue

JavaScript에는 비동기 작업이 모두 같은 대기열에 들어가는 것이 아니다.

대표적으로 두 종류를 구분할 수 있다.

### Task Queue

다음과 같은 작업이 일반적인 Task로 처리될 수 있다.

```text
setTimeout 콜백
사용자 입력 이벤트
네트워크 이벤트 처리
메시지 이벤트
```

Task는 흔히 macrotask라고도 불리지만, 표준 맥락에서는 task라는 표현이 더 적절하다.

### Microtask Queue

다음과 같은 작업이 Microtask로 처리된다.

```text
Promise의 then/catch/finally reaction
await 이후 continuation
queueMicrotask 콜백
```

현재 JavaScript 작업이 끝나고 Call Stack이 비면, 런타임은 일반적으로 다음 Task로 넘어가기 전에 Microtask Queue를 먼저 비운다.

```text
현재 Task 실행 완료
→ 모든 Microtask 실행
→ 렌더링 기회
→ 다음 Task 실행
```

이 순서가 Promise 코드의 실행 순서를 이해하는 핵심이다.

---

## 14. Promise가 `setTimeout`보다 먼저 실행되는 이유

다음 코드를 보자.

```javascript
console.log("A");

setTimeout(() => {
    console.log("timeout");
}, 0);

Promise.resolve().then(() => {
    console.log("promise");
});

console.log("B");
```

일반적인 출력 순서는 다음과 같다.

```text
A
B
promise
timeout
```

한 줄씩 실행 과정을 살펴보자.

먼저:

```javascript
console.log("A");
```

현재 Call Stack에서 즉시 실행된다.

```text
출력: A
```

다음:

```javascript
setTimeout(() => {
    console.log("timeout");
}, 0);
```

타이머를 런타임에 등록한다.

`0ms`는 즉시 현재 스택에서 실행한다는 뜻이 아니다.

타이머 조건이 충족된 뒤 콜백이 Task Queue에 들어갈 수 있다는 뜻에 가깝다.

다음:

```javascript
Promise.resolve().then(() => {
    console.log("promise");
});
```

이미 fulfilled 된 Promise에 `.then()`을 등록한다.

해당 콜백은 Microtask Queue에 예약된다.

마지막:

```javascript
console.log("B");
```

현재 동기 코드이므로 즉시 실행된다.

```text
출력: B
```

현재 스크립트 Task가 끝나면 Call Stack이 비워진다.

이때 이벤트 루프는 Task Queue보다 Microtask Queue를 먼저 처리한다.

```text
Microtask Queue
→ promise 콜백 실행

Task Queue
→ timeout 콜백 실행
```

따라서 최종 출력은:

```text
A
B
promise
timeout
```

이 된다.

---

## 15. `await` 이후 코드도 Microtask로 재개된다

다음 코드를 보자.

```javascript
async function example() {
    console.log("async start");

    await Promise.resolve();

    console.log("async end");
}

console.log("script start");

example();

console.log("script end");
```

일반적인 출력은 다음과 같다.

```text
script start
async start
script end
async end
```

실행 흐름을 살펴보자.

먼저:

```javascript
console.log("script start");
```

```text
출력: script start
```

다음:

```javascript
example();
```

`example()`은 호출되면 `await` 전까지 동기적으로 실행된다.

```javascript
console.log("async start");
```

```text
출력: async start
```

그다음:

```javascript
await Promise.resolve();
```

Promise는 이미 fulfilled 상태지만, `await` 이후 실행은 Microtask로 예약된다.

`example()` 호출은 Promise를 반환하고 현재 스크립트는 계속 진행한다.

```javascript
console.log("script end");
```

```text
출력: script end
```

현재 스크립트 실행이 끝난 후 Microtask Queue를 처리한다.

```javascript
console.log("async end");
```

```text
출력: async end
```

따라서 `await`는 결과가 이미 준비되어 있어도 함수의 나머지 부분을 현재 동기 호출 스택에서 즉시 실행하지 않는다.

---

## 16. `await` 이전 코드는 동기적으로 실행된다

`async function`이라고 해서 함수 전체가 무조건 나중에 실행되는 것은 아니다.

다음 코드를 보자.

```javascript
async function run() {
    console.log("1");
    await delay();
    console.log("2");
}

console.log("A");
run();
console.log("B");
```

`run()`을 호출하면 첫 번째 `await`를 만날 때까지는 현재 Call Stack에서 실행된다.

```text
A
1
B
2
```

정확한 `2`의 시점은 `delay()`가 반환한 Promise의 완료 시점에 따라 달라진다.

중요한 구조는 다음과 같다.

```text
async 함수 호출
→ 첫 await 전까지 동기 실행
→ await에서 continuation 분리
→ Promise 반환
→ 나중에 continuation 재개
```

따라서 async 함수 안에 `await`보다 앞서 무거운 CPU 연산이 있으면 그 연산은 호출자를 블로킹한다.

```javascript
async function bad() {
    performHeavyCalculation();

    await fetch("/api/data");
}
```

`performHeavyCalculation()`이 끝나기 전에는 이벤트 루프가 다른 작업을 실행하지 못한다.

---

## 17. `async`만 붙인다고 비동기가 되지 않는다

다음 함수는 `async`로 선언되어 있다.

```javascript
async function calculate() {
    let total = 0;

    for (let i = 0; i < 10_000_000_000; i++) {
        total += i;
    }

    return total;
}
```

하지만 내부에는 `await`가 없다.

함수를 호출하면 계산이 현재 JavaScript 스레드에서 동기적으로 진행된다.

```text
calculate 호출
→ 긴 반복 계산
→ Call Stack 점유
→ 다른 이벤트 처리 불가
→ 계산 완료
→ 완료된 Promise 반환
```

엄밀히 말하면 async 함수 호출은 Promise를 즉시 반환하는 것처럼 보일 수 있지만, 함수 본문에서 첫 중단 지점까지의 실행은 현재 호출 과정에 포함된다.

이 함수에는 중단 지점이 없으므로 전체 계산이 끝나야 호출 흐름이 빠져나온다.

따라서 다음은 잘못된 정신 모델이다.

```text
async를 붙이면 자동으로 별도 스레드에서 실행된다.
```

정확한 설명은 다음과 같다.

> `async`는 함수의 반환값을 Promise로 만들고 `await`를 사용할 수 있게 하지만, 함수 안의 JavaScript 코드를 별도 스레드로 자동 이동시키지 않는다.

---

## 18. `await`는 병렬 실행을 자동으로 만들지 않는다

다음 코드를 보자.

```javascript
async function loadAll() {
    const user = await loadUser();
    const orders = await loadOrders();

    return { user, orders };
}
```

두 작업은 순차적으로 진행된다.

```text
loadUser 시작
→ loadUser 완료
→ loadOrders 시작
→ loadOrders 완료
```

`loadOrders()`가 `loadUser()` 결과를 필요로 하지 않는다면 대기 시간을 겹칠 수 있다.

```javascript
async function loadAll() {
    const userPromise = loadUser();
    const ordersPromise = loadOrders();

    const user = await userPromise;
    const orders = await ordersPromise;

    return { user, orders };
}
```

두 Promise를 먼저 생성했기 때문에 두 작업이 모두 시작될 수 있다.

```text
loadUser 시작
loadOrders 시작
→ 두 작업의 대기 시간이 겹침
```

더 일반적으로는 `Promise.all()`을 사용한다.

```javascript
async function loadAll() {
    const [user, orders] = await Promise.all([
        loadUser(),
        loadOrders(),
    ]);

    return { user, orders };
}
```

핵심은 다음과 같다.

```text
await
하나의 Promise 결과를 기다림

Promise.all
여러 Promise를 함께 진행하고 모두 완료될 때까지 기다림
```

---

## 19. `Promise.all()`은 무엇을 하는가

`Promise.all()`은 여러 Promise가 모두 완료될 때까지 기다린다.

```javascript
const results = await Promise.all([
    operationA(),
    operationB(),
    operationC(),
]);
```

결과는 입력 순서대로 반환된다.

```javascript
const [resultA, resultB, resultC] =
    await Promise.all([
        operationA(),
        operationB(),
        operationC(),
    ]);
```

`operationB()`가 먼저 완료되더라도 두 번째 결과 위치에 들어간다.

```text
완료 순서
B → C → A

반환 배열 순서
A, B, C
```

하나의 Promise가 rejected 되면 `Promise.all()`이 반환한 Promise도 rejected 된다.

```text
A 성공
B 실패
C 진행 중

→ Promise.all rejected
```

다만 `Promise.all()`이 실패했다고 이미 시작된 다른 비동기 작업이 자동으로 모두 중단되는 것은 아니다.

```text
Promise 집계 실패
≠
모든 실제 작업 자동 취소
```

실제 네트워크 요청을 취소하려면 `AbortController` 같은 별도 취소 메커니즘이 필요할 수 있다.

---

## 20. `Promise.allSettled()`는 무엇이 다른가

일부 작업이 실패하더라도 모든 결과를 확인하고 싶다면 `Promise.allSettled()`를 사용할 수 있다.

```javascript
const results = await Promise.allSettled([
    operationA(),
    operationB(),
    operationC(),
]);
```

각 결과는 성공 또는 실패 상태를 포함한다.

```javascript
[
    {
        status: "fulfilled",
        value: resultA,
    },
    {
        status: "rejected",
        reason: errorB,
    },
]
```

따라서 요구사항에 따라 선택해야 한다.

```text
모두 성공해야 의미 있음
→ Promise.all

일부 실패도 개별 확인 필요
→ Promise.allSettled
```

비동기 동시 실행에서는 단순히 동시에 실행하는 것만이 아니라 실패 정책도 함께 설계해야 한다.

---

## 21. Promise의 rejected 상태와 예외 처리

다음 async 함수가 있다고 하자.

```javascript
async function loadData() {
    throw new Error("failed");
}
```

async 함수 내부에서 예외가 발생하면 함수가 반환한 Promise는 rejected 상태가 된다.

```text
예외 발생
→ async 함수 반환 Promise rejected
```

호출자는 `.catch()`로 처리할 수 있다.

```javascript
loadData().catch((error) => {
    console.error(error);
});
```

또는 `await`와 `try/catch`를 사용할 수 있다.

```javascript
async function main() {
    try {
        const result = await loadData();
        console.log(result);
    } catch (error) {
        console.error(error);
    }
}
```

실행 구조는 다음과 같다.

```text
loadData Promise rejected
→ main의 await continuation 재개
→ await 위치에서 예외 발생
→ catch 블록 실행
```

Python에서 Task나 Future에 저장된 예외가 `await` 시점에 다시 발생하는 것과 비슷하다.

---

## 22. `await`의 rejected Promise는 throw처럼 동작한다

다음 코드를 보자.

```javascript
async function example() {
    const value = await Promise.reject(
        new Error("failed")
    );

    console.log(value);
}
```

Promise가 rejected 되었으므로 `value`에는 값이 저장되지 않는다.

대신 `await` 표현식이 예외를 던진다.

개념적으로 다음과 비슷하다.

```javascript
async function example() {
    throw new Error("failed");
}
```

따라서 다음처럼 처리한다.

```javascript
async function example() {
    try {
        const value = await Promise.reject(
            new Error("failed")
        );

        return value;
    } catch (error) {
        console.error(error);
        return null;
    }
}
```

`await`는 Promise의 두 완료 상태를 일반 코드 형태로 변환한다.

```text
fulfilled
→ await가 값 반환

rejected
→ await가 예외 발생
```

---

## 23. async 함수의 반환값도 Promise 체인에 포함된다

다음 코드를 보자.

```javascript
async function outer() {
    const value = await inner();
    return value * 2;
}
```

`outer()`도 Promise를 반환한다.

```text
inner Promise 완료
→ outer 재개
→ value * 2 계산
→ outer Promise fulfilled
```

만약 `inner()`가 rejected 되면 `outer()`도 예외를 처리하지 않는 한 rejected 된다.

```text
inner Promise rejected
→ outer의 await에서 예외 발생
→ outer Promise rejected
```

따라서 async 함수 호출 체인은 Promise 체인을 형성한다.

```javascript
async function main() {
    const result = await outer();
    console.log(result);
}
```

논리적인 대기 관계는 다음과 같다.

```text
main의 Promise
└─ outer의 Promise
   └─ inner의 Promise
```

가장 안쪽 Promise가 완료되면 바깥쪽 async 함수들이 순서대로 Microtask를 통해 재개된다.

---

## 24. Promise 체인은 일반 호출 스택과 다르다

일반 함수 호출은 하나의 연속된 Call Stack을 만든다.

```javascript
function main() {
    const result = outer();
    console.log(result);
}

function outer() {
    return inner();
}
```

실행 중에는 다음과 같은 호출 스택이 존재한다.

```text
main
└─ outer
   └─ inner
```

비동기 함수에서 `await`가 발생하면 현재 호출 스택은 계속 유지되지 않는다.

```javascript
async function main() {
    const result = await outer();
    console.log(result);
}
```

```javascript
async function outer() {
    return await inner();
}
```

`inner()`의 Promise가 미완료라면:

```text
inner 대기
→ outer continuation 저장
→ main continuation 저장
→ 현재 Call Stack 종료
```

나중에 Promise가 완료되면 continuation들이 새 Microtask 실행으로 이어진다.

```text
inner 완료
→ outer 재개 Microtask
→ outer Promise 완료
→ main 재개 Microtask
```

따라서 비동기 호출 체인은 하나의 물리적인 Call Stack이 계속 유지되는 구조가 아니다.

> Promise와 continuation으로 연결된 논리적인 호출 체인이다.

---

## 25. Microtask는 현재 스택 중간에 끼어들지 않는다

다음 코드를 보자.

```javascript
Promise.resolve().then(() => {
    console.log("microtask");
});

for (let i = 0; i < 1_000_000_000; i++) {
    // 긴 동기 연산
}

console.log("done");
```

Promise는 이미 완료되어 있고 `.then()` continuation도 Microtask Queue에 등록된다.

하지만 Microtask가 현재 실행 중인 동기 코드를 중간에 선점하지는 않는다.

```text
현재 스크립트 Task 실행
→ 긴 반복문 실행
→ done 출력
→ Call Stack 비워짐
→ microtask 실행
```

즉, JavaScript의 기본 실행 모델은 협력적이다.

현재 JavaScript 코드가 Call Stack을 반환해야 다른 비동기 continuation이 실행될 수 있다.

Promise가 완료되어 있어도 현재 실행 중인 긴 동기 작업을 강제로 중단하지 못한다.

---

## 26. Microtask를 너무 많이 만들면 생기는 문제

Microtask Queue는 다음 Task보다 먼저 처리된다.

그렇다면 Microtask가 계속 새로운 Microtask를 만들면 어떻게 될까?

```javascript
function repeat() {
    queueMicrotask(repeat);
}

repeat();
```

각 Microtask가 다음 Microtask를 등록한다.

```text
Microtask 실행
→ 새 Microtask 등록
→ Microtask Queue가 계속 비지 않음
```

이런 구조에서는 다음 Task나 브라우저 렌더링이 지연될 수 있다.

이를 Microtask starvation과 비슷한 문제로 볼 수 있다.

Promise를 반복적으로 연결하는 코드에서도 유사한 현상이 생길 수 있다.

```javascript
function loop() {
    Promise.resolve().then(loop);
}

loop();
```

따라서 Microtask가 일반 Task보다 우선한다고 해서 무제한으로 사용하는 것이 좋은 것은 아니다.

---

## 27. 브라우저의 비동기 I/O는 어디서 실행되는가

다음 코드를 보자.

```javascript
const response = await fetch("/api/data");
```

네트워크 통신 전체가 JavaScript Call Stack 위에서 실행되는 것은 아니다.

구조를 단순화하면 다음과 같다.

```text
JavaScript
fetch 호출

브라우저 런타임
네트워크 요청 수행

JavaScript
Promise를 받아 await

브라우저 런타임
응답 도착 감지

Promise
fulfilled 처리

Microtask Queue
await 이후 continuation 등록

JavaScript
함수 재개
```

JavaScript가 단일 스레드라는 말은 모든 브라우저 작업이 하나의 스레드에서 수행된다는 뜻이 아니다.

브라우저는 내부적으로 여러 스레드와 운영체제 기능을 사용할 수 있다.

정확한 의미는 보통 다음과 같다.

> 특정 JavaScript 실행 컨텍스트의 코드는 일반적으로 하나의 Call Stack에서 실행된다.

---

## 28. Node.js에서는 무엇이 다른가

Node.js에서도 JavaScript 코드는 일반적으로 하나의 이벤트 루프 스레드에서 실행된다.

하지만 Node.js 런타임은 비동기 작업을 처리하기 위해 운영체제 기능과 내부 스레드 풀을 사용할 수 있다.

```text
네트워크 I/O
운영체제의 비동기 I/O 기능 활용 가능

파일 I/O, 일부 DNS, 암호화 작업 등
내부 스레드 풀을 사용할 수 있음
```

JavaScript 개발자가 보는 구조는 비슷하다.

```javascript
const data = await fs.promises.readFile(
    "data.txt",
    "utf8"
);
```

```text
readFile 요청
→ Promise 반환
→ 현재 async 함수 중단
→ Node.js 런타임이 파일 작업 수행
→ 작업 완료
→ Promise fulfilled
→ await 이후 코드를 Microtask로 재개
```

즉, `async/await`의 문법 모델은 같지만 실제 비동기 작업을 처리하는 호스트 구현은 환경에 따라 다르다.

---

## 29. JavaScript와 Web Worker

CPU 집약적인 작업은 `async` 함수로 선언하는 것만으로 해결되지 않는다.

```javascript
async function calculate() {
    return performHeavyCalculation();
}
```

`performHeavyCalculation()`은 현재 JavaScript 스레드를 블로킹한다.

브라우저에서 CPU 연산을 다른 스레드로 옮기려면 Web Worker를 사용할 수 있다.

```text
Main Thread
UI와 이벤트 처리

Web Worker
별도 스레드에서 계산 수행
```

구조는 다음과 같다.

```javascript
worker.postMessage(input);

worker.onmessage = (event) => {
    console.log(event.data);
};
```

Worker와 Promise를 연결하면 `await` 가능한 인터페이스를 만들 수도 있다.

```javascript
function runWorker(input) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(
            "worker.js"
        );

        worker.onmessage = (event) => {
            resolve(event.data);
            worker.terminate();
        };

        worker.onerror = (error) => {
            reject(error);
            worker.terminate();
        };

        worker.postMessage(input);
    });
}
```

```javascript
const result = await runWorker(input);
```

여기서 Promise는 작업 결과를 표현하지만, 병렬 계산은 Worker가 수행한다.

```text
Promise
비동기 결과와 continuation 관리

Web Worker
실제 별도 스레드에서 병렬 실행
```

---

## 30. 취소는 Promise의 기본 기능이 아니다

JavaScript Promise에는 일반적인 `cancel()` 메서드가 없다.

```javascript
const promise = fetch("/api/data");

// promise.cancel()은 일반적인 표준 API가 아님
```

Promise를 기다리지 않는다고 실제 작업이 자동으로 취소되는 것도 아니다.

```javascript
async function load() {
    const promise = fetch("/api/data");

    // promise를 무시한다고 요청이 자동 취소되지 않음
}
```

네트워크 요청처럼 취소를 지원하는 API는 별도의 취소 신호를 사용한다.

대표적인 것이 `AbortController`다.

```javascript
const controller = new AbortController();

const promise = fetch("/api/data", {
    signal: controller.signal,
});

controller.abort();
```

async/await와 함께 사용하면:

```javascript
async function loadData(signal) {
    const response = await fetch(
        "/api/data",
        { signal }
    );

    return response.json();
}
```

중요한 구분은 다음과 같다.

```text
Promise
결과의 완료 상태 표현

AbortSignal
실제 작업에 취소 요청 전달
```

Python의 Task는 `cancel()`이라는 실행 관리 기능을 제공하지만, JavaScript Promise 자체는 작업 실행 주체가 아니므로 일반적인 취소 기능을 포함하지 않는다.

---

## 31. 타임아웃은 직접 조합해야 한다

Promise에는 모든 작업에 공통으로 적용되는 내장 타임아웃이 없다.

타임아웃 Promise와 실제 작업을 경쟁시키는 방식으로 구현할 수 있다.

```javascript
function timeout(ms) {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error("timeout"));
        }, ms);
    });
}
```

```javascript
const result = await Promise.race([
    requestData(),
    timeout(5000),
]);
```

`Promise.race()`는 가장 먼저 완료된 Promise의 상태를 따른다.

```text
requestData가 먼저 성공
→ 전체 성공

timeout이 먼저 실패
→ 전체 실패
```

하지만 여기에도 주의점이 있다.

타임아웃 Promise가 먼저 완료되어도 `requestData()`의 실제 작업이 자동으로 중단되는 것은 아니다.

```text
호출자는 타임아웃 처리
→ 원래 네트워크 요청은 계속 진행할 수 있음
```

실제 요청까지 취소하려면 `AbortController`와 함께 사용해야 한다.

```javascript
async function fetchWithTimeout(
    url,
    timeoutMs
) {
    const controller = new AbortController();

    const timerId = setTimeout(() => {
        controller.abort();
    }, timeoutMs);

    try {
        return await fetch(url, {
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timerId);
    }
}
```

---

## 32. `return await`는 필요한가

다음 두 함수가 있다.

```javascript
async function wrapper() {
    return operation();
}
```

```javascript
async function wrapper() {
    return await operation();
}
```

둘 다 `operation()`이 반환한 Promise의 최종 결과를 따라가는 Promise를 반환한다.

단순한 전달만 한다면 많은 경우 `return operation()`으로 충분하다.

```javascript
async function wrapper() {
    return operation();
}
```

하지만 현재 함수의 `try/catch`에서 내부 Promise의 rejection을 처리하려면 `await`가 중요하다.

다음 코드를 보자.

```javascript
async function wrapper() {
    try {
        return operation();
    } catch (error) {
        console.error("caught");
        return null;
    }
}
```

`operation()`이 Promise를 반환하고 나중에 reject 된다면, 동기적인 `try/catch`는 그 rejection을 잡지 못할 수 있다.

함수는 Promise를 반환하고 `try` 블록을 이미 빠져나왔기 때문이다.

다음처럼 `await`하면 rejection이 현재 함수의 실행 문맥에서 예외로 전달된다.

```javascript
async function wrapper() {
    try {
        return await operation();
    } catch (error) {
        console.error("caught");
        return null;
    }
}
```

```text
operation Promise rejected
→ wrapper 재개
→ await 위치에서 예외 발생
→ wrapper의 catch 실행
```

따라서 `return await`는 항상 불필요한 것이 아니다.

예외 처리와 `finally` 실행 문맥에 따라 의미가 있다.

---

## 33. 처리되지 않은 Promise rejection

다음 코드를 보자.

```javascript
async function fail() {
    throw new Error("failed");
}

fail();
```

`fail()`이 반환한 Promise를 아무도 기다리거나 처리하지 않는다.

Promise는 rejected 상태가 되지만 `.catch()`도 없고 `await`도 없다.

환경에 따라 처리되지 않은 Promise rejection 경고가 발생할 수 있다.

```text
Unhandled Promise Rejection
```

따라서 async 함수를 호출할 때는 반환된 Promise의 소유권을 생각해야 한다.

```text
누가 await하는가
누가 rejection을 처리하는가
호출자가 결과를 필요로 하는가
의도적으로 background 작업으로 실행하는가
실패 로그는 어디서 처리하는가
```

다음과 같이 명시적으로 처리할 수 있다.

```javascript
fail().catch((error) => {
    console.error(error);
});
```

또는 상위 async 함수에서 기다린다.

```javascript
async function main() {
    await fail();
}
```

---

## 34. Fire-and-forget 작업의 문제

결과를 기다리지 않고 작업만 시작하고 싶을 수 있다.

```javascript
async function handleRequest() {
    saveLog();
    return response;
}
```

`saveLog()`가 async 함수라면 Promise가 반환되지만, 현재 코드는 그 Promise를 처리하지 않는다.

이런 방식을 흔히 fire-and-forget이라고 부른다.

문제는 다음과 같다.

```text
오류를 놓칠 수 있음
프로세스 종료 전에 작업이 끝나지 않을 수 있음
취소와 수명 관리가 불명확함
작업이 과도하게 쌓일 수 있음
```

의도적으로 기다리지 않는다면 적어도 오류 처리를 붙이는 것이 좋다.

```javascript
void saveLog().catch((error) => {
    console.error(error);
});
```

`void`는 반환된 Promise를 의도적으로 사용하지 않는다는 의도를 드러낼 수 있지만, 작업 수명과 실패 정책까지 자동으로 해결해 주지는 않는다.

---

## 35. MCP 스타일의 JavaScript 호출 흐름

Python에서 사용한 MCP 예제를 JavaScript 형태로 생각해보자.

```javascript
async function listTools() {
    const result = await session.listTools();
    return result.tools;
}
```

호출자가 다음과 같이 사용한다고 하자.

```javascript
const tools = await listTools();
```

전체 흐름은 개념적으로 다음과 같다.

```text
1. listTools() 호출

2. async 함수 본문 실행 시작

3. session.listTools() 호출

4. MCP 요청 작업 시작

5. Promise 반환

6. await가 해당 Promise를 기다림

7. listTools의 나머지 실행 상태 보존

8. listTools()는 자신의 Promise를 호출자에게 반환

9. 현재 JavaScript Call Stack 종료

10. 런타임이 MCP 응답 대기

11. 그동안 다른 이벤트와 JavaScript 작업 처리

12. MCP 응답 도착

13. session.listTools Promise fulfilled

14. listTools의 continuation을
    Microtask Queue에 등록

15. 현재 Task가 끝난 뒤 Microtask 실행

16. await가 응답 객체 반환

17. result 변수에 저장

18. result.tools 반환

19. listTools가 반환한 Promise fulfilled

20. 호출자의 await continuation도
    Microtask Queue에 등록

21. 호출자 재개

22. tools에 도구 목록 저장
```

핵심은 Promise 완료 하나가 바깥쪽 async 함수의 Promise 완료로 이어진다는 점이다.

---

## 36. JavaScript의 `callTool()` 래퍼 해석

다음 함수를 보자.

```javascript
async function callTool(
    toolName,
    toolInput
) {
    return await session.callTool(
        toolName,
        toolInput
    );
}
```

실행 흐름은 다음과 같다.

```text
callTool 호출
→ session.callTool 호출
→ Promise 획득
→ await에서 callTool 실행 보류
→ MCP 응답 도착
→ Promise fulfilled
→ callTool continuation Microtask 실행
→ 결과 반환
→ callTool의 Promise fulfilled
```

결과를 가공하지 않는다면 다음처럼 작성할 수도 있다.

```javascript
function callTool(
    toolName,
    toolInput
) {
    return session.callTool(
        toolName,
        toolInput
    );
}
```

이 경우 함수 자체를 `async`로 선언하지 않아도 Promise를 그대로 반환할 수 있다.

하지만 래퍼 안에서 로깅이나 예외 처리를 하려면 async 함수가 유용할 수 있다.

```javascript
async function callTool(
    toolName,
    toolInput
) {
    try {
        const result = await session.callTool(
            toolName,
            toolInput
        );

        return result;
    } catch (error) {
        console.error(
            `Tool call failed: ${toolName}`,
            error
        );

        throw error;
    }
}
```

---

## 37. Python과 JavaScript의 가장 큰 차이

Python과 JavaScript는 문법이 매우 비슷하다.

```python
result = await operation()
```

```javascript
const result = await operation();
```

하지만 실행 모델을 구성하는 객체는 다르다.

Python에서는 다음을 명시적으로 구분한다.

```text
Coroutine
Task
Future
Event Loop
```

JavaScript에서는 Promise가 훨씬 중심적인 위치에 있다.

```text
async function 호출 결과
→ Promise

await 대상
→ Promise 또는 Promise로 변환 가능한 값

비동기 체인
→ Promise chain

완료 후 재개
→ Promise reaction Microtask
```

대응 관계를 단순화하면 다음과 같다.

| 역할       | Python              | JavaScript                    |
| -------- | ------------------- | ----------------------------- |
| 비동기 함수   | `async def`         | `async function`              |
| 호출 결과    | Coroutine Object    | Promise                       |
| 실행 관리자   | Task                | 런타임이 async 함수 실행 관리          |
| 미래 결과    | Future/Task         | Promise                        |
| 중단 표현    | `await`             | `await`                        |
| 재개 예약    | Event Loop의 Task 재개 | Microtask Queue                |
| 동시 실행 시작 | `create_task()`     | Promise를 먼저 생성                |
| 여러 작업 대기 | `asyncio.gather()`  | `Promise.all()`                |
| 취소       | `Task.cancel()`     | API별 취소, `AbortController` 등  |

Python에서는 코루틴 객체를 만들기만 하면 일반적으로 아직 독립적인 Task로 실행되지 않는다.

```python
coroutine = operation()
```

JavaScript의 async 함수는 호출하면 즉시 첫 `await` 지점까지 실행되고 Promise를 반환한다.

```javascript
const promise = operation();
```

이 차이는 중요하다.

---

## 38. Python Coroutine 호출과 JavaScript async 호출 비교

Python:

```python
async def operation():
    print("start")
    await asyncio.sleep(1)
    print("end")


coroutine = operation()
print("created")
```

`operation()` 호출만으로는 일반적으로 함수 본문이 아직 실행되지 않는다.

```text
created
```

JavaScript:

```javascript
async function operation() {
    console.log("start");
    await delay(1000);
    console.log("end");
}

const promise = operation();
console.log("created");
```

async 함수를 호출하면 첫 `await` 전까지 즉시 실행된다.

```text
start
created
end
```

따라서 다음처럼 비교할 수 있다.

```text
Python
async 함수 호출
→ Coroutine Object 생성
→ Task 또는 await를 통해 실행

JavaScript
async 함수 호출
→ 본문 즉시 실행 시작
→ 첫 await에서 중단
→ Promise 반환
```

JavaScript에서는 Python의 `create_task()`와 정확히 같은 단계를 거쳐야 작업이 시작되는 것은 아니다.

Promise를 반환하는 함수를 호출하는 것만으로 작업이 시작되는 경우가 많다.

---

## 39. C++20과 JavaScript 비교

C++20에서는 다음 코드가 awaiter 프로토콜을 사용한다.

```cpp
auto value = co_await operation;
```

핵심 흐름은 다음과 같았다.

```text
await_ready()
→ await_suspend(handle)
→ 나중에 handle.resume()
→ await_resume()
```

JavaScript에서는 다음 코드가 Promise를 사용한다.

```javascript
const value = await operation();
```

구조적으로 비교하면 다음과 같다.

```text
C++ await_ready
Promise가 이미 완료되었는지와 유사한 판단

C++ await_suspend(handle)
현재 코루틴 continuation 등록

JavaScript await
Promise에 async 함수 continuation 연결

C++ handle.resume()
Promise 완료 후 continuation 실행

C++ await_resume
await 표현식에 결과 전달
```

가장 큰 차이는 C++에서는 awaiter와 scheduler를 라이브러리가 직접 정의할 수 있다는 점이다.

JavaScript에서는 Promise와 Microtask 기반 재개 정책이 실행 환경에 강하게 통합되어 있다.

---

## 40. 직접 확인할 수 있는 실행 순서 실험

다음 코드를 실행해보자.

```javascript
console.log("1");

setTimeout(() => {
    console.log("2");
}, 0);

Promise.resolve().then(() => {
    console.log("3");
});

queueMicrotask(() => {
    console.log("4");
});

(async () => {
    console.log("5");

    await Promise.resolve();

    console.log("6");
})();

console.log("7");
```

먼저 예상해볼 수 있다.

동기 코드:

```text
1
5
7
```

Microtask 등록 순서:

```text
3
4
6
```

Task:

```text
2
```

따라서 일반적인 출력은 다음과 같다.

```text
1
5
7
3
4
6
2
```

이 실험에서 확인해야 할 것은 다음과 같다.

```text
async 함수는 첫 await 전까지 언제 실행되는가
then 콜백은 어느 Queue에 들어가는가
queueMicrotask와 Promise.then의 순서는 무엇인가
await 이후 코드는 언제 등록되는가
setTimeout 콜백은 왜 마지막인가
```

---

## 41. Promise를 먼저 만들었을 때의 동시성 실험

다음 함수를 사용해보자.

```javascript
function delay(name, ms) {
    return new Promise((resolve) => {
        console.log(`${name}: start`);

        setTimeout(() => {
            console.log(`${name}: end`);
            resolve(name);
        }, ms);
    });
}
```

순차 실행:

```javascript
async function sequential() {
    const a = await delay("A", 1000);
    const b = await delay("B", 1000);

    return [a, b];
}
```

실행 흐름:

```text
A 시작
→ 1초 대기
→ A 종료
→ B 시작
→ 1초 대기
→ B 종료
```

동시 진행:

```javascript
async function concurrent() {
    const promiseA = delay("A", 1000);
    const promiseB = delay("B", 1000);

    const a = await promiseA;
    const b = await promiseB;

    return [a, b];
}
```

실행 흐름:

```text
A 시작
B 시작
→ 약 1초 대기
→ A와 B 종료
```

또는:

```javascript
async function concurrent() {
    return Promise.all([
        delay("A", 1000),
        delay("B", 1000),
    ]);
}
```

핵심은 `await`의 위치가 아니라 Promise를 언제 생성했는가다.

```text
첫 번째 await 후 두 번째 Promise 생성
→ 순차 실행

두 Promise를 먼저 생성
→ 동시 진행 가능
```

---

## 42. 가장 중요한 정신 모델

JavaScript에서 다음 코드를 보면:

```javascript
const result = await operation();
```

머릿속에서는 다음처럼 해석하면 된다.

```text
1. operation()을 호출한다.

2. 반환값을 Promise로 변환해 취급한다.

3. 현재 async 함수는 첫 await 전까지
   현재 Call Stack에서 실행되어 왔다.

4. Promise 결과가 필요하므로
   await 이후 코드를 continuation으로 분리한다.

5. 현재 async 함수는 호출자에게
   자신의 Promise를 반환한다.

6. 현재 Call Stack의 실행은 계속되거나 종료된다.

7. operation의 Promise가 완료된다.

8. await 이후 continuation이
   Microtask Queue에 등록된다.

9. 현재 JavaScript Task가 끝나고
   Call Stack이 비면 Microtask가 실행된다.

10. fulfilled라면 결과가 result에 저장된다.

11. rejected라면 await 위치에서 예외가 발생한다.

12. async 함수의 다음 코드를 계속 실행한다.

13. 함수가 return하면
    해당 async 함수의 Promise가 완료된다.
```

JavaScript 비동기 실행의 핵심 요소를 압축하면 다음과 같다.

```text
Promise
미래의 결과와 continuation을 관리한다.

async function
항상 Promise를 반환한다.

await
현재 async 함수의 나머지 실행을
Promise 완료 이후로 분리한다.

Microtask Queue
Promise continuation과 await 이후 실행을 예약한다.

Event Loop
현재 실행이 끝난 뒤 Microtask와 Task를 처리한다.

Host Runtime
네트워크, 타이머, 파일 I/O 같은 실제 작업을 수행한다.
```

---

## 마무리

JavaScript의 `async/await`는 별도의 비동기 실행 모델을 새로 만든 기능이 아니다.

그 기반에는 Promise가 있다.

```text
async function
→ Promise 반환

await
→ Promise 완료 대기

Promise 완료
→ continuation을 Microtask Queue에 등록

Event Loop
→ 현재 실행 종료 후 Microtask 처리

async 함수 재개
→ await 다음 코드 실행
```

따라서 JavaScript의 `await`를 가장 정확하게 설명하면 다음과 같다.

> `await`는 현재 스레드를 멈추는 문법이 아니라, 현재 async 함수의 나머지 실행을 Promise의 continuation으로 분리하고, Promise가 완료되면 그 continuation을 Microtask로 재개하는 문법이다.

C++20과 Python에 대응하면 다음과 같다.

```text
C++20
coroutine_handle을 저장하고 resume

Python
Future 완료 후 Task를 Event Loop가 재개

JavaScript
Promise 완료 후 continuation을
Microtask Queue에서 실행
```

세 언어 모두 공통 원리는 같다.

```text
실행 상태 저장
→ 완료 대상과 continuation 연결
→ 현재 실행권 반환
→ 작업 완료
→ continuation 재개
```

하지만 중심 객체는 서로 다르다.

```text
C++20
Awaiter와 coroutine_handle

Python
Coroutine, Task, Future

JavaScript
Promise와 Microtask
```

다음 글에서는 Java의 비동기 처리 방식을 살펴본다.

Java에는 JavaScript와 Python처럼 언어 차원의 대표적인 `async/await` 문법이 없다.

대신 서로 다른 문제를 해결하는 여러 실행 모델이 공존한다.

```text
CompletableFuture
비동기 결과와 continuation 체인

Reactor의 Mono와 Flux
비동기 데이터 스트림과 backpressure

Virtual Thread
블로킹 코드 형태를 유지하는 경량 스레드
```

특히 Spring 실무에서 다음 선택이 어떻게 다른지 비교할 것이다.

```text
Spring MVC + Virtual Thread
Spring WebFlux + Reactor
CompletableFuture 기반 비동기 처리
```
