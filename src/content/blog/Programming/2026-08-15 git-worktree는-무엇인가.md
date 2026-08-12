---
title: "Git의 Worktree는 무엇인가"
description: "하나의 Git 저장소에서 여러 Working Tree를 동시에 사용하는 git worktree의 내부 구조와 활용법을 살펴봅니다."
pubDate: "2026-08-15T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "Version Control", "Developer Tools"]
slug: "git-internals-worktree"
---

앞에서는 Git에서 작업 상태를 다음 세 영역으로 나누어 살펴봤다.

```text
HEAD
→ 현재 기준이 되는 Commit

Index
→ 다음 Commit으로 만들 상태

Working Tree
→ 현재 디스크에서 직접 수정하고 있는 상태
```

일반적으로 하나의 Git 저장소에서는 하나의 Working Tree만 사용한다.

예를 들어:

```text
project/
├── .git/
├── src/
├── README.md
└── ...
```

라고 하면 `project/` 디렉터리 자체가 하나의 Working Tree다.

현재 `main` 브랜치를 checkout했다면:

```text
HEAD
 ↓
main
 ↓
Commit A
```

이고, Working Tree에는 Commit A의 파일들이 펼쳐져 있다.

그런데 실제 개발을 하다 보면 문제가 생긴다.

---

## 브랜치를 바꾸면 Working Tree도 바뀐다

예를 들어 `feature/login` 브랜치에서 작업 중이라고 해보자.

```text
HEAD
 ↓
feature/login
```

Working Tree에는 로그인 기능을 개발 중인 파일들이 있다.

```text
project/
├── src/
│   └── LoginService.java
└── ...
```

그런데 갑자기 운영 환경에서 긴급한 버그가 발생했다.

`main` 기준으로 hotfix를 해야 한다.

일반적인 방식이라면 현재 작업을 정리해야 한다.

```bash
git status
git stash
git switch main
git switch -c hotfix/login-error
```

수정을 끝낸 뒤 다시 원래 작업으로 돌아간다.

```bash
git switch feature/login
git stash pop
```

작업 중인 내용이 많다면 이 과정은 꽤 번거롭다.

특히:

* 아직 commit하고 싶지 않은 작업이 있고
* 브랜치마다 dependency 상태가 다르고
* 빌드 결과물이 다르고
* IDE가 branch 변경에 따라 파일을 다시 읽어야 하고
* 여러 작업을 동시에 비교해야 하는 경우

불편함이 커진다.

이 문제를 해결하는 기능이 바로 **`git worktree`**다.

---

## git worktree란?

`git worktree`는:

> **하나의 Git 저장소를 공유하면서 여러 개의 Working Tree를 동시에 사용할 수 있게 해주는 기능**

이다.

즉 브랜치를 바꿔가며 한 폴더를 재사용하는 대신, 각 브랜치를 서로 다른 폴더에 펼쳐놓을 수 있다.

예를 들어:

```text
projects/
├── project-main/
└── project-feature/
```

두 폴더가 있다고 하자.

각각 다음 브랜치를 사용할 수 있다.

```text
project-main/
→ main

project-feature/
→ feature/login
```

이제 두 브랜치는 동시에 checkout되어 있다.

```text
                 하나의 Git Repository
                 /                  \
                /                    \
             main                feature/login
              ↓                       ↓

     project-main/             project-feature/
      Working Tree              Working Tree
```

이것이 `git worktree`의 핵심이다.

---

## Worktree는 저장소를 복제하는 것과 다르다

처음 보면:

> 그냥 `git clone`을 두 번 하면 되는 것 아닌가?

라는 생각이 들 수 있다.

실제로 clone을 두 번 하면 비슷한 결과를 만들 수 있다.

```text
projects/
├── project-main/
│   └── .git/
│
└── project-feature/
    └── .git/
```

하지만 이 경우 두 디렉터리는 서로 완전히 독립된 Git 저장소다.

각각:

* object database
* refs
* config
* remote 정보

등을 따로 가진다.

반면 `git worktree`는 Git 저장소의 핵심 데이터를 공유한다.

개념적으로:

```text
                   Shared Git Repository
                  commit / tree / blob
                    /             \
                   /               \
          Working Tree A      Working Tree B
              main             feature/login
```

즉:

> **Git 객체는 공유하고, 실제 작업 디렉터리만 여러 개 둔다.**

는 차이가 있다.

---

## Worktree 만들기

현재 다음 저장소가 있다고 하자.

```text
dev/project/
```

현재 `main` 브랜치에서 작업 중이다.

다른 브랜치를 별도의 Working Tree로 만들고 싶다면:

```bash
git worktree add ../project-feature feature/login
```

를 실행할 수 있다.

그러면:

```text
dev/
├── project/
│   └── main
│
└── project-feature/
    └── feature/login
```

구조가 된다.

각 폴더에서:

```bash
git branch --show-current
```

를 실행하면 서로 다른 결과가 나온다.

```text
project/
→ main
```

```text
project-feature/
→ feature/login
```

두 branch가 동시에 checkout되어 있는 것이다.

---

## 새로운 Branch와 Worktree를 동시에 만들기

새로운 브랜치까지 같이 만들 수도 있다.

예를 들어 `main`에서 새로운 hotfix 브랜치를 만들면서 Worktree까지 생성하려면:

```bash
git worktree add -b hotfix/login-error ../project-hotfix main
```

를 사용할 수 있다.

이 명령은 대략 다음 의미다.

```text
main을 기준으로

hotfix/login-error 브랜치를 만들고

../project-hotfix 디렉터리에 checkout
```

결과:

```text
projects/
├── project/
│   └── main
│
├── project-feature/
│   └── feature/login
│
└── project-hotfix/
    └── hotfix/login-error
```

이제 기존 feature 작업을 그대로 둔 상태에서 hotfix 작업을 진행할 수 있다.

---

## Worktree마다 HEAD는 따로 존재한다

앞에서 HEAD는 보통 현재 checkout된 branch를 가리킨다고 했다.

Worktree가 여러 개라면 어떻게 될까?

각 Worktree는 자신의 HEAD를 가진다.

예를 들어:

```text
project/
```

에서는:

```text
HEAD
 ↓
main
 ↓
Commit A
```

이고,

```text
project-feature/
```

에서는:

```text
HEAD
 ↓
feature/login
 ↓
Commit B
```

일 수 있다.

즉:

```text
Shared Repository
│
├── Worktree A
│   └── HEAD → main
│
└── Worktree B
    └── HEAD → feature/login
```

구조가 된다.

이 때문에 서로 다른 branch를 동시에 checkout할 수 있다.

---

## Worktree마다 Index도 따로 존재한다

HEAD만 따로 있는 것이 아니다.

앞에서 Index는:

> 다음 Commit으로 만들 상태

라고 했다.

Worktree마다 독립적인 작업을 해야 하므로 Index 역시 각각 필요하다.

예를 들어:

```text
Worktree A

HEAD  → main
Index → main의 staging 상태
Files → main Working Tree
```

```text
Worktree B

HEAD  → feature/login
Index → feature/login의 staging 상태
Files → feature/login Working Tree
```

이다.

따라서 Worktree A에서:

```bash
git add README.md
```

를 했다고 해서 Worktree B의 staging 상태가 바뀌지는 않는다.

이 점이 매우 중요하다.

Worktree는 단순히 폴더만 여러 개 만드는 기능이 아니라:

> **각각 독립된 HEAD / Index / Working Tree 상태를 제공한다.**

고 볼 수 있다.

---

## `.git`은 어디에 있을까?

일반적인 Git 저장소에서는:

```text
project/
├── .git/
├── src/
└── ...
```

처럼 `.git`이 디렉터리다.

이 안에:

```text
.git/
├── objects/
├── refs/
├── HEAD
├── index
└── config
```

등이 들어 있다.

하지만 추가 Worktree를 만들면 조금 다르다.

예를 들어:

```text
projects/
├── project/
└── project-feature/
```

가 있다고 하자.

원래 저장소에는:

```text
project/
└── .git/
```

이라는 실제 Git directory가 존재한다.

추가 Worktree에서는:

```text
project-feature/
└── .git
```

이 `.git`이 디렉터리가 아니라 **파일**이다.

파일을 열어보면 대략:

```text
gitdir: project/.git/worktrees/project-feature
```

같은 내용이 들어 있다.

즉:

> 이 Worktree의 Git 관리 정보는 원래 Repository의 `.git/worktrees/...`에 있다.

라는 포인터 역할을 한다.

---

## 실제 Git 데이터는 공유한다

원래 Repository의 `.git`을 보면 대략:

```text
.git/
├── objects/
├── refs/
├── config
└── worktrees/
    └── project-feature/
        ├── HEAD
        ├── index
        └── ...
```

구조가 만들어진다.

중요한 것은:

```text
objects/
```

이다.

Commit, Tree, Blob 같은 Git 객체들은 기본 저장소에서 공유한다.

```text
.git/objects
     │
     ├── Commit
     ├── Tree
     └── Blob
```

그리고 각 Worktree는 별도의:

```text
HEAD
Index
Working Tree
```

를 가진다.

이를 전체 구조로 보면:

```text
                    .git/objects
                 Commit / Tree / Blob
                      공유
              ┌────────┴─────────┐
              │                  │
              ▼                  ▼

         Worktree A          Worktree B
         HEAD: main          HEAD: feature
         Index A             Index B
         Files A             Files B
```

이 구조가 `git worktree`의 핵심 내부 동작이다.

---

## 같은 Branch를 두 Worktree에서 checkout할 수 있을까?

일반적으로 Git은 같은 branch를 여러 Worktree에서 동시에 checkout하지 못하게 한다.

예를 들어 이미:

```text
project/
→ main
```

인 상태에서:

```bash
git worktree add ../project-main2 main
```

을 실행하면 Git이 거부할 수 있다.

왜냐하면 두 Working Tree가 동시에 같은 branch를 수정하면 branch pointer를 어떻게 관리해야 할지 혼란이 생길 수 있기 때문이다.

그래서 보통:

```text
Worktree A → main
Worktree B → feature/login
Worktree C → hotfix/error
```

처럼 서로 다른 branch를 사용한다.

---

## 현재 Worktree 목록 확인하기

현재 Repository에 연결된 Worktree는 다음 명령으로 확인할 수 있다.

```bash
git worktree list
```

예를 들어:

```text
dev/project          a12bc34 [main]
dev/project-feature  b23cd45 [feature/login]
dev/project-hotfix   c34de56 [hotfix/error]
```

처럼 출력될 수 있다.

즉:

```text
경로
Commit ID
Branch
```

를 한 번에 볼 수 있다.

---

## Worktree 제거하기

더 이상 필요하지 않은 Worktree는 제거할 수 있다.

예를 들어:

```text
../project-hotfix
```

를 제거하려면:

```bash
git worktree remove ../project-hotfix
```

를 사용한다.

Worktree를 제거해도 branch 자체가 자동으로 삭제되는 것은 아니다.

즉:

```text
Working Tree 제거
≠
Branch 제거
```

다.

필요하다면 이후:

```bash
git branch -d hotfix/error
```

처럼 branch를 별도로 삭제할 수 있다.

---

## 폴더를 직접 삭제하면 안 될까?

그냥 탐색기에서 Worktree 폴더를 삭제할 수도 있지만 권장되지는 않는다.

왜냐하면 Git 내부에는 여전히:

```text
.git/worktrees/...
```

정보가 남을 수 있기 때문이다.

가능하면:

```bash
git worktree remove ...
```

를 사용하는 것이 좋다.

이미 직접 삭제했다면:

```bash
git worktree prune
```

으로 더 이상 존재하지 않는 Worktree 정보를 정리할 수 있다.

---

## Worktree는 언제 유용할까?

### 1. 긴급 Hotfix

현재 feature 개발 중:

```text
project-feature/
→ feature/login
```

긴급 수정 요청이 들어온다.

```bash
git worktree add -b hotfix/server-error ../project-hotfix main
```

그러면:

```text
project-feature/
→ 기존 개발 그대로 유지

project-hotfix/
→ 긴급 수정
```

가 된다.

stash할 필요가 없다.

---

### 2. 여러 Branch 비교

두 구현을 동시에 비교해야 할 수도 있다.

```text
project-v1/
→ feature-v1

project-v2/
→ feature-v2
```

IDE를 두 개 열어놓고 파일 구조나 실행 결과를 직접 비교할 수 있다.

---

### 3. 테스트 환경 분리

한쪽에서는 안정적인 `main`을 실행하고:

```text
project-main/
→ 서버 실행
```

다른 쪽에서는 새로운 기능을 개발할 수 있다.

```text
project-feature/
→ 기능 개발
```

브랜치를 전환하면서 실행 환경을 계속 재구성할 필요가 줄어든다.

---

### 4. Coding Agent와 병렬 작업

최근에는 `git worktree`가 코딩 에이전트와도 잘 맞는다.

예를 들어 개발자가:

```text
project/
→ feature/payment
```

에서 직접 작업하고 있다고 하자.

Codex 같은 Agent에게 다른 작업을 맡길 수 있다.

```text
project-agent/
→ fix/payment-test
```

또 다른 Agent에게 리뷰용 작업 공간을 줄 수도 있다.

```text
project-review/
→ review/payment
```

구조:

```text
                Shared Git Repository
               /          |          \
              /           |           \
          Developer     Agent       Reviewer
             ↓            ↓            ↓
        Worktree A    Worktree B    Worktree C
```

각 작업 공간이 분리되어 있기 때문에 한쪽에서 파일을 수정해도 다른 쪽 Working Tree가 갑자기 바뀌지 않는다.

이는 자동화 작업에서 상당히 유용하다.

---

## Worktree를 왜 상위 Repository 내부에 만들지 않을까?

예를 들어 이런 구조를 만들 수도 있을 것처럼 보인다.

```text
project/
├── src/
├── README.md
└── feature-worktree/
    ├── src/
    └── README.md
```

하지만 일반적으로는 추천하지 않는다.

원래 Working Tree 안에 또 다른 Working Tree가 들어가기 때문이다.

더 깔끔한 방식은 형제 디렉터리로 두는 것이다.

```text
projects/
├── project-main/
├── project-feature/
└── project-hotfix/
```

즉:

```text
공통 Parent Directory
├── Worktree A
├── Worktree B
└── Worktree C
```

형태가 관리하기 쉽다.

---

## Worktree의 파일은 실제로 중복될까?

그렇다.

각 Working Tree는 실제 디스크에 파일을 펼쳐놓기 때문에:

```text
project-main/
├── src/
└── README.md

project-feature/
├── src/
└── README.md
```

처럼 파일들은 각각 존재한다.

따라서 Working Tree의 파일 데이터는 어느 정도 중복된다.

하지만 `git clone`을 여러 번 하는 것과 달리:

```text
Commit
Tree
Blob
```

같은 Git Object Database는 공유한다.

즉:

```text
실제 작업 파일
→ Worktree마다 따로 존재

Git object database
→ 하나를 공유
```

한다고 이해하면 된다.

---

## Worktree와 Branch의 관계

Worktree와 Branch는 같은 개념이 아니다.

Branch는:

> 특정 Commit을 가리키는 이동 가능한 참조

다.

```text
main
 ↓
Commit A
```

Worktree는:

> 특정 Branch 또는 Commit의 상태를 실제 파일 시스템에 펼쳐놓은 작업 공간

이다.

```text
Branch
 ↓
Commit
 ↓
Tree / Blob
 ↓
Working Tree
```

따라서:

```text
Branch = Git 내부의 참조

Worktree = 실제 파일이 존재하는 작업 공간
```

이라고 구분할 수 있다.

---

## Worktree와 Working Tree는 다른 말일까?

두 용어가 조금 헷갈릴 수 있다.

`Working Tree`는 Git의 일반적인 개념이다.

> 현재 checkout된 파일들이 존재하는 작업 디렉터리

를 의미한다.

`git worktree`는:

> 그런 Working Tree를 여러 개 관리하기 위한 Git 기능과 명령

이다.

즉:

```text
Working Tree
→ 개념

git worktree
→ 여러 Working Tree를 관리하는 기능
```

이라고 이해하면 된다.

---

## 직접 해볼 작은 실험

테스트 Repository에서 다음을 실행해보자.

현재 branch 확인:

```bash
git branch --show-current
```

현재 Worktree 목록 확인:

```bash
git worktree list
```

새 branch와 Worktree를 만든다.

```bash
git worktree add -b experiment ../project-experiment
```

그다음:

```bash
cd ../project-experiment
```

그리고:

```bash
git branch --show-current
```

를 실행한다.

결과:

```text
experiment
```

이 나온다.

원래 Repository로 돌아가면:

```bash
git branch --show-current
```

결과는 기존 branch 그대로다.

즉 두 branch가 동시에 checkout되어 있는 것을 확인할 수 있다.

추가 Worktree의 `.git`도 확인해보자.

PowerShell:

```powershell
Get-Content .git
```

Git Bash:

```bash
cat .git
```

대략:

```text
gitdir: .../.git/worktrees/project-experiment
```

가 나오는 것을 확인할 수 있다.

마지막으로:

```bash
git worktree list
```

를 실행하면 두 Working Tree가 모두 표시된다.

---

## 정리

`git worktree`는:

> **하나의 Git Repository를 공유하면서 여러 개의 Working Tree를 동시에 사용할 수 있게 해주는 기능**

이다.

일반 Git 작업에서는:

```text
Repository
    │
    ▼
Working Tree
    │
    └── 한 번에 하나의 Branch
```

를 사용한다.

Worktree를 이용하면:

```text
                  Repository
               Git Object DB
              /      |      \
             /       |       \
        Worktree  Worktree  Worktree
           ↓         ↓         ↓
         main     feature    hotfix
```

처럼 여러 Branch를 동시에 파일 시스템에 펼칠 수 있다.

각 Worktree는 독립적인:

* HEAD
* Index
* Working Tree

를 가지고,

Commit / Tree / Blob 같은 Git 객체는 공유한다.

그래서 `git worktree`는 특히:

* 긴급 hotfix
* 여러 branch 병렬 개발
* branch 비교
* 테스트 환경 분리
* Coding Agent와 병렬 작업

같은 상황에서 유용하다.

그리고 여기서 다음 질문이 생길 수 있다.

> `worktree`가 여러 Branch를 여러 폴더에 펼치는 기능이라면, `git subtree`는 무엇일까?

이름은 비슷하지만 `subtree`는 완전히 다른 문제를 해결한다.

`git worktree`가 **작업 공간을 여러 개 만드는 기능**이라면,

`git subtree`는 **Repository의 특정 하위 디렉터리를 다른 Repository나 Branch와 연결해서 관리하는 방식**이다.

다음 글에서는 `git subtree`가 왜 필요한지, 그리고 `worktree`와 무엇이 다른지 살펴본다.
