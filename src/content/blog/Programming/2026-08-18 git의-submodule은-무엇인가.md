---
title: "Git의 Submodule은 무엇인가"
description: "다른 Git Repository를 특정 Commit 참조로 포함하는 git submodule의 동작 방식과 subtree와의 차이를 정리합니다."
pubDate: "2026-08-18T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "Version Control", "Developer Tools"]
slug: "git-internals-submodule"
---

앞에서는 `git worktree`와 `git subtree`를 살펴봤다.

둘을 간단히 다시 정리하면:

```text
git worktree
→ 하나의 Repository에서 여러 Working Tree를 동시에 사용

git subtree
→ Repository의 특정 하위 디렉터리를 다른 Repository나 Branch와 연결해서 관리
```

이번에는 `git submodule`을 살펴본다.

`git submodule`은 한마디로:

> **하나의 Git Repository 안에서 다른 Git Repository를 별도의 Repository로 포함해서 사용하는 기능**

이다.

즉 `subtree`가 외부 Repository의 내용을 현재 Repository 안에 가져와 하나의 Repository처럼 다루는 방식이라면,

`submodule`은 **외부 Repository를 독립된 Git Repository 상태로 유지한 채 참조한다.**

---

## 왜 Submodule이 필요할까?

예를 들어 다음 두 프로젝트가 있다고 해보자.

```text
application
shared-library
```

`application`에서는 `shared-library`를 사용해야 한다.

가장 단순하게 생각하면 `shared-library`의 코드를 복사해서:

```text
application/
├── src/
└── libs/
    └── shared-library/
```

에 넣을 수 있다.

하지만 문제가 생긴다.

원래 `shared-library`도 별도의 프로젝트이고 계속 개발되고 있다.

```text
shared-library repository

A → B → C → D
```

그런데 단순 복사하면 `application` 입장에서는:

```text
libs/shared-library/
```

가 그냥 평범한 파일들일 뿐이다.

원본 Repository의 History와 연결되지 않는다.

이럴 때 Submodule을 사용할 수 있다.

```text
application Repository
│
├── src/
│
└── libs/shared/
       │
       └── shared-library Repository
```

즉 Repository 안에 **다른 Repository를 연결**한다.

---

## Submodule의 핵심은 "다른 Repository의 특정 Commit을 가리킨다"

Submodule을 이해할 때 가장 중요한 부분이다.

부모 Repository가 Submodule의 모든 파일을 직접 저장하는 것이 아니다.

대신:

> **이 위치에서는 저 Repository의 이 Commit을 사용한다.**

라는 정보를 저장한다.

예를 들어 `shared-library`의 History가:

```text
A ← B ← C ← D
            ↑
```

이고 `application`이 Commit C를 사용한다고 해보자.

부모 Repository에서는 개념적으로:

```text
application

libs/shared
    ↓
shared-library의 Commit C
```

를 기록한다.

즉 Submodule은 단순히:

```text
shared-library 최신 버전
```

을 의미하지 않는다.

정확히는:

```text
shared-library의 특정 Commit
```

을 가리킨다.

이 차이가 매우 중요하다.

---

## Submodule 추가하기

예를 들어 현재 Repository가:

```text
my-project/
├── src/
└── README.md
```

이고 다른 Repository:

```text
https://example.com/shared-library.git
```

를:

```text
libs/shared
```

에 추가하고 싶다고 하자.

다음 명령을 사용할 수 있다.

```bash
git submodule add https://example.com/shared-library.git libs/shared
```

그러면 대략:

```text
my-project/
├── .git/
├── .gitmodules
├── src/
├── README.md
└── libs/
    └── shared/
```

가 된다.

`libs/shared/` 안에는 실제 `shared-library`의 파일들이 checkout된다.

---

## `.gitmodules`는 무엇인가?

Submodule을 추가하면 보통 Repository Root에:

```text
.gitmodules
```

파일이 생긴다.

내용은 대략 다음과 같다.

```ini
[submodule "libs/shared"]
    path = libs/shared
    url = https://example.com/shared-library.git
```

즉:

```text
libs/shared
```

라는 경로의 Submodule은:

```text
https://example.com/shared-library.git
```

Repository에서 가져온 것이라는 설정을 저장한다.

따라서 `.gitmodules`도 부모 Repository에서 Commit되어야 한다.

---

## 부모 Repository에는 Submodule 파일이 저장되는가?

여기가 Subtree와 가장 크게 다른 부분이다.

Subtree라면:

```text
my-project/
└── libs/shared/
    ├── a.cpp
    ├── b.cpp
    └── ...
```

파일들이 부모 Repository의 일반 파일처럼 저장된다.

반면 Submodule에서는 부모 Repository가:

```text
libs/shared → 특정 Commit
```

이라는 참조를 기록한다.

즉 부모 Repository 관점에서는 Submodule Directory 자체가 특별한 Git 항목이다.

개념적으로:

```text
Parent Repository

Tree
├── src       → Tree
├── README.md → Blob
└── libs/shared
       ↓
    Commit C
    of another Repository
```

처럼 생각할 수 있다.

Git 내부에서는 이런 항목을 흔히 `gitlink`라고 부르며, `git ls-tree`로 보면 모드 `160000`으로 표시된다.

예를 들어:

```bash
git ls-tree HEAD
```

결과에:

```text
160000 commit abc123... libs/shared
```

처럼 나타날 수 있다.

여기서:

```text
160000
```

은 일반 파일이나 Tree가 아니라 Submodule 참조라는 의미다.

---

## Submodule도 Git Repository다

`libs/shared/` 안에 들어가서:

```bash
cd libs/shared
git status
```

를 실행할 수 있다.

왜냐하면 그 디렉터리도 독립적인 Git Repository이기 때문이다.

즉:

```text
Parent Repo
│
└── Submodule Repo
```

이고 각각:

```text
Commit History
Branch
HEAD
Index
Working Tree
```

를 독립적으로 가진다.

따라서 부모 Repository와 Submodule Repository의 Git 상태는 별개다.

---

## Submodule을 포함한 Repository를 clone하면 어떻게 될까?

이 부분 때문에 Submodule이 처음에는 조금 불편하게 느껴질 수 있다.

일반적으로:

```bash
git clone <repository-url>
```

만 실행하면 부모 Repository는 clone되지만 Submodule 내용까지 완전히 checkout되지 않을 수 있다.

예를 들어:

```text
my-project/
└── libs/shared/
```

Directory는 있지만 내부가 비어 있거나 Submodule이 초기화되지 않은 상태일 수 있다.

이때:

```bash
git submodule update --init
```

을 실행한다.

재귀적인 Submodule까지 있다면:

```bash
git submodule update --init --recursive
```

를 사용할 수 있다.

---

## clone할 때 한 번에 가져오기

처음부터 Submodule까지 같이 clone하려면:

```bash
git clone --recurse-submodules <repository-url>
```

을 사용할 수 있다.

즉:

```bash
git clone ...
git submodule update --init --recursive
```

를 따로 실행하는 대신:

```bash
git clone --recurse-submodules ...
```

로 한 번에 처리할 수 있다.

---

## Submodule의 Commit을 업데이트하려면?

현재 Parent Repository가 Submodule의 Commit B를 가리키고 있다고 하자.

```text
shared-library

A ← B ← C ← D
    ↑
 Parent가 현재 가리킴
```

최신 Commit D로 올리고 싶다면 Submodule Directory로 들어간다.

```bash
cd libs/shared
```

그리고 일반 Git Repository처럼:

```bash
git switch main
git pull
```

등을 수행한다.

그러면 Submodule의 HEAD가 새로운 Commit으로 이동한다.

예를 들어:

```text
Before
B

After
D
```

하지만 여기서 끝이 아니다.

부모 Repository로 돌아오면:

```bash
cd ../..
git status
```

에서 Submodule이 변경되었다고 나온다.

왜냐하면 Parent Repository가 기록하고 있던 참조가:

```text
libs/shared → Commit B
```

에서:

```text
libs/shared → Commit D
```

로 바뀌었기 때문이다.

따라서 Parent Repository에서도 다시 Commit해야 한다.

```bash
git add libs/shared
git commit -m "Update shared submodule"
```

즉 Submodule 업데이트는:

```text
Submodule Repository
Commit 이동
      ↓
Parent Repository
새 Commit 참조 기록
```

의 두 단계라고 이해하면 된다.

---

## Submodule 안에서 코드를 수정하면?

Submodule도 별도의 Git Repository이므로 일반적인 개발이 가능하다.

```bash
cd libs/shared
```

파일 수정:

```text
shared.cpp
```

그리고:

```bash
git add .
git commit -m "Fix shared logic"
git push
```

한다.

이 Commit은 **Submodule Repository의 Commit**이다.

그다음 Parent Repository로 돌아가면:

```bash
cd ../..
```

Submodule 참조가 변경된 상태다.

따라서:

```bash
git add libs/shared
git commit -m "Update shared library reference"
```

로 Parent Repository에도 기록해야 한다.

전체 흐름:

```text
Submodule

Commit C
   ↓
코드 수정
   ↓
Commit D
   ↓
push

       ↓

Parent Repository

libs/shared
Commit C → Commit D

       ↓

Parent에서도 commit
```

이다.

---

## 왜 두 번 Commit하는가?

처음에는 이 부분이 귀찮게 느껴질 수 있다.

하지만 역할을 나누어 보면 자연스럽다.

첫 번째 Commit:

```text
shared-library Repository
```

에:

> 라이브러리 코드가 이렇게 변경되었다.

를 기록한다.

두 번째 Commit:

```text
application Repository
```

에:

> 이제 shared-library의 새 Commit을 사용한다.

를 기록한다.

즉 서로 다른 Repository의 History이기 때문에 각각 Commit이 필요한 것이다.

---

## Detached HEAD 상태가 자주 보이는 이유

Submodule을 checkout해 보면:

```bash
git status
```

에서 Detached HEAD 상태인 경우가 있다.

이유는 Parent Repository가 보통:

```text
shared-library의 특정 Branch
```

를 저장하는 것이 아니라:

```text
shared-library의 특정 Commit
```

을 저장하기 때문이다.

즉:

```text
Parent Repo
    ↓
Submodule Commit abc123
```

를 정확히 재현하기 위해 Git이 해당 Commit을 직접 checkout한다.

그래서:

```text
HEAD
 ↓
Commit abc123
```

형태의 Detached HEAD가 될 수 있다.

Submodule 안에서 직접 개발하려면 필요에 따라:

```bash
git switch main
```

또는:

```bash
git switch -c feature
```

처럼 Branch로 이동한 뒤 작업하는 것이 좋다.

---

## Submodule 상태 확인하기

현재 Submodule 상태는:

```bash
git submodule status
```

로 확인할 수 있다.

예를 들어:

```text
abc123456 libs/shared
```

처럼 나오면 현재 `libs/shared`가 어떤 Commit을 사용 중인지 볼 수 있다.

Parent Repository에서:

```bash
git status
```

를 실행했을 때:

```text
modified: libs/shared
```

와 비슷하게 보인다면 Submodule이 부모가 기록한 Commit과 다른 Commit을 가리키고 있을 수 있다.

---

## 다른 사람이 Submodule 버전을 올린 경우

팀원이 Parent Repository에서:

```text
libs/shared → Commit B
```

를:

```text
libs/shared → Commit D
```

로 변경하고 Push했다고 하자.

내가 Parent Repository에서:

```bash
git pull
```

을 실행하면 Parent는 새로운 Submodule Commit D를 사용하라고 기록한다.

하지만 실제 Submodule Working Tree가 자동으로 D로 이동하지 않을 수 있다.

그래서:

```bash
git submodule update
```

를 실행한다.

그러면:

```text
Parent가 원하는 Commit
       ↓
Submodule Working Tree
```

가 일치한다.

따라서 Submodule 프로젝트에서는 종종:

```bash
git pull
git submodule update --init --recursive
```

같은 흐름을 볼 수 있다.

---

## `git pull --recurse-submodules`

Submodule까지 고려해 pull하려면:

```bash
git pull --recurse-submodules
```

같은 옵션도 사용할 수 있다.

다만 팀이나 프로젝트마다 Submodule 관리 정책이 다를 수 있기 때문에:

> Parent Repository가 기록한 정확한 Commit을 재현하는 것

이 기본 원칙이라고 이해하는 것이 중요하다.

---

## Subtree와 Submodule의 가장 큰 차이

둘 다 외부 Repository 코드를 프로젝트 내부에 사용할 수 있다.

하지만 관리 방식이 다르다.

### Subtree

```text
Parent Repository
├── src/
└── shared/
    ├── fileA
    └── fileB
```

`shared/`도 부모 Repository의 일반 파일처럼 관리된다.

clone하면 바로 파일이 있다.

```bash
git clone ...
```

만으로 대부분 끝난다.

---

### Submodule

```text
Parent Repository
└── shared/
       ↓
    Separate Repository
```

부모는 외부 Repository의 **특정 Commit을 참조**한다.

그래서 clone 후:

```bash
git submodule update --init
```

등이 필요할 수 있다.

---

## Subtree / Submodule 비교

| 항목                | Subtree        | Submodule          |
| ----------------- | -------------- | ------------------- |
| 외부 Repository     | 현재 Repo에 내용 포함 | 별도 Repo로 유지        |
| Parent가 저장하는 것    | 파일과 History    | 외부 Repo의 Commit 참조 |
| clone 후 추가 작업     | 거의 없음          | 초기화 필요할 수 있음       |
| 외부 Repo 독립성       | 상대적으로 약함       | 매우 강함              |
| 사용 편의성            | 사용자 입장에서는 단순   | 관리 개념이 더 복잡        |
| 외부 Repo와 자주 독립 작업 | 다소 번거로울 수 있음   | 잘 맞음               |

---

## 언제 Submodule이 좋은가?

Submodule은 외부 프로젝트를 **명확하게 독립된 Repository로 유지해야 하는 경우**에 잘 맞는다.

예를 들어:

```text
Application
│
├── Engine
├── Shared SDK
└── Device Driver
```

각 구성요소가 별도의 팀과 Release Cycle을 가지고 있다고 해보자.

```text
Application Repo
Engine Repo
SDK Repo
Driver Repo
```

이들을 단순 복사해서 하나의 Repository로 합치고 싶지 않을 수 있다.

그럴 때 Parent Repository는:

```text
Engine v1.2에 해당하는 Commit
SDK v3.5에 해당하는 Commit
Driver의 특정 Commit
```

을 정확하게 기록할 수 있다.

즉:

> 이 Application 버전은 정확히 어떤 Dependency Commit으로 만들어졌는가?

를 재현하기 좋다.

---

## Submodule이 불편한 경우

반대로 단순히:

> 외부 코드를 가져와서 우리 Repository의 일부처럼 편하게 쓰고 싶다.

라면 Submodule이 오히려 복잡할 수 있다.

새 개발자가:

```bash
git clone ...
```

했는데 파일이 제대로 없고:

```bash
git submodule update --init --recursive
```

를 추가로 알아야 한다.

또 Submodule 내부를 수정한 뒤:

```text
Submodule Commit
Parent Commit
```

두 단계의 Commit 관리도 필요하다.

따라서 단순성 자체가 중요하다면 Subtree가 더 편한 상황도 있다.

---

## Worktree / Subtree / Submodule 전체 비교

이제 이름이 헷갈리기 쉬운 세 기능을 함께 볼 수 있다.

### git worktree

문제:

> 한 Repository에서 여러 Branch를 동시에 작업하고 싶다.

구조:

```text
                 Repository
                /          \
               ↓            ↓
         Working Tree   Working Tree
            main           feature
```

---

### git subtree

문제:

> Repository의 특정 디렉터리를 다른 Repository나 Branch와 관리하고 싶다.

구조:

```text
Parent Repository
└── shared/
      ↑
      │ subtree pull/push
      ↓
Other Repository
```

Parent 입장에서는 `shared/`가 일반 파일처럼 포함된다.

---

### git submodule

문제:

> 다른 Repository를 독립된 Repository로 유지한 채 현재 프로젝트에서 사용하고 싶다.

구조:

```text
Parent Repository
└── shared/
       │
       ↓
   Separate Git Repository
       │
       ↓
    특정 Commit
```

---

## 한 문장씩 기억하기

세 기능을 한 문장씩만 기억한다면:

```text
worktree
→ 같은 Repo의 Branch를 다른 작업 폴더에 펼친다.

subtree
→ Repo의 한 폴더를 다른 Repo/Branch와 주고받는다.

submodule
→ 다른 Repo의 특정 Commit을 현재 Repo가 참조한다.
```

라고 정리할 수 있다.

---

## 직접 해볼 작은 실험

테스트 Repository를 두 개 만든다.

```text
parent/
shared/
```

먼저 `shared` Repository에 Commit을 하나 만든다.

```bash
git init
echo "shared" > shared.txt
git add .
git commit -m "Initial shared"
```

Parent Repository에서:

```bash
git submodule add ../shared libs/shared
```

를 실행한다.

그러면:

```text
parent/
├── .gitmodules
└── libs/
    └── shared/
```

가 생긴다.

Parent에서:

```bash
git status
```

를 확인하고:

```bash
git add .
git commit -m "Add shared submodule"
```

한다.

그리고:

```bash
git ls-tree HEAD
```

를 실행해본다.

Submodule 항목이:

```text
160000 commit ... libs/shared
```

형태로 나오는 것을 확인할 수 있다.

이것이 Parent Repository가 Submodule의 파일을 직접 저장하는 것이 아니라:

> 다른 Repository의 특정 Commit을 가리킨다.

는 것을 가장 직접적으로 확인하는 방법이다.

---

## 정리

`git submodule`은:

> **다른 Git Repository를 현재 Repository 내부에 독립된 Repository 상태로 포함하고, 그 Repository의 특정 Commit을 참조하는 기능**

이다.

Parent Repository는 Submodule의 전체 파일 History를 자신의 History로 흡수하지 않는다.

대신:

```text
Submodule path
        ↓
External Repository Commit
```

이라는 관계를 저장한다.

그래서:

```text
Parent Repo

libs/shared
     ↓
Commit abc123
of Shared Repo
```

라는 구조가 된다.

Subtree와 비교하면 차이가 더 명확하다.

```text
Subtree
→ 외부 Repository 내용을 현재 Repository 안에 포함

Submodule
→ 외부 Repository를 독립적으로 유지하고 Commit만 참조
```

그리고 Worktree까지 포함하면:

```text
Worktree
→ 작업 공간 관리

Subtree
→ Repository 일부의 통합/분리 관리

Submodule
→ Repository 간 의존 관계 관리
```

라고 구분할 수 있다.

지금까지의 전체 Git 학습 흐름도 하나로 연결된다.

```text
Git의 저장 구조

Commit
  ↓
Tree
  ↓
Blob


Git의 작업 상태

HEAD
Index
Working Tree


Git의 상태 변경

reset
restore
checkout
switch


Git의 저장소 활용

worktree
subtree
submodule
```

이 흐름을 이해하면 Git 명령을 각각 따로 외우기보다:

> **Git이 무엇을 저장하고, 현재 상태를 어떻게 관리하며, 여러 작업 공간과 Repository를 어떻게 연결하는지**

라는 하나의 구조로 볼 수 있다.
