---
title: "Git의 Tree Object는 무엇인가"
description: "Git의 tree 객체가 디렉터리 구조와 파일 이름을 어떻게 표현하는지, blob·commit과 어떻게 연결되는지 살펴봅니다."
pubDate: "2026-08-12T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "Version Control", "Developer Tools"]
slug: "git-internals-tree-object"
---

이전 글에서는 Git의 `commit`이 파일을 직접 저장하는 것이 아니라 **tree 객체를 가리킨다**는 것을 살펴봤다.

구조를 다시 보면 다음과 같다.

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

그렇다면 자연스럽게 다음 질문이 생긴다.

> Git에서 `tree`는 정확히 무엇을 저장하고 있을까?

Git의 tree object는 한마디로 말하면:

> **특정 디렉터리의 구조를 표현하는 Git 객체**

이다.

파일 시스템에서 디렉터리가 파일과 하위 디렉터리를 가지고 있는 것처럼, Git의 tree 객체도 **blob과 다른 tree 객체를 가리킨다.**

---

## Tree는 왜 필요한가?

프로젝트가 다음과 같이 생겼다고 해보자.

```text
project/
├── README.md
├── LICENSE
└── src/
    ├── main.cpp
    └── calculator.cpp
```

Git이 파일 내용만 저장한다면 다음 blob 객체들은 만들 수 있다.

```text
README.md       → Blob A
LICENSE         → Blob B
main.cpp        → Blob C
calculator.cpp  → Blob D
```

하지만 이것만으로는 한 가지 중요한 정보가 없다.

바로:

> **각 파일이 어느 디렉터리에 있고 파일 이름이 무엇인지**

이다.

Blob은 기본적으로 파일의 **내용**을 저장한다.

예를 들어 Blob C가 다음 내용을 가지고 있다고 해보자.

```cpp
int main() {
    return 0;
}
```

Blob 자체는 이것이:

```text
main.cpp
```

라는 이름의 파일인지,

```text
hello.cpp
```

라는 이름의 파일인지 알지 못한다.

또한 이것이:

```text
src/main.cpp
```

에 있는지,

```text
app/main.cpp
```

에 있는지도 알지 못한다.

이 정보를 담당하는 것이 바로 **tree object**다.

---

## Tree는 디렉터리를 표현한다

앞의 프로젝트를 다시 보자.

```text
project/
├── README.md
├── LICENSE
└── src/
    ├── main.cpp
    └── calculator.cpp
```

Git 내부에서는 대략 다음 구조가 만들어진다.

```text
Root Tree
├── README.md ───────→ Blob A
├── LICENSE ─────────→ Blob B
└── src ─────────────→ Tree B
                        ├── main.cpp ───────→ Blob C
                        └── calculator.cpp ─→ Blob D
```

여기서 중요한 점은:

> **디렉터리 하나당 하나의 tree 객체가 만들어질 수 있다.**

는 것이다.

최상위 프로젝트 디렉터리는 `Root Tree`로 표현되고,

```text
src/
```

디렉터리는 별도의 `Tree B`로 표현된다.

따라서 Git의 디렉터리 구조는 tree 객체들이 서로 연결된 형태가 된다.

```text
Tree
 ├── Blob
 ├── Blob
 └── Tree
      ├── Blob
      └── Blob
```

이 구조가 실제 파일 시스템의 디렉터리 구조와 상당히 비슷하다.

---

## Tree Object에는 무엇이 들어 있을까?

Tree object의 각 항목에는 대략 다음 정보가 들어 있다.

```text
파일 모드
객체 타입
객체 ID
파일 또는 디렉터리 이름
```

실제로 Git 명령으로 확인해보자.

```bash
git ls-tree HEAD
```

예를 들어 다음과 같은 결과가 나올 수 있다.

```text
100644 blob a12bc34...    README.md
100644 blob c42ad91...    LICENSE
040000 tree 0cb12ae...    src
```

각 부분을 나누어 보면:

```text
100644   blob   a12bc34...   README.md
│        │      │            │
│        │      │            └─ 이름
│        │      └────────────── Object ID
│        └───────────────────── 객체 종류
└────────────────────────────── 파일 모드
```

Tree는 이렇게:

> "`README.md`라는 이름은 이 blob 객체를 가리킨다."

라는 관계를 저장한다.

---

## Tree가 파일 이름을 가지고 있다

여기서 Git 내부 구조를 이해할 때 상당히 중요한 특징이 있다.

**Blob에는 파일 이름이 없다.**

파일 이름은 tree가 가지고 있다.

즉:

```text
Tree
│
├── README.md ──→ Blob A
└── hello.cpp ──→ Blob B
```

에서:

```text
README.md
hello.cpp
```

라는 이름은 tree의 정보다.

Blob A와 Blob B는 자신의 내용만 알고 있다.

이것 때문에 재미있는 상황이 생길 수 있다.

예를 들어 다음 파일이 있다고 하자.

```text
hello.txt
```

내용:

```text
Hello Git
```

Git 내부에서는 다음과 같이 저장될 수 있다.

```text
hello.txt → Blob X
```

그런데 파일 이름만 변경해서:

```text
message.txt
```

로 만들었다고 해보자.

내용이 그대로라면:

```text
message.txt → Blob X
```

처럼 **동일한 Blob을 가리킬 수 있다.**

Blob 내용은 바뀌지 않았기 때문이다.

변한 것은 tree의 항목이다.

```text
Before

Tree
└── hello.txt ──→ Blob X
```

에서:

```text
After

Tree
└── message.txt ──→ Blob X
```

로 변경된 것이다.

이것이 Git이 rename을 내부적으로 특별한 "파일 이동 객체"로 반드시 저장하는 방식이 아닌 이유와도 연결된다.

Git은 기본적으로 각 snapshot의 구조를 저장하고, 두 snapshot을 비교하면서 파일 이동 여부를 판단할 수 있다.

---

## Tree와 Blob의 역할 차이

둘을 정확하게 구분하면 Git 내부 구조가 훨씬 명확해진다.

### Blob

Blob은 **파일 내용**을 저장한다.

```text
Blob A

"Hello Git"
```

Blob은 다음을 모른다.

```text
파일 이름
파일 경로
어느 디렉터리에 있는지
```

---

### Tree

Tree는 **파일과 디렉터리의 이름과 구조**를 저장한다.

```text
Tree
├── README.md → Blob A
├── main.cpp  → Blob B
└── src       → Tree C
```

따라서:

```text
Tree = 디렉터리 구조
Blob = 파일 내용
```

이라고 이해하면 된다.

---

## Tree도 다른 Tree를 가리킬 수 있다

Tree object의 중요한 특징은 다른 tree를 가리킬 수 있다는 것이다.

예를 들어:

```text
project/
└── src/
    └── service/
        └── UserService.java
```

라면 내부 구조는 다음과 비슷해진다.

```text
Root Tree
   │
   └── src → Tree A
               │
               └── service → Tree B
                                │
                                └── UserService.java → Blob C
```

즉 tree가 재귀적으로 연결된다.

```text
Tree
 ↓
Tree
 ↓
Tree
 ↓
Blob
```

이 덕분에 Git은 아무리 깊은 디렉터리 구조도 표현할 수 있다.

---

## Commit과 Tree의 관계

이제 이전 글에서 살펴본 commit과 연결해보자.

commit 객체에는 다음과 같은 정보가 있었다.

```text
tree 45b983be...
parent 91ea14f3...
author ...
committer ...

Add main function
```

여기서:

```text
tree 45b983be...
```

가 바로 해당 commit의 **root tree**를 가리킨다.

따라서 Git이 특정 commit의 전체 프로젝트 상태를 읽는 과정은 대략 다음과 같다.

```text
Commit
   │
   │ tree ID
   ▼
Root Tree
   │
   ├── Blob
   │
   ├── Blob
   │
   └── Tree
        │
        └── Blob
```

Git은 commit에서 root tree를 찾고, tree를 따라 내려가면서 프로젝트 전체 구조를 복원할 수 있다.

---

## Tree가 바로 Snapshot의 핵심이다

Git을 흔히 **snapshot 기반 버전 관리 시스템**이라고 한다.

Tree object를 이해하면 이 표현의 의미가 더 명확해진다.

예를 들어 첫 번째 commit이 다음 상태라고 하자.

```text
Commit A
   ↓
Tree A
├── README.md → Blob 1
└── main.cpp  → Blob 2
```

그리고 `main.cpp`만 수정했다.

새로운 commit에서는:

```text
Commit B
   ↓
Tree B
├── README.md → Blob 1
└── main.cpp  → Blob 3
```

가 될 수 있다.

`README.md`는 변경되지 않았기 때문에 기존 `Blob 1`을 그대로 사용한다.

하지만 root tree는 내용이 달라졌다.

```text
Tree A
README.md → Blob 1
main.cpp  → Blob 2
```

와:

```text
Tree B
README.md → Blob 1
main.cpp  → Blob 3
```

은 서로 다른 내용을 가지고 있기 때문이다.

따라서 새로운 Tree B가 만들어진다.

이 구조를 보면 Git이 snapshot을 저장하면서도 기존 객체를 재사용할 수 있다는 의미가 보인다.

---

## 하위 디렉터리가 바뀌면 어떻게 될까?

조금 더 재미있는 경우를 생각해보자.

```text
project/
├── README.md
└── src/
    ├── main.cpp
    └── calculator.cpp
```

초기 상태가:

```text
Commit A
   ↓
Root Tree A
├── README.md → Blob 1
└── src       → Tree X
                ├── main.cpp       → Blob 2
                └── calculator.cpp → Blob 3
```

라고 하자.

여기서 `calculator.cpp`만 수정한다.

그러면:

```text
calculator.cpp
Blob 3 → Blob 4
```

로 바뀐다.

그 결과 `src` tree도 내용이 변경된다.

```text
Tree X
↓
Tree Y
```

그리고 root tree가 가리키는 `src` tree가 바뀌었으므로 root tree 역시 변경된다.

```text
Root Tree A
↓
Root Tree B
```

결과적으로:

```text
Commit B
   ↓
Root Tree B
├── README.md → Blob 1
└── src       → Tree Y
                ├── main.cpp       → Blob 2
                └── calculator.cpp → Blob 4
```

가 된다.

변경되지 않은:

```text
README.md → Blob 1
main.cpp  → Blob 2
```

는 그대로 재사용된다.

이를 연결해서 보면:

```text
calculator.cpp 수정
       ↓
새 Blob 생성
       ↓
src Tree 변경
       ↓
Root Tree 변경
       ↓
새 Commit 생성
```

이라는 흐름이 된다.

이 구조를 이해하면 Git commit이 왜 프로젝트 전체 snapshot을 표현할 수 있는지 알 수 있다.

---

## Tree Object를 직접 확인해보기

Git 내부 tree 구조는 직접 확인할 수 있다.

현재 commit의 root tree를 확인하려면:

```bash
git cat-file -p HEAD
```

를 실행한다.

예를 들어:

```text
tree 0da920f94...
parent 9ab8d129...
author ...
committer ...

Update README
```

가 나온다면:

```text
0da920f94...
```

가 root tree의 Object ID다.

이 tree를 직접 확인해보자.

```bash
git cat-file -p 0da920f94
```

또는 더 간단하게:

```bash
git ls-tree HEAD
```

를 사용할 수 있다.

예를 들어:

```text
100644 blob a934bc... README.md
100644 blob b293ae... package.json
040000 tree c120ab... src
```

처럼 나온다.

---

## 하위 Tree 확인하기

`src`가 다음과 같이 표시되었다고 해보자.

```text
040000 tree c120ab... src
```

그러면:

```bash
git cat-file -p c120ab
```

를 실행할 수 있다.

결과:

```text
100644 blob d39ae1... main.cpp
100644 blob 891bc2... calculator.cpp
```

이제 실제 Git 객체를 따라가면:

```text
Commit
 ↓
Root Tree
 ↓
src Tree
 ↓
Blob
```

구조를 직접 확인한 것이다.

---

## git ls-tree의 재귀 옵션

모든 하위 디렉터리까지 한 번에 보고 싶다면:

```bash
git ls-tree -r HEAD
```

를 사용할 수 있다.

예를 들면:

```text
100644 blob a934bc... README.md
100644 blob d39ae1... src/main.cpp
100644 blob 891bc2... src/calculator.cpp
```

처럼 프로젝트 전체 파일을 확인할 수 있다.

`-r`은 recursive, 즉 하위 tree까지 재귀적으로 따라가라는 의미다.

---

## 파일 모드는 무엇인가?

`git ls-tree`를 보면 앞에 다음과 같은 숫자가 등장한다.

```text
100644 blob ... README.md
100755 blob ... script.sh
040000 tree ... src
```

이것은 Git이 저장하는 **파일 모드(mode)**다.

자주 보는 값은 다음과 같다.

```text
100644  일반 파일
100755  실행 가능한 파일
040000  디렉터리(tree)
120000  symbolic link
```

예를 들어:

```text
100755 blob ... deploy.sh
```

라면 `deploy.sh`가 실행 가능한 파일이라는 의미다.

Git은 일반적인 파일 시스템처럼 모든 세부 권한 정보를 저장하지는 않지만, 실행 가능 여부 같은 일부 모드 정보는 tree에 함께 저장한다.

---

## Tree Object도 Object ID를 가진다

Blob만 Object ID를 가지는 것이 아니다.

Tree 역시 Git object이기 때문에 Object ID를 가진다.

예를 들어:

```text
tree 0da920f94...
```

처럼 표현된다.

Tree의 내용이 동일하면 동일한 Object ID를 가질 수 있고, Tree의 내용이 변경되면 Object ID도 달라진다.

예를 들어:

```text
Tree A

README.md → Blob X
main.cpp  → Blob Y
```

와:

```text
Tree B

README.md → Blob X
main.cpp  → Blob Z
```

는 서로 내용이 다르기 때문에 서로 다른 tree object가 된다.

---

## Commit, Tree, Blob 관계 다시 보기

여기까지 이해했다면 Git의 핵심 객체 구조가 조금씩 보이기 시작한다.

```text
Commit
   │
   ▼
Root Tree
├── README.md ──→ Blob
├── LICENSE ────→ Blob
└── src ────────→ Tree
                    ├── main.cpp ──→ Blob
                    └── util.cpp ──→ Blob
```

각 객체의 역할은 다음과 같다.

```text
Commit
→ 어떤 시점의 프로젝트 상태를 가리킴

Tree
→ 디렉터리 구조와 파일 이름을 표현

Blob
→ 파일 내용을 저장
```

따라서 Git은:

```text
Commit → Tree → Blob
```

이라는 객체 연결을 통해 프로젝트의 특정 시점 전체를 표현한다.

---

## Tree는 실제 디렉터리 그 자체는 아니다

한 가지 주의할 점도 있다.

Git의 Tree object는 현재 디스크에 존재하는 실제 디렉터리 그 자체가 아니다.

예를 들어:

```text
project/src/
```

라는 폴더가 있다고 해서 Git 내부의 tree가 그 폴더를 실시간으로 바라보고 있는 것은 아니다.

Tree는 특정 시점에 Git에 저장된 **불변(immutable) 객체**다.

즉 commit이 만들어지고 tree object가 저장된 이후 실제 파일을 수정한다고 해서 기존 tree가 바뀌지는 않는다.

```text
Git 내부 Tree
      ≠
현재 Working Directory
```

이 차이는 이후 `Index`와 `Working Tree`를 공부할 때 매우 중요해진다.

---

## 직접 해볼 작은 실험

Git 저장소에서 다음 명령을 실행해보자.

```bash
git ls-tree HEAD
```

그리고 출력된 tree 항목 하나를 찾는다.

예:

```text
040000 tree c120ab... src
```

그다음:

```bash
git cat-file -p c120ab
```

을 실행한다.

그리고 그 안의 blob ID를 하나 골라:

```bash
git cat-file -p <blob-id>
```

까지 실행해본다.

그러면 실제로:

```text
Commit
   ↓
Tree
   ↓
Tree
   ↓
Blob
```

을 사람이 직접 따라간 셈이다.

---

## 정리

Git의 Tree Object는 **디렉터리 구조를 표현하는 객체**다.

Tree는 다음 정보를 가지고 있다.

* 파일 또는 디렉터리 이름
* 파일 모드
* 객체 종류
* 연결된 Blob 또는 Tree의 Object ID

Tree는 파일 내용을 직접 저장하지 않는다.

파일 내용은 Blob이 담당한다.

따라서:

```text
Tree
├── 파일 이름 → Blob
└── 디렉터리 이름 → Tree
```

와 같은 구조를 만든다.

그리고 Commit은 이 중 가장 위에 있는 Root Tree를 가리킨다.

```text
Commit
   ↓
Root Tree
   ├── Blob
   ├── Blob
   └── Tree
        ├── Blob
        └── Blob
```

이 구조 덕분에 Git은 특정 commit에서 프로젝트 전체 파일 구조를 정확하게 재구성할 수 있다.

그리고 다음 질문이 남는다.

> Tree가 파일의 이름과 위치를 저장한다면, **실제 파일 내용은 어떻게 저장할까?**

그 역할을 하는 객체가 Git의 **Blob Object**다.

다음 글에서는 Git의 Blob Object와 파일 내용이 어떻게 Git에 저장되는지 살펴본다.
