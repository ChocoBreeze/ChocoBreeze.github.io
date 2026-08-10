---
title: "Git의 HEAD / Index / Working Tree는 무엇인가"
description: "git add·commit·diff·restore가 실제로 조작하는 HEAD, Index, Working Tree 세 영역의 관계를 예제로 정리합니다."
pubDate: "2026-08-14T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "Version Control", "Developer Tools"]
slug: "git-internals-head-index-working-tree"
---

앞에서는 Git의 핵심 객체인 `Commit`, `Tree`, `Blob`을 살펴봤다.

Git이 특정 시점의 프로젝트 상태를 저장하는 구조는 대략 다음과 같다.

```text
Commit
   ↓
Tree
   ↓
Blob
```

하지만 우리가 실제로 Git을 사용할 때는 단순히 저장된 Commit만 다루지 않는다.

보통 다음과 같은 과정을 반복한다.

```bash
파일 수정

git add .

git commit -m "Update feature"
```

여기서 궁금한 점이 생긴다.

`git add`는 왜 필요한 것일까?

파일을 수정했는데 바로 commit하면 안 되는 걸까?

그리고 Git에서 자주 등장하는 `HEAD`, `Index`, `Working Tree`는 각각 무엇일까?

이 세 개념을 함께 이해하면 `git status`, `git add`, `git restore`, `git reset`, `git commit`이 실제로 무엇을 하는지 훨씬 명확해진다.

Git의 작업 상태는 크게 다음 세 영역으로 생각할 수 있다.

```text
HEAD
  ↓

Index
  ↓

Working Tree
```

조금 더 정확하게 표현하면:

```text
HEAD Commit          Index             Working Tree
────────────         ─────             ────────────
마지막 저장 상태      다음 Commit 후보     현재 디스크의 파일
```

이 세 영역의 차이를 이해하는 것이 이번 글의 핵심이다.

---

## 1. Working Tree란?

먼저 가장 익숙한 Working Tree부터 살펴보자.

Working Tree는:

> **현재 디스크에 실제로 펼쳐져 있고, 개발자가 직접 수정하는 파일들의 상태**

를 의미한다.

예를 들어 저장소가 다음과 같다고 하자.

```text
project/
├── README.md
└── src/
    └── main.cpp
```

VS Code나 Eclipse에서 열어서 수정하는:

```text
README.md
src/main.cpp
```

이 파일들이 바로 Working Tree에 존재하는 파일들이다.

예를 들어 `main.cpp`가 다음과 같다고 해보자.

```cpp
int main() {
    return 0;
}
```

여기서:

```cpp
int main() {
    return 1;
}
```

로 수정하면 가장 먼저 바뀌는 것은 **Working Tree**다.

아직 Git의 Commit은 바뀌지 않았다.

```text
HEAD Commit

int main() {
    return 0;
}
```

```text
Working Tree

int main() {
    return 1;
}
```

이 두 상태가 달라진 것이다.

그래서:

```bash
git status
```

를 실행하면:

```text
Changes not staged for commit
```

와 같은 메시지가 나타난다.

즉 Git이:

> 현재 디스크의 파일은 마지막으로 저장된 상태와 다르다.

라고 알려주는 것이다.

---

## 2. HEAD란?

HEAD는 Git에서 매우 자주 등장한다.

```bash
git show HEAD

git diff HEAD

git reset HEAD

git rev-parse HEAD
```

HEAD는 보통:

> **현재 체크아웃되어 있는 브랜치를 가리키는 특별한 참조**

라고 설명할 수 있다.

예를 들어 현재 `main` 브랜치에서 작업하고 있고:

```text
A ← B ← C
        ↑
       main
```

이라면 HEAD는 보통:

```text
HEAD
 ↓
main
 ↓
Commit C
```

처럼 연결되어 있다.

따라서 일상적으로는:

> HEAD가 가리키는 Commit = 현재 작업의 기준이 되는 마지막 Commit

이라고 생각해도 좋다.

---

## HEAD는 파일들의 현재 상태가 아니다

HEAD와 Working Tree는 서로 다른 개념이다.

예를 들어 마지막 Commit이:

```cpp
int value = 10;
```

을 가지고 있다고 하자.

그 상태에서 파일을 수정한다.

```cpp
int value = 20;
```

그러면:

```text
HEAD

int value = 10;
```

```text
Working Tree

int value = 20;
```

가 된다.

HEAD는 여전히 기존 Commit을 가리키고 있기 때문에 바뀌지 않는다.

파일을 수정했다고 Commit이 자동으로 변경되는 것이 아니다.

---

## 3. Index란?

이제 가장 헷갈리기 쉬운 **Index**를 살펴보자.

Index는 흔히:

* Staging Area
* Stage
* Staged 상태

등으로 표현된다.

Index는 한마디로:

> **다음 Commit에 들어갈 프로젝트 상태를 준비해두는 영역**

이다.

즉 다음 Commit의 **초안**과 비슷하다.

구조를 다시 보면:

```text
HEAD
→ 현재 저장된 상태

Index
→ 다음 Commit으로 만들 상태

Working Tree
→ 현재 개발자가 수정하고 있는 상태
```

---

## 왜 Index가 필요한가?

예를 들어 두 파일을 수정했다고 해보자.

```text
main.cpp
README.md
```

하지만 이번 Commit에는 `main.cpp` 변경만 넣고 싶다.

Working Tree에는 두 파일 모두 수정되어 있다.

```text
Working Tree

main.cpp     ← 수정됨
README.md    ← 수정됨
```

이때:

```bash
git add main.cpp
```

를 실행한다.

그러면 Index는:

```text
Index

main.cpp     ← 수정된 내용
README.md    ← 기존 내용
```

이 된다.

Working Tree는 여전히:

```text
Working Tree

main.cpp     ← 수정된 내용
README.md    ← 수정된 내용
```

이다.

이제:

```bash
git commit
```

을 실행하면 **Index에 준비되어 있던 상태만 Commit이 된다.**

따라서 `README.md` 변경은 Commit에 포함되지 않는다.

이것이 Staging Area가 존재하는 가장 중요한 이유다.

> Working Tree의 모든 변경을 무조건 Commit하지 않고, 이번 Commit에 포함할 변경만 선택할 수 있다.

---

## git add는 파일을 "표시"만 하는 것일까?

`git add`를 처음 배울 때 흔히 이렇게 이해한다.

> 이 파일을 다음 Commit에 넣겠다고 표시한다.

사용 관점에서는 괜찮은 설명이다.

하지만 내부 동작은 조금 더 구체적이다.

`git add`는 단순히:

```text
main.cpp = staged
```

라는 체크 표시만 저장하는 것이 아니다.

**현재 Working Tree의 파일 내용을 Index에 기록한다.**

즉:

```text
Working Tree
     │
     │ git add
     ▼
   Index
```

라고 이해하는 것이 더 정확하다.

예를 들어:

```cpp
int value = 20;
```

인 파일을:

```bash
git add main.cpp
```

하면 그 시점의 `20`이라는 내용이 Index에 들어간다.

---

## git add 후 다시 수정하면 어떻게 될까?

Index를 이해하려면 이 실험이 매우 중요하다.

먼저:

```cpp
int value = 10;
```

이었다고 하자.

수정한다.

```cpp
int value = 20;
```

그리고:

```bash
git add main.cpp
```

를 실행한다.

이 시점에서는:

```text
HEAD
10

Index
20

Working Tree
20
```

이다.

그런데 파일을 다시 수정한다.

```cpp
int value = 30;
```

그러면:

```text
HEAD
10

Index
20

Working Tree
30
```

가 된다.

즉 **같은 파일이 세 가지 다른 상태를 동시에 가질 수 있다.**

이것이 HEAD / Index / Working Tree를 따로 이해해야 하는 이유다.

`git status`에서는 이런 파일이:

```text
Changes to be committed
Changes not staged for commit
```

두 곳에 동시에 나타날 수도 있다.

이상해 보이지만 정확한 상태다.

현재 상황은:

```text
10 → 20
```

변경은 이미 Stage에 올라갔고,

```text
20 → 30
```

이라는 추가 변경은 아직 Working Tree에만 있기 때문이다.

---

## 세 영역을 그림으로 이해하기

가장 중요한 구조를 다시 정리해보자.

```text
┌────────────────┐
│      HEAD      │
│                │
│ 마지막 Commit │
└───────┬────────┘
        │
        │ 기준
        ▼
┌────────────────┐
│     Index      │
│                │
│ 다음 Commit   │
└───────▲────────┘
        │
        │ git add
        │
┌───────┴────────┐
│ Working Tree   │
│                │
│ 실제 작업 파일 │
└────────────────┘
```

Commit을 실행하면:

```text
Index
  │
  │ git commit
  ▼
새 Commit
```

이 된다.

즉 우리가 흔히 사용하는:

```bash
git add .
git commit
```

은 실제로:

```text
Working Tree
      │
      │ git add
      ▼
    Index
      │
      │ git commit
      ▼
   Commit
```

이라는 흐름이다.

---

## Commit은 Working Tree를 직접 저장하지 않는다

이것은 상당히 중요한 부분이다.

많이들:

```bash
git commit
```

을 하면 현재 디스크에 있는 파일들이 Commit된다고 생각한다.

하지만 개념적으로 Git은 **Index의 상태를 기반으로 Commit을 만든다.**

즉:

```text
Working Tree
    X
    │
    │ 직접 Commit
    ▼

Commit
```

이 아니라:

```text
Working Tree
    │
    │ git add
    ▼
Index
    │
    │ git commit
    ▼
Commit
```

이다.

이것이 `git add`가 존재하는 근본적인 이유다.

---

## Index는 내부적으로 무엇을 가지고 있을까?

앞에서 Git의 Tree Object를 공부했다.

Tree는:

```text
README.md → Blob A
src       → Tree B
```

같이 다음 Commit의 파일 구조를 표현할 수 있었다.

Index도 비슷하게:

> 다음 Commit에 사용할 파일 경로와 Blob 정보를 준비해두는 영역

이라고 이해할 수 있다.

예를 들어:

```text
README.md → Blob A
main.cpp  → Blob B
```

같은 상태를 Index가 가지고 있고 `git commit`을 하면 Git은 이 정보를 기반으로 Tree Object를 만들고 새로운 Commit을 만든다.

개념적으로:

```text
Index
   │
   │ git commit
   ▼
Tree Object 생성
   │
   ▼
Commit Object 생성
```

이라고 볼 수 있다.

그래서 Index는 단순한 "체크리스트"보다 훨씬 중요한 Git 내부 구조다.

---

## git diff는 무엇과 무엇을 비교할까?

HEAD / Index / Working Tree를 이해하면 `git diff` 명령도 명확해진다.

세 상태가:

```text
HEAD
Index
Working Tree
```

있으므로 비교할 수 있는 관계도 여러 개다.

### git diff

```bash
git diff
```

기본적으로:

```text
Index
   ↕ compare
Working Tree
```

를 비교한다.

즉:

> 아직 Stage하지 않은 변경

을 보여준다.

---

### git diff --staged

```bash
git diff --staged
```

또는:

```bash
git diff --cached
```

는:

```text
HEAD
  ↕ compare
Index
```

를 비교한다.

즉:

> 다음 Commit에 들어갈 변경

을 보여준다.

이 둘의 차이는 매우 중요하다.

```text
git diff
→ Working Tree vs Index

git diff --staged
→ Index vs HEAD
```

---

## git status는 세 영역을 비교한다

`git status`도 사실 이 세 영역을 비교해서 보여주는 명령이다.

예를 들어:

```text
HEAD
README.md = A

Index
README.md = B

Working Tree
README.md = C
```

라면 Git은:

```text
HEAD → Index
```

차이를 보고:

> Changes to be committed

라고 판단한다.

그리고:

```text
Index → Working Tree
```

차이를 보고:

> Changes not staged for commit

이라고 판단한다.

즉 `git status` 메시지는 단순한 상태 문자열이 아니라 **세 영역을 비교한 결과**다.

---

## git restore는 무엇을 하는가?

이제 `git restore`도 이해할 수 있다.

예를 들어 Working Tree에서 파일을 잘못 수정했다고 하자.

```text
Index

main.cpp = A
```

```text
Working Tree

main.cpp = B
```

다음 명령을 실행한다.

```bash
git restore main.cpp
```

그러면 기본적으로 **Index의 파일 내용을 Working Tree로 가져온다.**

```text
Index
   │
   │ git restore
   ▼
Working Tree
```

따라서 Working Tree의 `B`가 사라지고 `A`로 돌아간다.

---

## Stage에 올린 것을 취소하려면?

파일을:

```bash
git add main.cpp
```

했지만 Stage에서 빼고 싶다고 해보자.

현대 Git에서는:

```bash
git restore --staged main.cpp
```

를 사용할 수 있다.

개념적으로는 Index를 HEAD 상태로 되돌리는 것이다.

```text
HEAD
   │
   │ restore --staged
   ▼
Index
```

Working Tree의 수정 내용은 그대로 남는다.

즉:

```text
Before

HEAD         A
Index        B
Working Tree B
```

에서:

```text
git restore --staged main.cpp
```

하면:

```text
After

HEAD         A
Index        A
Working Tree B
```

가 된다.

수정한 코드는 사라지지 않는다.

단지 **다음 Commit 후보에서 빠진 것**이다.

---

## git reset과도 연결된다

예전에는 Stage 취소를 위해 흔히 다음 명령을 사용했다.

```bash
git reset HEAD main.cpp
```

이 명령 역시 개념적으로는:

```text
HEAD
  ↓
Index
```

를 되돌리는 역할을 한다.

`git reset`은 옵션에 따라 Index와 Working Tree까지 영향을 줄 수 있기 때문에 더 강력하고 복잡하다.

예를 들어:

```text
--soft
--mixed
--hard
```

의 차이도 결국:

> HEAD, Index, Working Tree 중 어디까지 움직일 것인가?

라는 문제다.

그래서 HEAD / Index / Working Tree를 먼저 이해하면 이후 `git reset`도 훨씬 쉽게 이해할 수 있다.

---

## Branch를 바꾸면 왜 파일이 바뀔까?

이 개념은 `git switch`나 `git checkout`과도 연결된다.

현재:

```text
HEAD
 ↓
main
 ↓
Commit A
```

라고 하자.

그리고:

```bash
git switch feature
```

를 실행한다.

그러면 HEAD가:

```text
HEAD
 ↓
feature
 ↓
Commit B
```

를 가리키게 된다.

Git은 Commit B의 Tree/Blob을 기준으로 Index와 Working Tree를 갱신한다.

대략:

```text
Commit B
   ↓
Tree / Blob
   ↓
Index
   ↓
Working Tree
```

가 되는 것이다.

그래서 브랜치를 바꾸면 실제 디스크에 있는 파일 내용도 바뀐다.

이것은 이후 `git worktree`를 이해할 때 매우 중요하다.

기본적으로 하나의 Working Tree에서는 한 번에 하나의 브랜치 상태만 펼쳐놓을 수 있기 때문이다.

---

## HEAD가 항상 Branch를 가리키는 것은 아니다

일반적으로는:

```text
HEAD
 ↓
main
 ↓
Commit
```

형태지만 항상 그런 것은 아니다.

특정 Commit을 직접 checkout하면:

```bash
git switch --detach <commit-id>
```

HEAD가 Branch가 아니라 Commit을 직접 가리킬 수 있다.

```text
HEAD
 ↓
Commit C
```

이를 **Detached HEAD** 상태라고 한다.

이 상태에서도 파일 수정과 Commit은 가능하지만, 새 Commit을 보존하려면 새로운 Branch를 만들어 연결하는 것이 일반적이다.

---

## 실제 예제로 전체 흐름 보기

초기 상태를 다음과 같이 가정하자.

```text
HEAD
 ↓
Commit A

main.cpp = 10
```

Index와 Working Tree도 동일하다.

```text
HEAD          10
Index         10
Working Tree  10
```

파일을 수정한다.

```text
Working Tree = 20
```

상태:

```text
HEAD          10
Index         10
Working Tree  20
```

이때:

```bash
git diff
```

를 하면:

```text
10 → 20
```

차이가 보인다.

---

다음으로:

```bash
git add main.cpp
```

를 실행한다.

```text
HEAD          10
Index         20
Working Tree  20
```

이제:

```bash
git diff
```

에는 아무것도 나오지 않는다.

Index와 Working Tree가 같기 때문이다.

대신:

```bash
git diff --staged
```

를 실행하면:

```text
10 → 20
```

이 나온다.

HEAD와 Index가 다르기 때문이다.

---

이 상태에서 다시 파일을 수정한다.

```text
Working Tree = 30
```

그러면:

```text
HEAD          10
Index         20
Working Tree  30
```

이 된다.

따라서:

```bash
git diff
```

는:

```text
20 → 30
```

을 보여주고,

```bash
git diff --staged
```

는:

```text
10 → 20
```

을 보여준다.

이 예제를 이해하면 HEAD / Index / Working Tree의 관계를 거의 이해한 것이다.

---

## Commit을 하면 어떻게 될까?

현재 상태가:

```text
HEAD          10
Index         20
Working Tree  30
```

일 때:

```bash
git commit -m "Change value"
```

을 실행하면 Commit되는 것은 **20**이다.

새 Commit B:

```text
Commit B

main.cpp = 20
```

그리고 HEAD가 새 Commit으로 이동한다.

```text
HEAD
 ↓
main
 ↓
Commit B
```

따라서:

```text
HEAD          20
Index         20
Working Tree  30
```

이 된다.

`30`이라는 추가 수정은 여전히 Working Tree에 남는다.

이 예시는:

> `git commit`은 현재 Working Tree를 그대로 저장하는 것이 아니라 Index의 상태를 Commit한다.

는 점을 아주 잘 보여준다.

---

## Commit / Tree / Blob과 다시 연결하기

이제 앞에서 배운 객체 구조와 연결해보자.

`git add`를 수행하면 Working Tree의 파일 내용이 Blob 형태로 Git에 저장되고, Index는 해당 파일 경로와 Blob 정보를 준비한다.

```text
Working Tree

main.cpp
   │
   │ git add
   ▼
Blob Object
   │
   ▼
Index
main.cpp → Blob X
```

그리고:

```bash
git commit
```

을 실행하면 Index를 바탕으로 Tree 객체가 만들어지고 Commit 객체가 만들어진다.

```text
Index
 │
 │
 ▼
Tree
 │
 ▼
Commit
```

전체 과정을 연결하면:

```text
Working Tree
      │
      │ git add
      ▼
    Index
      │
      │ git commit
      ▼
     Tree
      │
      ▼
    Commit
```

그리고 Tree가 Blob들을 가리킨다.

```text
Commit
   ↓
Tree
   ↓
Blob
```

앞에서 공부한 Git 객체 구조와 우리가 사용하는 Git 명령이 이제 하나로 연결된다.

---

## 직접 해볼 실험

작은 저장소에서 파일 하나를 만든다.

```text
value.txt
```

내용:

```text
10
```

Commit한다.

```bash
git add value.txt
git commit -m "Initial value"
```

그다음 값을:

```text
20
```

으로 바꾼다.

현재 차이를 확인한다.

```bash
git diff
```

그리고:

```bash
git add value.txt
```

를 실행한 뒤 다시:

```bash
git diff
```

를 실행한다.

이번에는 아무것도 나오지 않는다.

대신:

```bash
git diff --staged
```

를 실행한다.

그러면 변경 내용이 보인다.

이 상태에서 파일을 다시:

```text
30
```

으로 수정한다.

이제:

```bash
git diff
```

와:

```bash
git diff --staged
```

를 각각 실행한다.

두 명령이 서로 다른 diff를 보여주는 것을 확인할 수 있다.

현재 내부 상태가:

```text
HEAD          10
Index         20
Working Tree  30
```

이기 때문이다.

이 실험 하나만 직접 해봐도 Index의 존재 이유를 상당히 명확하게 이해할 수 있다.

---

## 정리

Git에서 우리가 작업하는 상태는 크게 세 영역으로 나누어 생각할 수 있다.

```text
HEAD
→ 현재 기준이 되는 마지막 Commit

Index
→ 다음 Commit으로 만들 상태

Working Tree
→ 현재 디스크에서 직접 수정하고 있는 상태
```

그리고 주요 명령은 이 세 영역 사이에서 데이터를 이동시키거나 비교한다.

```text
Working Tree
      │
      │ git add
      ▼
    Index
      │
      │ git commit
      ▼
    Commit
      ↑
     HEAD
```

`git diff`는:

```text
Index ↔ Working Tree
```

를 비교하고,

`git diff --staged`는:

```text
HEAD ↔ Index
```

를 비교한다.

`git restore`는 기본적으로:

```text
Index → Working Tree
```

로 파일을 복원하고,

`git restore --staged`는:

```text
HEAD → Index
```

방향으로 Stage 상태를 되돌린다.

그리고 가장 중요한 것은:

> **git commit은 Working Tree가 아니라 Index의 상태를 기반으로 새로운 Commit을 만든다.**

는 점이다.

지금까지의 내용을 모두 연결하면 Git의 전체 흐름이 다음과 같이 보이기 시작한다.

```text
Working Tree
      │
      │ git add
      ▼
    Index
      │
      │ git commit
      ▼
   Commit
      │
      ▼
     Tree
      │
      ▼
     Blob
```

그리고 HEAD는 현재 기준이 되는 Commit을 가리킨다.

```text
HEAD
 ↓
Branch
 ↓
Commit
 ↓
Tree
 ↓
Blob
```

이 구조를 이해하면 이제 다음 단계인 `git worktree`도 자연스럽게 이해할 수 있다.

기본 Git 저장소에서는 하나의 Working Tree가 하나의 체크아웃 상태를 가지고 있다.

그렇다면:

> **같은 Git 저장소의 여러 브랜치를 서로 다른 Working Tree에 동시에 펼쳐놓을 수는 없을까?**

그 문제를 해결하는 기능이 바로 **`git worktree`**다.
