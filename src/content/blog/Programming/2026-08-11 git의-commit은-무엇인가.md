---
title: "Git의 Commit은 무엇인가"
description: "Git의 commit 객체가 실제로 무엇을 저장하는지, tree·blob·parent와 어떻게 연결되는지 내부 구조를 살펴봅니다."
pubDate: "2026-08-11T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "Version Control", "Developer Tools"]
slug: "git-internals-commit-object"
---

Git을 사용하다 보면 `commit`이라는 단어를 정말 자주 접한다.

```bash
git add .
git commit -m "Add user login"
git push
```

처음 Git을 배울 때는 보통 commit을 다음과 같이 이해한다.

> 현재 변경사항을 저장하는 것

틀린 설명은 아니지만, Git의 내부 구조를 이해하기에는 조금 부족하다.

Git에서 commit은 **파일 자체를 저장하는 객체가 아니다.**

조금 더 정확하게 말하면 commit은 다음 정보를 가진 Git 객체다.

> **특정 시점의 프로젝트 상태(snapshot)를 가리키고, 그 상태에 대한 메타데이터와 이전 commit 정보를 가지고 있는 객체**

이 개념을 이해하면 이후에 Git의 `tree`, `blob`, `HEAD`, `branch`가 어떻게 연결되는지도 훨씬 자연스럽게 이해할 수 있다.

---

## Commit은 무엇을 저장할까?

예를 들어 다음과 같은 프로젝트가 있다고 해보자.

```text
project/
├── README.md
└── src/
    └── main.cpp
```

파일을 수정한 뒤 commit을 만든다.

```bash
git add .
git commit -m "Add main function"
```

직관적으로 생각하면 commit 안에 다음 파일들이 통째로 들어 있을 것 같다.

```text
commit
├── README.md
└── src/main.cpp
```

하지만 실제 Git 내부 구조는 그렇지 않다.

대략 다음과 같은 관계가 만들어진다.

```text
commit
   │
   ▼
tree
├── README.md ──→ blob
└── src ────────→ tree
                    │
                    └── main.cpp ──→ blob
```

commit은 파일들을 직접 저장하는 것이 아니라 **프로젝트의 최상위 디렉터리를 나타내는 tree 객체를 가리킨다.**

그리고 tree가 다시 파일 내용을 가지고 있는 `blob`이나 다른 하위 `tree`를 가리킨다.

따라서 Git의 핵심 구조를 아주 단순하게 표현하면 다음과 같다.

```text
commit
   ↓
tree
   ↓
tree / blob
```

`tree`와 `blob`은 이후 글에서 각각 자세히 살펴볼 예정이다.

---

## Commit 객체 안에는 무엇이 들어 있을까?

commit 객체에는 크게 다음 정보가 들어 있다.

```text
commit
├── tree
├── parent
├── author
├── committer
└── commit message
```

각각의 의미를 살펴보자.

### tree

현재 commit이 나타내는 **프로젝트 전체 스냅샷의 시작점**이다.

```text
commit
  ↓
root tree
```

Git은 이 root tree에서 시작해서 프로젝트 전체 파일 구조를 찾는다.

---

### parent

현재 commit 이전의 commit을 가리킨다.

예를 들어 commit을 세 번 했다면:

```text
A ← B ← C
```

현재 commit이 `C`라면:

```text
C.parent = B
B.parent = A
```

와 같은 관계가 만들어진다.

이 연결 덕분에 Git은 프로젝트의 역사를 따라갈 수 있다.

```bash
git log
```

를 실행했을 때 과거 commit들이 순서대로 나오는 것도 이러한 parent 관계가 있기 때문이다.

첫 번째 commit에는 이전 commit이 없기 때문에 parent도 없다.

---

### author

코드를 작성한 사람에 대한 정보다.

예를 들어:

```text
author Hong Gil Dong <example@example.com>
```

와 같은 형태다.

---

### committer

실제로 해당 commit을 생성한 사람이다.

대부분의 일반적인 commit에서는 `author`와 `committer`가 동일하다.

하지만 다른 사람이 작성한 commit을 가져오거나 patch를 적용하는 등의 상황에서는 서로 달라질 수도 있다.

---

### commit message

우리가 다음 명령에서 작성하는 메시지다.

```bash
git commit -m "Add main function"
```

여기서:

```text
Add main function
```

이 commit 객체의 메시지로 저장된다.

---

## 실제 Commit 객체 확인하기

Git은 내부 구조를 직접 확인할 수 있는 명령어도 제공한다.

먼저 현재 commit의 ID를 확인해보자.

```bash
git rev-parse HEAD
```

예를 들어 다음과 같은 값이 출력될 수 있다.

```text
f21c83a6...
```

이 값은 현재 commit을 식별하는 Object ID다.

그리고 다음 명령을 실행하면 commit 객체의 내용을 직접 확인할 수 있다.

```bash
git cat-file -p HEAD
```

대략 다음과 같은 결과가 나온다.

```text
tree 45b983be...
parent 91ea14f3...
author Hong Gil Dong <example@example.com> 1786380000 +0900
committer Hong Gil Dong <example@example.com> 1786380000 +0900

Add main function
```

여기에서 가장 눈여겨볼 부분은 이것이다.

```text
tree 45b983be...
```

commit 객체 내부에 파일 목록이 들어 있는 것이 아니다.

대신:

> 이 commit의 프로젝트 상태를 알고 싶으면 `45b983be...`라는 tree 객체를 확인해라.

라는 식으로 다른 Git 객체를 가리키고 있다.

따라서 구조는 다음과 같다.

```text
HEAD
 │
 ▼
commit
 │
 │ tree 45b983...
 ▼
tree object
 │
 ├── README.md → blob
 │
 └── src → tree
```

---

## Commit은 변경사항(diff)을 저장하는 것인가?

Git을 처음 사용할 때 많이 생기는 오해가 있다.

> Git은 이전 commit과 달라진 부분만 저장하는 것 아닌가?

Git을 사용하는 입장에서는 그렇게 느껴질 수 있다.

예를 들어:

```diff
- int value = 10;
+ int value = 20;
```

GitHub에서도 이런 diff를 굉장히 자주 보여준다.

하지만 Git의 기본 저장 모델은 **diff가 아니라 snapshot**이다.

예를 들어:

```text
Commit A
project 상태 A

Commit B
project 상태 B

Commit C
project 상태 C
```

Git은 각 commit에서 해당 시점의 프로젝트 상태를 표현한다.

개념적으로는:

```text
A
↓
Snapshot A

B
↓
Snapshot B

C
↓
Snapshot C
```

와 같다.

그렇다고 동일한 파일을 commit마다 무조건 새로 복사해서 저장하는 것은 아니다.

파일 내용이 동일하다면 기존 blob 객체를 다시 사용할 수 있다.

예를 들어:

```text
Commit A
   ↓
Tree A
   ├── README.md → Blob X
   └── main.cpp  → Blob Y

Commit B
   ↓
Tree B
   ├── README.md → Blob X
   └── main.cpp  → Blob Z
```

`README.md`가 수정되지 않았다면 두 commit에서 동일한 `Blob X`를 가리킬 수 있다.

반면 `main.cpp`가 수정되었다면 새로운 `Blob Z`가 만들어진다.

그래서 Git은 **snapshot 방식으로 사고하면서도 동일한 데이터를 재사용할 수 있다.**

---

## Commit ID는 무엇인가?

우리가 흔히 보는 다음 문자열도 commit 객체와 관련되어 있다.

```text
f21c83a6e88c...
```

일반적으로 이를 commit hash라고 부른다.

Git 객체는 자신의 내용을 기반으로 만들어진 Object ID를 통해 식별된다.

그래서 Git 명령에서도 다음처럼 commit을 지정할 수 있다.

```bash
git show f21c83a
```

또는:

```bash
git checkout f21c83a
```

처럼 사용할 수 있다.

즉 commit ID는 단순히 "commit 번호"를 하나 증가시키는 방식이 아니다.

```text
Commit #1
Commit #2
Commit #3
```

처럼 관리하지 않고 Git 객체 자체를 식별하는 ID를 사용한다.

---

## Commit과 Branch는 다른 개념이다

여기서 또 하나 중요하게 구분해야 할 것이 있다.

commit과 branch는 같은 것이 아니다.

예를 들어:

```text
A ← B ← C
        ↑
       main
```

라고 해보자.

`A`, `B`, `C`는 commit이고 `main`은 현재 `C` commit을 가리키는 이름이다.

새로운 commit `D`를 만들면:

```text
A ← B ← C ← D
            ↑
           main
```

처럼 branch가 새로운 commit을 가리키게 된다.

즉:

> **commit은 프로젝트의 특정 상태를 나타내는 객체**

이고,

> **branch는 특정 commit을 가리키는 움직일 수 있는 포인터**

라고 생각할 수 있다.

이 차이를 이해하면 branch 생성과 checkout 동작도 훨씬 이해하기 쉽다.

---

## Commit과 HEAD

Git에서 `HEAD`라는 이름도 자주 등장한다.

```bash
git show HEAD
git reset HEAD
git rev-parse HEAD
```

보통 HEAD는 현재 작업하고 있는 branch를 가리킨다.

예를 들어:

```text
HEAD
 ↓
main
 ↓
Commit C
```

라는 구조가 있을 수 있다.

새로운 commit을 만들면:

```text
HEAD
 ↓
main
 ↓
Commit D
```

로 `main`이 이동하고 HEAD는 계속 `main`을 가리킨다.

그래서 우리가 흔히 말하는:

> 현재 commit

은 보통 `HEAD`가 최종적으로 가리키고 있는 commit을 의미한다.

---

## 직접 확인해보기

다음 명령들을 직접 실행해보면 Git의 commit 구조를 확인할 수 있다.

현재 commit의 Object ID 확인:

```bash
git rev-parse HEAD
```

commit 객체 내용 확인:

```bash
git cat-file -p HEAD
```

commit이 가리키는 tree 확인:

```bash
git rev-parse HEAD^{tree}
```

현재 commit 정보 확인:

```bash
git show --no-patch HEAD
```

commit history 확인:

```bash
git log --oneline
```

특히 다음 두 명령을 연속해서 실행해보는 것을 추천한다.

```bash
git cat-file -p HEAD
```

그리고 출력된 `tree` ID를 이용해:

```bash
git cat-file -p <tree-id>
```

를 실행한다.

그러면:

```text
commit
   ↓
tree
```

라는 관계를 실제 Git 내부 데이터에서 직접 확인할 수 있다.

---

## 정리

처음에는 commit을 단순히:

> 변경사항 저장

이라고 이해해도 Git을 사용하는 데 큰 문제는 없다.

하지만 Git 내부 구조까지 이해하려면 조금 다르게 생각해야 한다.

**Commit은 파일 그 자체가 아니다.**

commit은:

* 프로젝트의 특정 시점 스냅샷을 나타내는 `tree`를 가리키고
* 이전 commit인 `parent`를 가리키며
* author와 committer 정보를 가지고
* commit message를 가지고 있는

**Git 객체**다.

전체 구조를 다시 보면 다음과 같다.

```text
                    Commit
                   /      \
                  ↓        ↓
               Parent    Tree
                          /   \
                         ↓     ↓
                      Tree    Blob
```

그리고 여러 commit은 parent를 통해 서로 연결된다.

```text
Commit A
   ↑
Commit B
   ↑
Commit C
   ↑
Commit D
```

branch는 그중 하나의 commit을 가리킨다.

```text
A ← B ← C ← D
            ↑
           main
            ↑
           HEAD
```

이제 여기서 자연스럽게 다음 질문이 생긴다.

> commit이 파일을 직접 가지고 있지 않고 `tree`를 가리킨다면, **tree 객체는 실제로 무엇을 저장하고 있을까?**

다음에는 Git의 **Tree Object**를 살펴본다.
