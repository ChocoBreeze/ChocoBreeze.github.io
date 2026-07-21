---
title: "Java에는 async/await가 없는데 비동기는 어떻게 처리할까?"
description: "CompletableFuture, Reactor(Mono/Flux), Virtual Thread가 각각 무엇을 추상화하는지 비교하고 Spring MVC/WebFlux 선택 기준을 정리합니다."
pubDate: "2026-07-26T00:00:00+09:00"
categories: "Programming"
slug: "programming/java-completablefuture-reactor-virtual-thread"
tags: ["Async", "Java", "CompletableFuture", "Reactor", "Virtual Thread", "Spring"]
---


## CompletableFuture, Reactor, Virtual Thread의 차이와 Spring에서의 선택

앞선 글에서는 C++20, Python, JavaScript의 비동기 실행 구조를 살펴봤다.

세 언어는 구체적인 구현은 달랐지만, 코드에서 중단 지점을 직접 표현한다는 공통점이 있었다.

```cpp
auto result = co_await operation();
```

```python
result = await operation()
```

```javascript
const result = await operation();
```

Java 코드를 작성하다 보면 자연스럽게 이런 의문이 생긴다.

> Java에도 `async`와 `await`가 있는가?

Java 언어에는 JavaScript나 Python과 같은 대표적인 `async/await` 문법이 없다.

그렇다고 Java에 비동기 처리 기능이 없는 것은 아니다.

Java에서는 서로 다른 문제를 해결하는 여러 동시성 모델이 공존한다.

대표적으로 다음 세 가지를 구분해야 한다.

```text
CompletableFuture
비동기 결과와 후속 작업을 연결하는 모델

Reactor의 Mono와 Flux
비동기 데이터 흐름을 Publisher 파이프라인으로 표현하는 모델

Virtual Thread
블로킹 코드를 유지하면서 많은 동시 작업을 처리하는 경량 스레드 모델
```

세 모델은 모두 "많은 대기 작업을 효율적으로 처리한다"는 상황에서 등장할 수 있다.

그러나 내부 구조와 개발자가 작성하는 코드의 형태는 크게 다르다.

```text
CompletableFuture
결과가 완료된 뒤 무엇을 실행할지 연결한다.

Reactor
데이터와 완료·실패 신호가 흐르는 파이프라인을 구성한다.

Virtual Thread
기존의 순차적인 블로킹 코드를 그대로 실행한다.
```

이 글에서는 세 모델이 무엇을 추상화하고, 실제로 누가 작업을 실행하며, Spring 실무에서는 어떤 기준으로 선택해야 하는지 살펴본다.

---

## 1. 먼저 Java의 일반적인 블로킹 호출을 보자

다음 코드는 외부 서버에서 도구 목록을 가져온다고 가정한 동기 코드다.

```java
public List<Tool> listTools() {
    ToolListResult result =
        session.listTools();

    return result.tools();
}
```

실행 흐름은 단순하다.

```text
listTools() 호출
→ session.listTools() 호출
→ 네트워크 요청 전송
→ 응답이 올 때까지 현재 스레드 대기
→ 결과 반환
→ tools 추출
```

코드를 읽는 관점에서는 이해하기 쉽다.

```java
ToolListResult result =
    session.listTools();

return result.tools();
```

첫 번째 문장이 끝나야 두 번째 문장이 실행된다.

문제는 `session.listTools()`가 네트워크 응답을 기다리는 동안 현재 스레드가 다른 요청을 처리하지 못할 수 있다는 것이다.

플랫폼 스레드를 요청마다 하나씩 배정하는 전통적인 서버 구조에서는 동시 요청이 많아질수록 더 많은 스레드가 필요해진다.

```text
요청 A → Thread 1 → I/O 대기
요청 B → Thread 2 → I/O 대기
요청 C → Thread 3 → I/O 대기
```

이 문제에 대해 Java는 한 가지 정답만 제공하지 않는다.

서로 다른 방향의 해결책이 발전했다.

```text
결과의 완료를 callback 형태로 연결한다.
→ CompletableFuture

작업을 비동기 데이터 흐름으로 표현한다.
→ Reactor

대기 중인 스레드 자체를 매우 가볍게 만든다.
→ Virtual Thread
```

---

## 2. Java의 전통적인 `Future`

`CompletableFuture`를 보기 전에 기존 `Future`부터 이해해야 한다.

작업을 Executor에 제출하면 `Future<T>`를 받을 수 있다.

```java
ExecutorService executor =
    Executors.newFixedThreadPool(4);

Future<ToolListResult> future =
    executor.submit(session::listTools);
```

`future`는 미래에 생길 결과를 표현한다.

```text
작업은 Executor의 스레드에서 실행
Future는 작업의 결과를 참조
```

결과를 얻으려면 다음과 같이 호출한다.

```java
ToolListResult result = future.get();
```

하지만 `get()`은 결과가 준비될 때까지 현재 스레드를 블로킹한다.

```text
호출자 스레드
→ future.get()
→ 작업 완료까지 대기
→ 결과 반환
```

물론 작업 자체는 다른 스레드에서 실행된다.

그러나 결과를 조합하거나, 완료된 뒤 다음 작업을 연결하기 어렵다는 문제가 있다.

```java
Future<User> userFuture =
    executor.submit(this::loadUser);

User user = userFuture.get();

Future<List<Order>> ordersFuture =
    executor.submit(
        () -> loadOrders(user)
    );

List<Order> orders =
    ordersFuture.get();
```

비동기 작업을 시작했지만 결과를 연결하는 과정에서 다시 블로킹 코드가 나타난다.

기존 `Future`의 주요 한계는 다음과 같다.

```text
완료 후 실행할 작업을 쉽게 연결하기 어렵다.
여러 Future를 조합하기 어렵다.
예외 처리 파이프라인을 만들기 어렵다.
get()을 사용하면 호출자 스레드가 블로킹된다.
```

이 문제를 개선하기 위해 Java 8에서 `CompletableFuture`와 `CompletionStage`가 도입됐다.

---

## 3. CompletableFuture는 무엇인가

`CompletableFuture<T>`는 미래에 완료될 결과를 표현하면서, 그 결과에 의존하는 다음 작업을 연결할 수 있는 객체다.

공식 API에서도 `CompletableFuture`는 명시적으로 완료될 수 있는 `Future`이자, 완료 시 실행되는 종속 함수와 작업을 지원하는 `CompletionStage` 구현으로 설명된다.

간단한 예제를 보자.

```java
CompletableFuture<ToolListResult> future =
    CompletableFuture.supplyAsync(
        session::listTools
    );
```

`session.listTools()`는 별도의 실행기에서 실행되고, 호출자는 즉시 `CompletableFuture`를 받는다.

```text
supplyAsync 호출
→ 작업을 Executor에 제출
→ CompletableFuture 즉시 반환
→ worker thread에서 실제 작업 실행
```

작업 완료 후 다음 변환을 연결할 수 있다.

```java
CompletableFuture<List<Tool>> toolsFuture =
    CompletableFuture
        .supplyAsync(session::listTools)
        .thenApply(
            ToolListResult::tools
        );
```

`thenApply()`에 전달된 함수는 앞 단계가 정상적으로 완료된 뒤 실행된다.

```text
session.listTools 완료
→ ToolListResult 생성
→ thenApply 실행
→ List<Tool> 생성
```

JavaScript Promise와 비교하면 구조가 비슷하다.

```javascript
session.listTools()
    .then((result) => result.tools);
```

Python의 `await` 코드와 비교하면:

```python
result = await session.list_tools()
return result.tools
```

와 같은 작업 흐름이다.

Java는 언어 문법으로 중단 지점을 표현하는 대신, 후속 작업을 메서드 호출로 연결한다.

---

## 4. CompletableFuture의 핵심은 continuation이다

다음 코드를 다시 보자.

```java
CompletableFuture<List<Tool>> future =
    CompletableFuture
        .supplyAsync(session::listTools)
        .thenApply(
            ToolListResult::tools
        );
```

`thenApply()`에 전달된 함수는 continuation이다.

앞 단계가 완료된 뒤 이어서 실행할 코드다.

```text
첫 번째 단계
session.listTools()

continuation
ToolListResult::tools
```

C++20과 연결하면 다음처럼 볼 수 있다.

```text
C++20
await_suspend에 coroutine_handle 전달
→ 작업 완료 후 handle.resume()

Java CompletableFuture
CompletionStage에 Function 등록
→ 작업 완료 후 Function 실행
```

JavaScript와도 유사하다.

```text
JavaScript
Promise.then(callback)

Java
CompletableFuture.thenApply(function)
```

즉, `CompletableFuture` 방식은 코루틴의 중단과 재개를 직접 표현하지 않는다.

> 작업 완료 후 실행할 함수들을 객체에 연결하여 비동기 흐름을 구성한다.

---

## 5. `supplyAsync()`는 누가 실행하는가

다음 코드에서:

```java
CompletableFuture<ToolListResult> future =
    CompletableFuture.supplyAsync(
        session::listTools
    );
```

`session.listTools()`는 호출자 스레드에서 반드시 실행되는 것이 아니다.

`Executor`를 지정하지 않은 `supplyAsync()`는 기본 비동기 실행 시설을 사용한다.

명시적으로 Executor를 전달할 수도 있다.

```java
ExecutorService executor =
    Executors.newFixedThreadPool(10);

CompletableFuture<ToolListResult> future =
    CompletableFuture.supplyAsync(
        session::listTools,
        executor
    );
```

공식 Java API는 Executor를 받는 `supplyAsync`가 지정한 Executor에서 Supplier를 실행하여 결과로 Future를 완료한다고 정의한다.

실행 구조는 다음과 같다.

```text
호출자 스레드
→ supplyAsync 호출
→ Runnable/Supplier를 Executor Queue에 등록
→ CompletableFuture 반환

Executor Worker Thread
→ session.listTools 실행
→ 결과로 CompletableFuture 완료
```

여기서 중요한 점은 `CompletableFuture`가 작업을 실행하는 스레드 그 자체는 아니라는 것이다.

```text
CompletableFuture
결과와 완료 상태, continuation 관리

Executor
실제 작업을 실행할 스레드 결정
```

---

## 6. `thenApply()`와 `thenApplyAsync()`는 다르다

다음 두 메서드는 이름이 비슷하다.

```java
thenApply(...)
```

```java
thenApplyAsync(...)
```

`thenApply()`는 앞 단계를 완료시키는 스레드에서 continuation이 실행될 수 있다.

```text
Worker Thread A가 이전 단계 완료
→ 같은 Thread A에서 thenApply 실행 가능
```

`thenApplyAsync()`는 continuation을 비동기 실행 시설에 제출한다.

```java
future.thenApplyAsync(
    ToolListResult::tools
);
```

Executor를 명시할 수도 있다.

```java
future.thenApplyAsync(
    ToolListResult::tools,
    executor
);
```

따라서 메서드 이름의 `Async`는 단순히 "이 API 전체가 비동기다"라는 장식이 아니다.

```text
thenApply
완료를 처리하는 스레드에서 후속 작업 실행 가능

thenApplyAsync
후속 작업을 Executor에 별도로 예약
```

무조건 `Async` 버전을 사용하는 것이 좋은 것도 아니다.

작은 값 변환까지 매번 Executor에 넘기면 불필요한 스케줄링 비용이 생길 수 있다.

반면 오래 걸리거나 블로킹되는 후속 작업이라면 어떤 Executor에서 실행할지 명확히 관리해야 한다.

---

## 7. `thenApply()`와 `thenCompose()`는 무엇이 다른가

`CompletableFuture`를 사용할 때 가장 자주 혼동되는 부분이다.

다음 비동기 메서드가 있다고 하자.

```java
CompletableFuture<User> loadUser() {
    ...
}
```

사용자의 주문을 불러오는 메서드도 비동기 결과를 반환한다.

```java
CompletableFuture<List<Order>>
loadOrders(User user) {
    ...
}
```

`thenApply()`를 사용하면:

```java
CompletableFuture<
    CompletableFuture<List<Order>>
> nested =
    loadUser().thenApply(
        this::loadOrders
    );
```

결과가 중첩된다.

```text
CompletableFuture<
    CompletableFuture<List<Order>>
>
```

`thenApply()`는 전달된 함수의 반환값을 그대로 다음 결과로 감싸기 때문이다.

```text
User
→ loadOrders(user)
→ CompletableFuture<List<Order>>
→ 다시 CompletableFuture가 감쌈
```

이럴 때 `thenCompose()`를 사용한다.

```java
CompletableFuture<List<Order>> future =
    loadUser().thenCompose(
        this::loadOrders
    );
```

`thenCompose()`는 비동기 결과의 중첩을 평탄화한다.

```text
CompletableFuture<
    CompletableFuture<T>
>
→
CompletableFuture<T>
```

JavaScript Promise의 `.then()`은 콜백이 Promise를 반환하면 자동으로 해당 Promise의 상태를 따라간다.

Python에서는 자연스럽게 두 번 `await`하지 않고 다음처럼 작성한다.

```python
user = await load_user()
orders = await load_orders(user)
```

Java의 `thenCompose()`가 이 비동기 의존 관계를 표현한다.

---

## 8. 여러 CompletableFuture를 동시에 실행하기

서로 독립적인 두 작업이 있다고 하자.

```java
CompletableFuture<User> userFuture =
    loadUser();

CompletableFuture<List<Notice>> noticeFuture =
    loadNotices();
```

두 Future를 먼저 만들었으므로 두 작업은 동시에 진행될 수 있다.

두 결과가 모두 필요하다면 `thenCombine()`을 사용할 수 있다.

```java
CompletableFuture<UserPage> pageFuture =
    userFuture.thenCombine(
        noticeFuture,
        UserPage::new
    );
```

구조는 다음과 같다.

```text
loadUser 실행 ───────── 완료
                      ┐
                       → UserPage 생성
                      ┘
loadNotices 실행 ───── 완료
```

여러 개의 작업이 모두 끝나기만 기다리려면 `allOf()`를 사용할 수 있다.

```java
CompletableFuture<Void> all =
    CompletableFuture.allOf(
        userFuture,
        noticeFuture
    );
```

다만 `allOf()`의 결과 타입은 `Void`이므로 각 Future에서 결과를 별도로 꺼내야 한다.

```java
CompletableFuture<UserPage> pageFuture =
    CompletableFuture
        .allOf(
            userFuture,
            noticeFuture
        )
        .thenApply(ignored -> {
            User user = userFuture.join();
            List<Notice> notices =
                noticeFuture.join();

            return new UserPage(
                user,
                notices
            );
        });
```

`allOf()`가 완료된 뒤에는 두 Future가 이미 완료되었기 때문에 `join()`이 즉시 결과를 반환할 수 있다.

---

## 9. `join()`과 `get()`은 await가 아니다

다음 코드를 보자.

```java
ToolListResult result =
    future.join();
```

`join()`은 결과가 준비될 때까지 현재 스레드를 기다리게 한다.

```text
현재 스레드
→ join()
→ Future 미완료
→ 현재 스레드 블로킹
→ 완료 후 결과 반환
```

Python의 다음 코드와는 다르다.

```python
result = await future
```

Python의 `await`는 현재 코루틴을 중단하고 이벤트 루프가 다른 Task를 실행하게 한다.

Java의 `join()`은 현재 코루틴을 중단하는 문법이 아니다.

현재 Java 스레드가 결과를 기다린다.

```text
Python await
코루틴 대기
스레드는 다른 Task 실행 가능

Java join/get
현재 스레드 대기
```

`CompletableFuture`의 비동기성을 유지하려면 중간 과정에서 `join()`을 호출하기보다 continuation을 연결하는 편이 낫다.

```java
return loadUser()
    .thenCompose(this::loadOrders)
    .thenApply(this::createResponse);
```

마지막 경계에서 동기 결과가 반드시 필요한 경우에만 `join()`이나 `get()`을 고려한다.

---

## 10. CompletableFuture의 예외 처리

비동기 작업 중 발생한 예외는 `CompletableFuture`에 exceptional completion으로 저장된다.

다음과 같이 처리할 수 있다.

```java
CompletableFuture<List<Tool>> future =
    CompletableFuture
        .supplyAsync(session::listTools)
        .thenApply(
            ToolListResult::tools
        )
        .exceptionally(error -> {
            log.error(
                "Failed to list tools",
                error
            );

            return List.of();
        });
```

`exceptionally()`는 이전 단계가 예외로 완료된 경우 대체 결과를 만든다.

성공과 실패를 모두 확인하려면 `handle()`을 사용할 수 있다.

```java
CompletableFuture<List<Tool>> future =
    CompletableFuture
        .supplyAsync(session::listTools)
        .handle((result, error) -> {
            if (error != null) {
                return List.of();
            }

            return result.tools();
        });
```

부수 효과만 수행하려면 `whenComplete()`를 사용할 수 있다.

```java
future.whenComplete(
    (result, error) -> {
        if (error != null) {
            log.error(
                "Operation failed",
                error
            );
        }
    }
);
```

각 메서드의 목적을 단순화하면 다음과 같다.

```text
exceptionally
실패를 대체 결과로 복구

handle
성공과 실패를 모두 변환

whenComplete
결과를 변경하지 않고 성공·실패 관찰
```

---

## 11. CompletableFuture의 취소가 실제 작업 중단을 보장하지는 않는다

다음과 같이 취소를 요청할 수 있다.

```java
future.cancel(true);
```

하지만 Future를 취소했다고 실제 네트워크 요청이나 내부 작업이 반드시 중단되는 것은 아니다.

Java HTTP Client 공식 문서도 API가 반환한 `CompletableFuture`의 취소가 underlying operation을 interrupt하지 않을 수 있다고 명시한다.

다음 두 개념을 구분해야 한다.

```text
Future 상태를 cancelled로 변경
실제 실행 중인 외부 작업을 중단
```

실제 취소를 지원하려면 작업 자체가 취소 신호를 받아들여야 한다.

```text
HTTP 요청 취소
DB 쿼리 취소
외부 프로세스 종료
작업 스레드 interruption 처리
```

이는 JavaScript에서 Promise 자체에는 취소 기능이 없고, `AbortController` 같은 별도 메커니즘이 필요한 것과 비슷하다.

---

## 12. CompletableFuture 모델의 장점과 한계

`CompletableFuture`는 몇 개의 비동기 작업을 조합하기에 유용하다.

```text
단일 미래 결과 표현
후속 작업 연결
여러 Future 결합
성공·실패 처리
기존 Executor와 결합
```

하지만 체인이 길어지면 코드 흐름을 따라가기 어려워질 수 있다.

```java
return loadUser()
    .thenCompose(this::loadProfile)
    .thenCombine(
        loadPermissions(),
        UserContext::new
    )
    .thenCompose(this::loadDashboard)
    .handle(this::recoverDashboard);
```

또한 다음 사항을 계속 추적해야 한다.

```text
각 단계는 어느 Executor에서 실행되는가
어디서 블로킹 호출을 하는가
예외는 어느 단계에서 처리되는가
취소가 실제 작업까지 전달되는가
중간에 join()으로 블로킹하지 않는가
```

`CompletableFuture`는 단일 결과 중심의 비동기 조합에는 적합하지만, 여러 값이 계속 흐르는 스트림이나 수요 조절이 필요한 시스템을 표현하기에는 한계가 있다.

이 지점에서 Reactive Programming이 등장한다.

---

## 13. Reactor는 무엇을 해결하려는가

Project Reactor는 JVM에서 논블로킹 애플리케이션을 구축하기 위한 Reactive Streams 기반 라이브러리다.

Reactor의 중심 타입은 다음 두 가지다.

```java
Mono<T>
Flux<T>
```

단순화하면:

```text
Mono<T>
0개 또는 1개의 데이터

Flux<T>
0개 이상의 데이터 흐름
```

예를 들어 단일 HTTP 응답은 `Mono`로 표현할 수 있다.

```java
Mono<ToolListResult> resultMono =
    webClient
        .get()
        .uri("/tools")
        .retrieve()
        .bodyToMono(
            ToolListResult.class
        );
```

여러 이벤트가 계속 들어오는 스트림은 `Flux`로 표현할 수 있다.

```java
Flux<Event> events =
    eventClient.streamEvents();
```

Reactor는 단순히 `CompletableFuture`의 메서드 이름을 바꾼 라이브러리가 아니다.

```text
CompletableFuture
하나의 미래 결과가 중심

Reactor
데이터, 완료, 오류 신호가 흐르는 Publisher가 중심
```

---

## 14. Reactor의 핵심은 Publisher와 Subscriber다

Reactive Streams에서는 데이터를 발행하는 쪽과 소비하는 쪽을 구분한다.

```text
Publisher
데이터를 발행

Subscriber
데이터를 구독하고 소비
```

Reactor의 `Mono`와 `Flux`는 Publisher다.

```java
Mono<ToolListResult> resultMono =
    session.listTools();
```

이 객체는 결과값 자체가 아니다.

비동기 데이터가 어떻게 생성되고 처리될지를 표현하는 파이프라인이다.

```text
Mono<ToolListResult>
≠ ToolListResult

Mono<ToolListResult>
= ToolListResult가 전달될 수 있는 비동기 Publisher
```

실제 처리는 Subscriber가 구독하면서 시작된다.

```java
resultMono.subscribe(
    result -> {
        System.out.println(
            result.tools()
        );
    }
);
```

Reactor 공식 문서는 Reactive 모델의 특징 중 하나로 "구독하기 전에는 아무 일도 일어나지 않는다"는 점과 backpressure를 설명한다.

---

## 15. Reactor 파이프라인은 선언이고 실행은 나중이다

다음 코드를 보자.

```java
Mono<List<Tool>> toolsMono =
    session
        .listTools()
        .map(
            ToolListResult::tools
        );
```

이 코드는 보통 `ToolListResult::tools`를 즉시 실행하지 않는다.

실행될 파이프라인을 구성한다.

```text
session.listTools Publisher
→ 결과를 tools로 변환하는 map operator
→ Mono<List<Tool>>
```

구독이 발생하면 데이터가 흐르기 시작한다.

```java
toolsMono.subscribe(
    tools -> use(tools)
);
```

Spring WebFlux Controller에서는 개발자가 직접 `subscribe()`하지 않고 `Mono`나 `Flux`를 반환한다.

```java
@GetMapping("/tools")
public Mono<List<Tool>> listTools() {
    return session
        .listTools()
        .map(
            ToolListResult::tools
        );
}
```

Spring WebFlux가 반환된 Publisher를 구독하고 HTTP 응답으로 연결한다.

```text
개발자
Mono 파이프라인 반환

Spring WebFlux
Mono 구독

Reactor
데이터 흐름 실행

Spring
완료 데이터를 HTTP 응답으로 작성
```

---

## 16. `map()`과 `flatMap()`

Reactor에서도 `CompletableFuture`와 비슷하게 동기 변환과 비동기 변환을 구분한다.

결과를 단순히 변환하는 경우:

```java
Mono<List<Tool>> toolsMono =
    session
        .listTools()
        .map(
            ToolListResult::tools
        );
```

`map()`에 전달된 함수는 일반 값을 반환한다.

```text
ToolListResult
→ List<Tool>
```

다음 작업도 `Mono`를 반환한다면 `flatMap()`을 사용한다.

```java
Mono<List<ToolDetail>> detailsMono =
    session
        .listTools()
        .flatMap(
            result ->
                loadToolDetails(
                    result.tools()
                )
        );
```

`flatMap()`은 중첩된 Publisher를 하나의 흐름으로 연결한다.

```text
Mono<
    Mono<T>
>
→
Mono<T>
```

대응 관계는 다음과 같다.

```text
CompletableFuture.thenApply
Reactor.map

CompletableFuture.thenCompose
Reactor.flatMap
```

JavaScript Promise의 `.then()`은 반환값이 Promise이면 자동으로 평탄화한다.

Python의 `await`에서는 다음처럼 순차적으로 작성한다.

```python
result = await list_tools()
details = await load_tool_details(
    result.tools
)
```

---

## 17. Flux는 단일 결과 Future와 무엇이 다른가

`CompletableFuture<T>`는 일반적으로 한 번 완료된다.

```text
결과 하나
또는 예외 하나
```

`Flux<T>`는 여러 값을 시간에 따라 전달할 수 있다.

```text
onNext(value1)
onNext(value2)
onNext(value3)
onComplete()
```

또는 중간에 실패할 수 있다.

```text
onNext(value1)
onNext(value2)
onError(error)
```

예를 들어 서버 이벤트 스트림을 처리할 수 있다.

```java
Flux<Event> events =
    eventClient
        .streamEvents()
        .filter(Event::important)
        .map(this::normalize);
```

이것은 단순한 "나중에 Event 하나가 생긴다"는 Future 모델과 다르다.

```text
Future
한 번의 완료

Flux
여러 데이터와 완료·실패 신호의 시간적 흐름
```

---

## 18. Backpressure는 무엇인가

생산자가 데이터를 매우 빠르게 만들고 소비자가 느리게 처리한다고 하자.

```text
Producer
초당 10,000개 생성

Consumer
초당 100개 처리
```

아무런 조절이 없으면 데이터가 메모리에 계속 쌓이거나 소비자가 감당하지 못할 수 있다.

Backpressure는 소비자가 생산자에게 필요한 데이터 양을 알리는 메커니즘이다.

```text
Subscriber
100개 요청

Publisher
최대 100개 전달

처리 후
다음 수량 요청
```

Reactor 공식 문서는 backpressure를 소비자가 생산 속도가 너무 빠르다는 것을 생산자에게 알릴 수 있는 능력으로 설명하며, 요청이 upstream operator로 전달된다고 설명한다.

Backpressure는 단일 HTTP 응답 하나를 처리할 때는 눈에 잘 띄지 않는다.

하지만 다음과 같은 연속 데이터에서 중요하다.

```text
메시지 스트림
로그 스트림
파일 청크
데이터베이스 결과 스트림
서버 전송 이벤트
실시간 센서 데이터
```

---

## 19. Reactor는 자동으로 별도 스레드에서 실행되는가

`Mono`나 `Flux`를 사용한다고 코드가 자동으로 별도 스레드에서 실행되는 것은 아니다.

Reactor 공식 문서도 `Flux`나 `Mono`를 얻었다고 전용 Thread에서 실행된다는 뜻은 아니라고 설명한다.

기본적으로 operator는 신호를 전달하는 현재 스레드에서 실행될 수 있다.

```java
Mono.just(10)
    .map(value -> value * 2)
    .subscribe(
        System.out::println
    );
```

이 코드는 현재 스레드에서 동기적으로 완료될 수도 있다.

실행 스레드를 바꾸려면 Scheduler를 사용한다.

```java
mono.publishOn(
    Schedulers.parallel()
);
```

또는:

```java
mono.subscribeOn(
    Schedulers.boundedElastic()
);
```

`publishOn()`과 `subscribeOn()`은 의미가 다르며, Reactor에서 스레드 전환은 명시적으로 이해해야 한다.

```text
subscribeOn
구독과 upstream 실행이 시작될 Scheduler에 영향

publishOn
해당 지점 이후 operator 실행 Scheduler 전환
```

---

## 20. Reactor에서 블로킹 호출을 하면 생기는 문제

다음 WebFlux 코드는 겉보기에는 Reactive하다.

```java
@GetMapping("/tools")
public Mono<List<Tool>> listTools() {
    return Mono.fromCallable(
        session::listTools
    ).map(
        ToolListResult::tools
    );
}
```

하지만 `session.listTools()`가 블로킹 호출이고 이벤트 루프 스레드에서 실행된다면 문제가 생긴다.

```text
Event Loop Thread
→ 블로킹 session.listTools 실행
→ 응답까지 Thread 정지
→ 같은 Event Loop의 다른 요청 처리 지연
```

`Mono`로 감쌌다고 블로킹 코드가 논블로킹 코드로 변하는 것은 아니다.

블로킹 호출을 반드시 사용해야 한다면 제한된 별도 Scheduler로 넘길 수 있다.

```java
@GetMapping("/tools")
public Mono<List<Tool>> listTools() {
    return Mono
        .fromCallable(
            session::listTools
        )
        .subscribeOn(
            Schedulers.boundedElastic()
        )
        .map(
            ToolListResult::tools
        );
}
```

하지만 이것은 블로킹 자체를 없애는 것이 아니다.

```text
블로킹 작업
그대로 존재

변경된 점
Event Loop Thread 대신 별도 Worker가 블로킹
```

Python의 `asyncio.to_thread()`와 비슷한 접근이다.

---

## 21. Spring WebFlux는 무엇인가

Spring WebFlux는 Spring Framework의 Reactive Web Stack이다.

Spring 공식 문서에 따르면 WebFlux는 완전히 논블로킹이고 Reactive Streams backpressure를 지원하며, Netty와 Servlet Container 같은 서버에서 실행할 수 있다.

Spring MVC와 WebFlux는 같은 HTTP 요청을 처리하지만 기반 실행 모델이 다르다.

```text
Spring MVC
Servlet 기반
전통적으로 요청을 Thread 중심으로 처리

Spring WebFlux
Reactive Streams 기반
논블로킹 I/O와 Publisher 중심
```

WebFlux의 `WebClient`도 Reactor 기반 API다.

공식 문서는 `WebClient`가 Reactor에 기반한 함수형 API를 제공하고, 논블로킹과 스트리밍을 지원한다고 설명한다.

예를 들어:

```java
public Mono<ToolListResult>
listTools() {
    return webClient
        .get()
        .uri("/tools")
        .retrieve()
        .bodyToMono(
            ToolListResult.class
        );
}
```

이 코드는 HTTP 응답을 기다리며 현재 스레드를 블로킹하는 대신, 응답 신호가 올 때 다음 operator가 실행되는 파이프라인을 구성한다.

---

## 22. Spring MVC와 WebFlux는 단순히 문법 차이가 아니다

다음 Spring MVC 코드를 보자.

```java
@GetMapping("/tools")
public List<Tool> listTools() {
    ToolListResult result =
        session.listTools();

    return result.tools();
}
```

호출 스택은 요청을 처리하는 동안 유지된다.

```text
Controller
→ Service
→ HTTP Client
→ 응답 대기
→ Service 반환
→ Controller 반환
```

WebFlux에서는 다음처럼 Publisher를 반환한다.

```java
@GetMapping("/tools")
public Mono<List<Tool>> listTools() {
    return session
        .listTools()
        .map(
            ToolListResult::tools
        );
}
```

처음 Controller가 실행될 때 결과 목록은 아직 없다.

```text
Controller
→ Mono 파이프라인 반환
→ 호출 스택 종료
→ 네트워크 응답 대기
→ 응답 이벤트 발생
→ Reactor operator 실행
→ HTTP 응답 작성
```

한 요청이 여러 스레드에서 이어질 수도 있으므로, WebFlux에서는 Thread ID만으로 요청 로그를 연결하기 어렵다. Spring 공식 문서도 WebFlux의 단일 요청이 여러 스레드에서 실행될 수 있다고 설명한다.

---

## 23. Virtual Thread는 무엇인가

Virtual Thread는 Java Runtime이 스케줄링하는 경량 Thread다.

Oracle 문서는 Virtual Thread를 고처리량 동시 애플리케이션의 작성과 유지보수, 디버깅 부담을 줄이는 가벼운 스레드라고 설명한다.

Java에서는 두 종류의 Thread를 구분할 수 있다.

```text
Platform Thread
운영체제 Thread와 밀접하게 연결

Virtual Thread
JVM이 스케줄링하는 가벼운 Thread
```

전통적인 플랫폼 스레드는 일반적으로 운영체제 스레드와 거의 일대일로 연결된다.

```text
Java Platform Thread
↔ OS Thread
```

Virtual Thread는 많은 수가 더 적은 플랫폼 스레드 위에서 실행될 수 있다.

```text
Virtual Thread A ┐
Virtual Thread B ├─ JVM Scheduler
Virtual Thread C ┘
                 ↓
          Platform Threads
```

Virtual Thread는 JDK 21에서 정식 기능으로 제공됐으며, Java의 `Thread` API 안에 통합되어 있다.

---

## 24. Virtual Thread는 코루틴인가

내부적으로 중단과 재개가 일어난다는 점에서는 코루틴과 비슷한 부분이 있다.

하지만 개발자에게 제공하는 추상화는 다르다.

C++이나 Python의 코루틴에서는 중단 지점을 코드에 직접 표시한다.

```cpp
auto result = co_await operation();
```

```python
result = await operation()
```

Virtual Thread에서는 일반적인 블로킹 코드를 그대로 작성한다.

```java
ToolListResult result =
    session.listTools();

return result.tools();
```

개발자는 `await`를 쓰지 않는다.

```text
코드 관점
일반 Thread와 동일한 순차 실행

JVM 관점
I/O 대기 중인 Virtual Thread를 효율적으로 관리
```

따라서 Virtual Thread는 "Java에 추가된 async/await"라기보다 다음에 가깝다.

> 스레드 기반 프로그래밍 모델을 유지하면서, 스레드 하나당 비용을 크게 낮춘 실행 모델

---

## 25. Carrier Thread란 무엇인가

Virtual Thread의 Java 코드는 실제 CPU에서 실행될 때 Platform Thread 위에서 실행된다.

Virtual Thread를 실행하는 Platform Thread를 설명할 때 흔히 **Carrier Thread**라고 부른다.

```text
Virtual Thread
→ Carrier Platform Thread 위에서 실행
```

Virtual Thread가 I/O 대기로 블로킹되면 JVM은 가능한 경우 해당 Virtual Thread의 실행 상태를 Carrier Thread에서 분리한다.

```text
Virtual Thread A 실행
→ I/O 대기
→ Carrier Thread에서 분리

Carrier Thread
→ Virtual Thread B 실행
```

응답이 도착하면 Virtual Thread A는 다시 실행 가능한 상태가 되고, 이후 어떤 Carrier Thread에서 재개될 수 있다.

```text
I/O 완료
→ Virtual Thread A runnable
→ JVM Scheduler가 Carrier Thread 선택
→ A 재개
```

개발자는 이를 위해 코드를 continuation 체인으로 바꿀 필요가 없다.

---

## 26. Virtual Thread는 무엇을 저장하는가

일반 Thread 기반 코드에는 호출 스택이 있다.

```text
Controller
└─ Service
   └─ Repository
      └─ HTTP 또는 DB 호출
```

Virtual Thread도 개발자 관점에서는 독립적인 호출 스택을 가진 Thread처럼 동작한다.

대기 시 JVM은 Virtual Thread의 실행 상태를 관리하고, Carrier Thread는 다른 Virtual Thread를 실행할 수 있다.

따라서 다음 장점이 있다.

```text
기존 동기 코드 구조 유지
일반적인 try/catch 사용
ThreadLocal 모델 유지 가능
디버거에서 순차적인 호출 스택 확인
라이브러리의 블로킹 API 재사용
```

이 점이 callback이나 Reactive 체인과 크게 다르다.

---

## 27. Virtual Thread 사용 예제

Virtual Thread를 직접 시작할 수 있다.

```java
Thread thread =
    Thread.startVirtualThread(() -> {
        ToolListResult result =
            session.listTools();

        System.out.println(
            result.tools()
        );
    });
```

Virtual Thread 전용 Executor도 사용할 수 있다.

```java
try (
    ExecutorService executor =
        Executors
            .newVirtualThreadPerTaskExecutor()
) {
    Future<ToolListResult> future =
        executor.submit(
            session::listTools
        );

    ToolListResult result =
        future.get();
}
```

여기서는 작업 하나마다 Virtual Thread가 생성된다.

Virtual Thread는 풀링하여 재사용하는 자원으로 보기보다 작업당 하나를 생성하는 모델에 가깝다.

```text
전통적인 Platform Thread
비싸므로 Thread Pool에서 재사용

Virtual Thread
가벼우므로 작업당 생성 가능
```

---

## 28. Virtual Thread도 블로킹된다

Virtual Thread가 블로킹되지 않는 것은 아니다.

다음 코드는 여전히 대기한다.

```java
ToolListResult result =
    session.listTools();
```

현재 Virtual Thread는 응답이 올 때까지 다음 줄로 진행하지 못한다.

```text
현재 Virtual Thread
→ 블로킹

Carrier Thread
→ 가능하면 다른 Virtual Thread 실행
```

즉:

```text
논리적인 Thread는 블로킹된다.
물리적인 Platform Thread는 반드시 함께 묶여 있지 않을 수 있다.
```

이것이 Reactive 모델과의 핵심 차이다.

```text
Reactive
요청 처리 호출 스택을 해체하고
continuation 신호로 이어감

Virtual Thread
요청별 호출 스택을 유지하고
JVM이 경량 Thread 상태를 관리
```

---

## 29. Virtual Thread는 처리 속도를 높이는 기능인가

Virtual Thread는 CPU 연산 자체를 빠르게 만드는 기능이 아니다.

Oracle의 최신 Thread API 문서도 Virtual Thread가 대부분의 시간을 I/O 대기로 보내는 작업에 적합하며, 장시간 CPU 집약 작업을 위한 기능은 아니라고 설명한다.

예를 들어 다음 계산은 Virtual Thread로 실행해도 계산량이 줄어들지 않는다.

```java
long calculate() {
    long total = 0;

    for (
        long i = 0;
        i < 10_000_000_000L;
        i++
    ) {
        total += i;
    }

    return total;
}
```

Virtual Thread의 장점은 다음 상황에서 나타난다.

```text
많은 요청이 동시에 존재
각 요청이 네트워크·DB·파일 I/O에서 자주 대기
동기식 라이브러리를 사용
요청별 순차 코드 구조를 유지하고 싶음
```

목표는 한 요청의 응답 시간을 마법처럼 줄이는 것이 아니다.

```text
Latency
개별 작업이 완료되는 시간

Throughput
일정 시간 동안 처리할 수 있는 작업 수
```

Virtual Thread는 주로 많은 대기 작업을 수용하여 throughput과 확장성을 개선하려는 기능이다.

---

## 30. Pinned Virtual Thread는 무엇인가

Virtual Thread가 블로킹될 때 항상 Carrier Thread에서 자유롭게 분리되는 것은 아니다.

특정 상황에서는 Virtual Thread가 Carrier Thread에 고정된 상태로 대기할 수 있다.

이를 흔히 **pinning**이라고 한다.

Spring Boot 공식 문서도 Virtual Thread 사용 시 pinned virtual thread 때문에 throughput이 낮아질 수 있으며, JDK Flight Recorder나 `jcmd`로 확인할 수 있다고 안내한다.

Pinning이 발생하면:

```text
Virtual Thread 블로킹
→ Carrier Thread도 함께 점유
→ 다른 Virtual Thread를 실행하지 못함
```

그러면 Virtual Thread의 확장성 이점이 줄어든다.

모든 `synchronized` 사용이 곧바로 잘못된다는 식으로 단순화할 수는 없지만, 장시간 블로킹 작업과 모니터 보유가 겹치는 코드는 주의해야 한다.

```java
synchronized (lock) {
    blockingIoOperation();
}
```

실제 애플리케이션에서는 추측만으로 판단하지 않고 JFR과 부하 테스트를 통해 확인해야 한다.

---

## 31. Virtual Thread가 무제한 동시성을 의미하지는 않는다

Virtual Thread를 매우 많이 만들 수 있다고 해서 외부 자원도 무한히 사용할 수 있는 것은 아니다.

예를 들어 데이터베이스 Connection Pool이 30개라면 동시에 DB 작업을 수행할 수 있는 요청 수도 제한된다.

```text
Virtual Thread 100,000개
DB Connection 30개
```

많은 Virtual Thread가 DB Connection을 기다릴 수는 있지만, 실제 DB가 처리할 수 있는 동시 작업 수는 늘어나지 않는다.

다음 자원은 별도로 제한해야 한다.

```text
데이터베이스 Connection
외부 API Rate Limit
파일 Descriptor
메모리
CPU
동시 외부 요청 수
```

Spring Framework도 Virtual Thread처럼 일반적인 Thread Pool 제한이 없는 환경에서는 별도의 동시성 제한이 유용할 수 있다고 설명한다.

Virtual Thread는 값싼 대기 단위를 제공할 뿐, downstream 시스템의 용량 제한을 없애지 않는다.

---

## 32. Spring Boot에서 Virtual Thread 사용하기

현재 Spring Boot에서는 Java 21 이상을 사용하는 경우 다음 설정으로 Virtual Thread 사용을 활성화할 수 있다.

```properties
spring.threads.virtual.enabled=true
```

Spring Boot 공식 문서가 이 설정을 안내하며, 사용 전 Virtual Thread의 pinning 특성을 검토하도록 권고한다.

Spring Framework의 Task Executor도 Virtual Thread 옵션을 지원한다.

공식 문서에 따르면 `SimpleAsyncTaskExecutor`는 Virtual Thread 옵션을 활성화했을 때 JDK 21 Virtual Thread를 사용할 수 있다.

다만 설정 하나를 켰다고 애플리케이션의 모든 코드가 자동으로 안전하고 빠르게 변하는 것은 아니다.

다음 항목을 함께 확인해야 한다.

```text
사용하는 Spring Boot 버전
내장 웹 서버 지원
JDBC와 HTTP Client의 동작
Connection Pool 크기
ThreadLocal 사용
synchronized 영역
외부 시스템 제한
실제 부하 테스트 결과
```

---

## 33. Spring MVC와 Virtual Thread

Spring MVC는 Servlet API 기반의 전통적인 Web Framework다.

기존 Spring MVC 코드는 보통 다음처럼 순차적으로 작성한다.

```java
@RestController
@RequiredArgsConstructor
public class ToolController {

    private final ToolService toolService;

    @GetMapping("/tools")
    public List<Tool> listTools() {
        return toolService.listTools();
    }
}
```

```java
@Service
@RequiredArgsConstructor
public class ToolService {

    private final ToolSession session;

    public List<Tool> listTools() {
        ToolListResult result =
            session.listTools();

        return result.tools();
    }
}
```

Virtual Thread를 적용하면 코드 구조는 유지된다.

```text
Controller
→ Service
→ 외부 호출
→ 결과 반환
```

다만 요청 처리 Thread가 Platform Thread 대신 Virtual Thread가 될 수 있다.

```text
기존 Spring MVC
요청당 Platform Thread

Virtual Thread 활성화
요청당 Virtual Thread
```

따라서 다음 상황에서 매력적이다.

```text
JDBC처럼 블로킹 API를 많이 사용
기존 MVC 코드가 이미 큼
Reactive 체인으로 전환할 비용이 큼
요청 흐름을 순차 코드로 유지하고 싶음
```

---

## 34. Spring WebFlux와 Virtual Thread는 같은 해결책이 아니다

두 모델 모두 많은 I/O 대기 요청을 처리할 수 있지만 접근 방식은 다르다.

### Spring WebFlux

```text
소수의 Event Loop Thread
논블로킹 I/O
요청 호출 스택을 오래 유지하지 않음
Mono/Flux continuation으로 처리
```

### Spring MVC + Virtual Thread

```text
요청마다 Virtual Thread
블로킹 코드 허용
요청별 호출 스택 유지
JVM이 많은 Virtual Thread를 스케줄링
```

코드도 다르다.

WebFlux:

```java
public Mono<List<Tool>> listTools() {
    return session
        .listTools()
        .map(
            ToolListResult::tools
        );
}
```

Virtual Thread 기반 MVC:

```java
public List<Tool> listTools() {
    ToolListResult result =
        session.listTools();

    return result.tools();
}
```

어느 하나가 항상 더 최신이거나 우월한 것은 아니다.

해결하려는 문제와 사용하는 생태계가 다르다.

---

## 35. Reactive 모델이 여전히 필요한 이유

Virtual Thread가 등장했으니 WebFlux가 필요 없어졌다고 단정할 수는 없다.

Reactive 모델은 단순히 스레드 비용을 줄이는 기능이 아니기 때문이다.

Reactor는 다음을 직접 표현한다.

```text
비동기 데이터 스트림
Backpressure
연속 데이터 변환
여러 Publisher의 결합
시간 기반 operator
취소 신호 전파
논블로킹 네트워크 처리
```

특히 다음 경우 Reactive 모델이 자연스럽다.

```text
서버 전송 이벤트
WebSocket
메시지 브로커 스트림
실시간 이벤트 처리
대규모 fan-out
느린 소비자에 대한 backpressure
처음부터 끝까지 Reactive Driver 사용
```

Virtual Thread는 Thread 기반 코드를 확장성 있게 실행하는 방법이지, `Flux` 같은 다중 데이터 스트림 추상화를 대체하지 않는다.

---

## 36. Virtual Thread가 더 자연스러운 경우

다음 상황에서는 Virtual Thread 기반의 명령형 코드가 더 단순할 수 있다.

```text
일반적인 요청-응답 API
한 요청이 몇 개의 DB·HTTP 호출 수행
JDBC와 블로킹 SDK 사용
팀이 Spring MVC와 명령형 코드에 익숙함
복잡한 스트림·backpressure 요구가 없음
```

예를 들어:

```java
public UserPage loadPage(
    long userId
) {
    User user =
        userRepository.findById(userId);

    List<Order> orders =
        orderClient.loadOrders(userId);

    List<Notice> notices =
        noticeClient.loadNotices(userId);

    return new UserPage(
        user,
        orders,
        notices
    );
}
```

호출 스택과 지역변수, 예외 처리를 일반적인 Java 방식으로 유지할 수 있다.

Reactive로 작성하면 다음처럼 바뀔 수 있다.

```java
public Mono<UserPage> loadPage(
    long userId
) {
    Mono<User> user =
        userRepository.findById(userId);

    Mono<List<Order>> orders =
        orderClient.loadOrders(userId);

    Mono<List<Notice>> notices =
        noticeClient.loadNotices(userId);

    return Mono.zip(
        user,
        orders,
        notices
    ).map(tuple ->
        new UserPage(
            tuple.getT1(),
            tuple.getT2(),
            tuple.getT3()
        )
    );
}
```

Reactive 요구가 없다면 첫 번째 코드가 더 쉽게 읽히고 디버깅될 수 있다.

---

## 37. CompletableFuture는 두 모델 사이에서 어떤 위치인가

`CompletableFuture`는 Reactor처럼 전체 애플리케이션을 Reactive Stack으로 바꾸지 않고도 일부 비동기 작업을 조합할 수 있다.

또한 Virtual Thread처럼 모든 작업을 순차적인 블로킹 코드로 유지하지도 않는다.

```text
CompletableFuture
명시적인 비동기 결과 조합

Reactor
Publisher 기반 전체 데이터 흐름

Virtual Thread
Thread 기반 순차 실행
```

예를 들어 독립적인 외부 호출 두 개를 동시에 시작하고 싶다면 `CompletableFuture`가 유용할 수 있다.

```java
CompletableFuture<User> userFuture =
    CompletableFuture.supplyAsync(
        () -> loadUser(userId),
        executor
    );

CompletableFuture<List<Order>>
ordersFuture =
    CompletableFuture.supplyAsync(
        () -> loadOrders(userId),
        executor
    );

return userFuture
    .thenCombine(
        ordersFuture,
        UserPage::new
    );
```

하지만 호출 체인이 많아지고 스트리밍이 필요하면 Reactor가 더 자연스러울 수 있다.

Virtual Thread를 사용한다면 동시 작업을 Thread 기반 API로 구성할 수도 있다.

모델을 섞을 수는 있지만, 각 경계에서 실행 방식과 취소·예외 정책이 복잡해질 수 있다.

---

## 38. `@Async`는 어느 모델인가

Spring에는 `@Async`가 있다.

```java
@Async
public CompletableFuture<Result>
processAsync() {
    Result result = process();
    return CompletableFuture
        .completedFuture(result);
}
```

`@Async`는 Spring AOP Proxy가 메서드 호출을 가로채 Task Executor에 제출하는 방식이다.

개발자가 작성한 객체의 메서드가 직접 새로운 스레드를 만드는 것이 아니다.

```text
호출자
→ Spring Proxy
→ Task Executor에 작업 제출
→ 실제 Bean 메서드 실행
```

이를 이해할 때 다음 역할을 구분해야 한다.

```text
개발자 코드
메서드 본문 작성

Spring Proxy
호출 가로채기

TaskExecutor
작업 실행 Thread 결정

CompletableFuture
결과 전달
```

주의할 점은 같은 객체 내부에서 자기 메서드를 직접 호출하는 self-invocation이다.

```java
@Service
public class ToolService {

    public void outer() {
        innerAsync();
    }

    @Async
    public void innerAsync() {
        ...
    }
}
```

`outer()`에서 `this.innerAsync()`와 같은 내부 호출이 일어나면 Proxy를 거치지 않아 `@Async`가 적용되지 않을 수 있다.

이는 `@Transactional`의 self-invocation 문제와 같은 Proxy 구조에서 발생한다.

---

## 39. `@Async`를 붙이면 논블로킹이 되는가

그렇지 않다.

```java
@Async
public CompletableFuture<Result>
loadData() {
    Result result =
        blockingClient.load();

    return CompletableFuture
        .completedFuture(result);
}
```

`blockingClient.load()`는 여전히 블로킹 호출이다.

달라진 점은 호출자 스레드가 아니라 Task Executor의 Worker Thread가 블로킹된다는 것이다.

```text
기존
요청 Thread가 블로킹

@Async
Executor Worker Thread가 블로킹
```

따라서 `@Async`는 블로킹 API를 논블로킹 API로 변환하지 않는다.

단지 작업 실행 위치와 결과 전달 방식을 바꾼다.

Virtual Thread 기반 Executor를 사용한다면 Worker가 Virtual Thread일 수 있지만, 외부 자원 제한은 여전히 고려해야 한다.

---

## 40. Java에서 Python의 await와 가장 가까운 것은 무엇인가

표면적인 코드 모양만 보면 `CompletableFuture`가 JavaScript Promise와 가장 가깝다.

```text
JavaScript Promise
↔ Java CompletableFuture
```

하지만 Python의 `await`처럼 현재 함수의 로컬 상태를 유지하면서 코드 중간에서 명시적으로 중단하는 Java 문법은 없다.

```python
result = await operation()
use(result)
```

Java에서 `CompletableFuture`로 표현하면:

```java
return operation()
    .thenApply(this::use);
```

Virtual Thread로 표현하면:

```java
Result result = operation();
return use(result);
```

첫 번째는 continuation 기반이다.

두 번째는 Thread 기반 순차 실행이다.

따라서 "Java의 await는 무엇인가?"라는 질문에는 하나의 답이 없다.

```text
비동기 결과 연결 관점
CompletableFuture

Reactive Stream 관점
Mono/Flux

순차 코드와 경량 대기 관점
Virtual Thread
```

---

## 41. 같은 작업을 세 방식으로 비교하기

외부 MCP 스타일 서버에서 도구 목록을 가져온다고 하자.

### CompletableFuture

```java
public CompletableFuture<List<Tool>>
listTools() {
    return CompletableFuture
        .supplyAsync(
            session::listTools,
            executor
        )
        .thenApply(
            ToolListResult::tools
        );
}
```

실행 구조:

```text
Executor에서 블로킹 호출
→ CompletableFuture 완료
→ thenApply continuation 실행
```

### Reactor

```java
public Mono<List<Tool>>
listTools() {
    return session
        .listToolsReactive()
        .map(
            ToolListResult::tools
        );
}
```

실행 구조:

```text
구독 발생
→ 논블로킹 요청 등록
→ 응답 신호 도착
→ map operator 실행
→ 완료 신호 전달
```

### Virtual Thread

```java
public List<Tool> listTools() {
    ToolListResult result =
        session.listTools();

    return result.tools();
}
```

실행 구조:

```text
Virtual Thread에서 순차 실행
→ I/O 대기 시 Virtual Thread 블로킹
→ JVM이 Carrier Thread 활용
→ 응답 후 같은 논리적 Thread 재개
```

결과는 같지만 추상화가 다르다.

---

## 42. 예외 처리 비교

### CompletableFuture

```java
return loadTools()
    .exceptionally(error -> {
        log.error(
            "Failed",
            error
        );

        return List.of();
    });
```

예외는 Future의 exceptional completion으로 전달된다.

### Reactor

```java
return loadTools()
    .onErrorReturn(
        List.of()
    );
```

예외는 `onError` 신호로 전달된다.

### Virtual Thread

```java
try {
    return loadTools();
} catch (ToolException error) {
    log.error(
        "Failed",
        error
    );

    return List.of();
}
```

일반적인 Thread 호출 스택의 예외 전파를 사용한다.

이 차이가 각 모델의 디버깅 경험과 코드 작성 방식에 직접 영향을 준다.

---

## 43. 지역변수와 실행 흐름 비교

다음과 같은 순차 작업이 있다고 하자.

```text
사용자 조회
→ 주문 조회
→ 결제 정보 조회
→ 응답 생성
```

### CompletableFuture

```java
return loadUser(userId)
    .thenCompose(user ->
        loadOrders(user)
            .thenCombine(
                loadPayment(user),
                (orders, payment) ->
                    new UserPage(
                        user,
                        orders,
                        payment
                    )
            )
    );
```

필요한 값은 람다 캡처와 단계 결과로 전달한다.

### Reactor

```java
return loadUser(userId)
    .flatMap(user ->
        Mono.zip(
            loadOrders(user),
            loadPayment(user)
        ).map(tuple ->
            new UserPage(
                user,
                tuple.getT1(),
                tuple.getT2()
            )
        )
    );
```

데이터가 Publisher 체인을 따라 흐른다.

### Virtual Thread

```java
User user =
    loadUser(userId);

List<Order> orders =
    loadOrders(user);

Payment payment =
    loadPayment(user);

return new UserPage(
    user,
    orders,
    payment
);
```

일반 지역변수와 호출 스택을 그대로 사용한다.

코드가 복잡해질수록 이 차이는 더 커진다.

---

## 44. ThreadLocal과 Context

Spring MVC의 전통적인 Thread 기반 코드에서는 요청 정보를 `ThreadLocal`에 저장하는 패턴이 사용되어 왔다.

```text
현재 요청 Thread
→ SecurityContext
→ Transaction Context
→ Logging Context
```

Virtual Thread도 Thread이므로 기본적으로 Thread 기반 모델과 잘 맞는다.

하지만 Virtual Thread 수가 매우 많아질 수 있으므로 ThreadLocal에 큰 객체를 저장하면 메모리 사용을 주의해야 한다.

WebFlux에서는 하나의 요청이 여러 Thread로 이동할 수 있으므로 ThreadLocal만으로 요청 Context를 전달하기 어렵다.

Reactor는 별도의 Context 전달 모델을 사용한다.

```text
ThreadLocal
Thread에 종속

Reactor Context
Publisher 구독 흐름에 종속
```

이 차이는 인증 정보, 트랜잭션, 추적 ID, 로그 Context를 설계할 때 중요하다.

---

## 45. 트랜잭션과 비동기 경계

Spring의 일반적인 선언적 트랜잭션은 Proxy가 메서드 호출 전후에 트랜잭션을 시작하고 종료한다.

```java
@Transactional
public void updateOrder() {
    ...
}
```

Thread 기반 동기 코드에서는 트랜잭션 자원이 현재 Thread에 연결되는 경우가 많다.

하지만 `CompletableFuture`로 다른 Executor에 작업을 넘기면 Thread가 바뀐다.

```java
@Transactional
public CompletableFuture<Void>
updateAsync() {
    return CompletableFuture.runAsync(
        this::updateDatabase
    );
}
```

바깥 메서드의 트랜잭션 Context가 새 Worker Thread로 자동 전파된다고 가정하면 안 된다.

Reactor에서는 Reactive Transaction Manager와 Reactor Context를 사용하는 별도의 모델이 필요하다.

Virtual Thread에서는 일반적인 Thread 기반 트랜잭션 구조를 더 자연스럽게 유지할 수 있지만, 비동기 Executor 경계를 별도로 넘으면 여전히 Context 전파 문제가 생긴다.

따라서 "비동기"는 단순히 실행 속도 문제가 아니다.

```text
트랜잭션 경계
보안 Context
로그 Context
예외 전파
취소
자원 수명
```

모두 함께 달라질 수 있다.

---

## 46. 어떤 모델을 선택해야 할까

선택 기준을 단순화하면 다음과 같다.

### CompletableFuture가 잘 맞는 경우

```text
몇 개의 독립적인 비동기 작업을 조합
Executor를 직접 관리할 이유가 있음
기존 코드 일부만 비동기화
단일 결과 중심
전체 Reactive Stack은 필요 없음
```

### Reactor와 WebFlux가 잘 맞는 경우

```text
처음부터 끝까지 논블로킹 Driver 사용
스트리밍 데이터 처리
Backpressure 필요
Reactive 라이브러리와 통합
높은 동시 연결을 소수 Thread로 관리
팀이 Reactive 모델을 이해하고 있음
```

### Spring MVC와 Virtual Thread가 잘 맞는 경우

```text
요청-응답 중심
JDBC와 블로킹 SDK 사용
기존 명령형 코드 유지
많은 I/O 대기 요청 처리
Thread 기반 디버깅과 Context 모델 선호
```

가장 중요한 것은 유행하는 기술을 선택하는 것이 아니다.

> 애플리케이션의 I/O 방식과 라이브러리 생태계에 맞는 실행 모델을 선택해야 한다.

---

## 47. 피해야 할 혼합 구조

모델을 혼합해야 할 때도 있지만, 의미 없이 섞으면 복잡성만 늘어난다.

예를 들어 WebFlux Controller에서 Reactive 파이프라인을 만들고 중간에 `block()`을 호출하면:

```java
@GetMapping("/tools")
public List<Tool> listTools() {
    return session
        .listTools()
        .map(
            ToolListResult::tools
        )
        .block();
}
```

Reactive 파이프라인의 결과를 기다리며 현재 Thread를 블로킹한다.

Event Loop Thread에서 실행된다면 심각한 문제가 될 수 있다.

반대로 동기식 MVC 코드에서 모든 값을 의미 없이 `Mono.just()`로 감싼다고 논블로킹이 되는 것도 아니다.

```java
public Mono<List<Tool>> listTools() {
    ToolListResult result =
        blockingSession.listTools();

    return Mono.just(
        result.tools()
    );
}
```

블로킹 호출은 이미 `Mono.just()` 이전에 실행됐다.

```text
blockingSession.listTools()
→ Thread 블로킹
→ 결과가 나온 뒤 Mono 생성
```

`CompletableFuture`에서도 같은 문제가 있다.

```java
CompletableFuture
    .completedFuture(
        blockingSession.listTools()
    );
```

`blockingSession.listTools()`는 `completedFuture()`를 호출하기 전에 현재 Thread에서 실행된다.

비동기 타입으로 감싼다고 내부 작업이 자동으로 비동기가 되는 것은 아니다.

---

## 48. 실무에서 먼저 확인해야 할 질문

새로운 기술을 선택하기 전에 다음 질문부터 확인하는 것이 좋다.

```text
외부 I/O API는 블로킹인가 논블로킹인가
데이터가 하나인가 스트림인가
Backpressure가 필요한가
호출 수가 얼마나 많은가
CPU 작업인가 I/O 대기 작업인가
사용 중인 DB Driver는 무엇인가
팀이 Reactive 디버깅에 익숙한가
기존 코드를 얼마나 변경할 수 있는가
취소와 타임아웃은 어떻게 전달되는가
외부 시스템의 동시 처리 제한은 얼마인가
```

이 답을 모른 채 "WebFlux가 빠르다" 또는 "Virtual Thread가 더 최신이다"라는 이유만으로 선택하면 기대와 다른 결과가 나올 수 있다.

---

## 49. 작은 실험 1: CompletableFuture 실행 Thread 확인

다음 코드를 실행해보자.

```java
import java.util.concurrent.*;

public class CompletableFutureExample {

    public static void main(
        String[] args
    ) {
        CompletableFuture<Integer> future =
            CompletableFuture
                .supplyAsync(() -> {
                    printThread(
                        "supplyAsync"
                    );

                    return 10;
                })
                .thenApply(value -> {
                    printThread(
                        "thenApply"
                    );

                    return value * 2;
                })
                .thenApplyAsync(value -> {
                    printThread(
                        "thenApplyAsync"
                    );

                    return value + 1;
                });

        System.out.println(
            future.join()
        );
    }

    private static void printThread(
        String stage
    ) {
        System.out.println(
            stage
                + ": "
                + Thread
                    .currentThread()
                    .getName()
        );
    }
}
```

확인할 부분은 다음과 같다.

```text
supplyAsync는 어느 Thread에서 실행되는가
thenApply는 어느 Thread에서 실행되는가
thenApplyAsync는 어느 Thread에서 실행되는가
join을 호출한 main Thread는 언제 대기하는가
```

실행 환경에 따라 정확한 Thread 이름은 달라질 수 있다.

핵심은 각 continuation이 자동으로 동일한 Thread에서 실행된다고 가정하면 안 된다는 것이다.

---

## 50. 작은 실험 2: Virtual Thread 확인

다음 코드를 실행해보자.

```java
public class VirtualThreadExample {

    public static void main(
        String[] args
    ) throws InterruptedException {
        Thread thread =
            Thread.startVirtualThread(
                () -> {
                    System.out.println(
                        Thread.currentThread()
                    );

                    try {
                        Thread.sleep(1000);
                    } catch (
                        InterruptedException error
                    ) {
                        Thread
                            .currentThread()
                            .interrupt();
                    }

                    System.out.println(
                        "completed"
                    );
                }
            );

        thread.join();
    }
}
```

확인할 부분은 다음과 같다.

```text
생성된 Thread가 Virtual Thread로 표시되는가
Thread.sleep 동안 논리적 Thread는 대기하는가
코드는 일반 Thread 방식과 얼마나 비슷한가
```

대량의 Virtual Thread도 만들어볼 수 있다.

```java
try (
    var executor =
        Executors
            .newVirtualThreadPerTaskExecutor()
) {
    for (
        int i = 0;
        i < 10_000;
        i++
    ) {
        executor.submit(() -> {
            Thread.sleep(1000);
            return null;
        });
    }
}
```

이 실험은 많은 I/O 대기 작업을 가볍게 표현할 수 있다는 점을 보여준다.

CPU 집약 작업 10,000개를 빠르게 만든다는 뜻은 아니다.

---

## 51. 세 모델의 핵심 대응표

| 질문           | CompletableFuture      | Reactor              | Virtual Thread               |
| ------------ | ----------------------- | --------------------- | ----------------------------- |
| 무엇을 표현하는가    | 미래의 단일 결과              | 데이터와 신호의 흐름          | 독립적인 실행 Thread               |
| 코드 스타일       | continuation chain     | operator pipeline    | 순차적인 명령형 코드                  |
| 실제 실행 주체     | Executor               | Scheduler·Event Loop | JVM Scheduler·Carrier Thread |
| 단일 결과        | 적합                     | `Mono`               | 일반 반환값                       |
| 다중 스트림       | 부적합                    | `Flux`               | 반복·Stream API 별도 사용          |
| Backpressure | 기본 모델 아님               | 핵심 기능                | 기본 모델 아님                     |
| 블로킹 API      | Executor Thread 점유     | Event Loop에서 피해야 함   | 자연스럽게 사용 가능                  |
| 예외 처리        | exceptional completion | `onError` signal     | 일반 `try/catch`               |
| 취소           | Future 취소, 실제 작업은 별도   | cancel signal 전파     | Thread interruption          |
| 지역변수 유지      | 람다와 단계 결과              | Publisher 데이터 흐름     | 일반 지역변수                      |
| 호출 스택        | 단계별로 분리                | operator chain       | 논리적 Thread 스택 유지             |
| Spring 연결    | `@Async`, 비동기 Service  | WebFlux, WebClient   | Spring MVC, TaskExecutor     |

---

## 52. C++, Python, JavaScript와 연결하기

지금까지의 시리즈를 전체적으로 연결하면 다음과 같다.

### C++20

```text
Coroutine Frame
Awaiter
coroutine_handle
Executor 또는 I/O Runtime
```

개발자가 저수준 중단과 재개 규약을 구성한다.

### Python

```text
Coroutine
Task
Future
asyncio Event Loop
```

이벤트 루프가 코루틴 실행과 Future 완료를 연결한다.

### JavaScript

```text
async function
Promise
Microtask Queue
Event Loop
```

Promise 완료 후 continuation을 Microtask로 재개한다.

### Java CompletableFuture

```text
CompletionStage
Function continuation
Executor
```

함수의 중단 위치 대신 후속 함수를 연결한다.

### Java Reactor

```text
Publisher
Operator
Subscriber
Scheduler
```

비동기 데이터 흐름을 신호 파이프라인으로 표현한다.

### Java Virtual Thread

```text
Virtual Thread
Logical Call Stack
JVM Scheduler
Carrier Thread
```

스레드 기반 코드를 유지한 채 JVM이 대기 상태를 효율적으로 관리한다.

---

## 53. 가장 중요한 정신 모델

Java의 세 모델을 한 문장씩 정리하면 다음과 같다.

### CompletableFuture

```text
이 결과가 완료되면
다음 함수를 실행해라.
```

### Reactor

```text
이 Publisher에서 데이터와 신호가 오면
이 operator 파이프라인을 따라 흘려라.
```

### Virtual Thread

```text
이 작업을 독립적인 가벼운 Thread에서
일반적인 순차 코드로 실행해라.
```

따라서 세 모델의 핵심 차이는 "비동기인가 아닌가"가 아니다.

> 대기와 continuation을 어떤 추상화로 표현하는가의 차이다.

```text
CompletableFuture
객체와 callback chain

Reactor
Publisher와 signal pipeline

Virtual Thread
Thread와 call stack
```

---

## 마무리

Java에는 JavaScript나 Python처럼 대표적인 `async/await` 문법이 없다.

대신 Java는 서로 다른 방향으로 발전한 여러 동시성 모델을 제공한다.

```text
CompletableFuture
비동기 결과가 완료된 뒤 실행할 continuation을 연결한다.

Reactor
데이터, 완료, 오류를 Reactive Stream의 신호로 전달한다.

Virtual Thread
블로킹되는 논리적 Thread를 가볍게 만들어 순차 코드를 유지한다.
```

이 중 무엇이 "Java의 async/await"인지 하나만 고르는 것은 정확하지 않다.

비교 기준에 따라 답이 달라진다.

```text
Promise와 비슷한 결과 객체를 찾는다면
→ CompletableFuture

이벤트 루프와 논블로킹 스트림을 찾는다면
→ Reactor와 WebFlux

await 없이 순차 코드 형태를 유지하고 싶다면
→ Virtual Thread
```

Spring 실무에서는 다음처럼 접근할 수 있다.

```text
일반적인 MVC 요청-응답과 블로킹 SDK
→ Spring MVC + Virtual Thread 검토

처음부터 끝까지 논블로킹이고
스트리밍과 backpressure가 중요
→ Spring WebFlux + Reactor 검토

일부 독립 작업만 비동기로 조합
→ CompletableFuture와 명시적 Executor 검토
```

가장 주의해야 할 오해는 이것이다.

```text
CompletableFuture로 감싸면
블로킹 코드가 논블로킹이 된다.

Mono로 감싸면
블로킹 코드가 Reactive가 된다.

Virtual Thread를 켜면
외부 시스템의 처리 용량도 무한해진다.
```

셋 모두 사실이 아니다.

비동기 타입과 실행 모델은 작업을 표현하고 스케줄링하는 방법을 바꾼다.

실제 I/O 방식, CPU 사용량, 외부 자원 제한까지 자동으로 바꾸지는 않는다.

이 시리즈 전체의 결론을 다시 정리하면 다음과 같다.

```text
async/await와 비동기 처리는
스레드를 마법처럼 없애는 기능이 아니다.

대기 중인 작업의 실행 상태와 continuation을
어디에 저장하고,
누가 언제 다시 실행할지를 정하는 실행 모델이다.
```

각 언어는 이 문제에 서로 다른 답을 내놓았다.

```text
C++20
코루틴 메커니즘을 직접 조립한다.

Python
Task와 Event Loop가 코루틴을 관리한다.

JavaScript
Promise와 Microtask가 continuation을 관리한다.

Java
CompletionStage, Reactive Stream,
Virtual Thread라는 서로 다른 모델을 제공한다.
```

문법 이름보다 중요한 것은 그 아래의 구조다.

```text
현재 실행 상태는 어디에 저장되는가
대기 결과는 어떤 객체로 표현되는가
실제 작업은 어느 Thread에서 실행되는가
완료를 누가 감지하는가
continuation을 누가 재개하는가
취소와 예외는 어떻게 전달되는가
```

이 질문에 답할 수 있다면 새로운 언어나 프레임워크에서 `async`, `await`, `Future`, `Promise`, `Task`, `Mono`, `Flux`를 만나더라도 이름에 휘둘리지 않고 실행 구조를 이해할 수 있다.
