---
title: "Git의 Subtree는 무엇인가"
description: "저장소의 특정 디렉터리를 다른 Repository나 Branch와 연결해서 관리하는 git subtree의 동작 방식과 worktree/submodule과의 차이를 살펴봅니다."
pubDate: "2026-08-16T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "Version Control", "Developer Tools"]
slug: "git-internals-subtree"
---

앞에서는 `git worktree`를 살펴봤다.

`git worktree`는 하나의 Git 저장소를 공유하면서 여러 Working Tree를 동시에 사용하는 기능이었다.

```text
                    Git Repository
                  /        |        \
                 /         |         \
           Worktree A  Worktree B  Worktree C
              main       feature      hotfix
```

그런데 Git에는 이름이 비슷한 `subtree`라는 기능도 있다.

처음 보면:

```text
worktree
subtree
```

둘 다 `tree`라는 이름이 들어가기 때문에 비슷한 기능처럼 느껴질 수 있다.

하지만 둘은 **완전히 다른 문제를 해결한다.**

`git worktree`가:

> 여러 브랜치를 서로 다른 작업 디렉터리에 동시에 펼치는 기능

이라면,

`git subtree`는:

> **저장소의 특정 하위 디렉터리를 다른 Repository나 Branch와 연결해서 관리하는 방식**

이다.

---

## 왜 Subtree가 필요할까?

다음과 같은 프로젝트가 있다고 해보자.

```text
my-project/
├── src/
├── README.md
└── docs/
    ├── index.html
    ├── guide.html
    └── assets/
```

전체 프로젝트는 하나의 Git Repository에서 관리하고 있다.

그런데 `docs/` 디렉터리만 별도로 다른 Git Repository에 배포하거나 관리하고 싶을 수 있다.

예를 들어:

```text
my-project
   │
   ├── src/
   ├── README.md
   │
   └── docs/
        │
        └──────────────→ 별도 Repository
```

또는 GitHub Pages를 사용할 때:

```text
main branch
│
└── book/
    ├── index.html
    └── ...
```

의 `book/` 내용만:

```text
gh-pages branch
├── index.html
└── ...
```

로 보내고 싶을 수도 있다.

이런 상황에서 사용할 수 있는 방법 중 하나가 `git subtree`다.

---

## Subtree의 핵심 개념

예를 들어 현재 Repository가 다음과 같다고 하자.

```text
project/
├── src/
├── README.md
└── book/
    ├── index.html
    ├── chapter1.html
    └── style.css
```

여기서 `book/` 디렉터리만 다른 Branch로 보내고 싶다.

```bash
git subtree push --prefix book origin gh-pages
```

이 명령을 사용하면 개념적으로:

```text
현재 Repository

project/
├── src/
├── README.md
└── book/
    ├── index.html
    ├── chapter1.html
    └── style.css

            │
            │ subtree
            ▼

gh-pages branch

├── index.html
├── chapter1.html
└── style.css
```

처럼 된다.

중요한 부분은 `book/` 자체가:

```text
gh-pages/
└── book/
    └── ...
```

으로 들어가는 것이 아니라,

**`book/` 내부가 대상 Branch의 Root가 된다**는 점이다.

---

## `--prefix`는 무엇인가?

다음 명령을 다시 보자.

```bash
git subtree push --prefix book origin gh-pages
```

여기서:

```text
--prefix book
```

은:

> 현재 Repository에서 `book` 디렉터리를 Subtree 대상으로 사용하라.

는 뜻이다.

즉:

```text
project/
├── src/
├── README.md
└── book/      ← prefix
```

라고 생각하면 된다.

그리고:

```text
origin gh-pages
```

는:

> `origin` Remote의 `gh-pages` Branch로 보내라.

는 의미다.

따라서 전체 명령을 자연어로 읽으면:

> 현재 Repository의 `book/` 디렉터리 부분만 떼어서 `origin`의 `gh-pages` Branch로 Push하라.

가 된다.

---

## Subtree는 단순히 파일을 복사하는 것일까?

겉으로 보기에는:

```text
book/
   ↓
복사
   ↓
gh-pages
```

처럼 보이지만, 단순한 `cp`나 파일 복사와는 다르다.

Git Subtree는 **Git History를 기반으로 특정 디렉터리에 관련된 상태를 분리해서 다룬다.**

예를 들어 전체 Commit History가:

```text
A
↓
B
↓
C
↓
D
```

라고 하자.

각 Commit에는 전체 Repository 상태가 있다.

```text
Commit A
├── src
└── book

Commit B
├── src
└── book

Commit C
├── src
└── book

Commit D
├── src
└── book
```

Subtree는 이 중 `book/`에 해당하는 부분을 대상으로 별도의 History 형태를 만들어낼 수 있다.

개념적으로:

```text
전체 Repository History

A → B → C → D
      │       │
      └─ book 변경
              └─ book 변경

          ↓ subtree

book History

A' → B' → C'
```

와 같은 형태다.

즉 Subtree는 단순히 현재 파일만 복사하는 것보다 Git History와 더 밀접하게 연결되어 있다.

---

## `git subtree split`

Subtree를 이해할 때 중요한 명령 중 하나가 `split`이다.

예를 들어:

```bash
git subtree split --prefix book
```

을 실행하면:

> `book/` 디렉터리에 해당하는 History만 가지고 새로운 Commit History를 만들어라.

라는 의미다.

Git은 결과로 새로운 Commit ID를 출력한다.

예를 들어:

```text
abc123...
```

가 나왔다고 하자.

그 Commit을 개념적으로 보면:

```text
원래 Repository

project/
├── src/
└── book/
    ├── index.html
    └── style.css
```

에서 `book/`만 Root로 만든 상태다.

```text
Split Commit

├── index.html
└── style.css
```

즉 `git subtree push`는 내부적으로 이런 **분리된 History를 Remote Branch에 Push하는 것과 비슷하게 이해**할 수 있다.

---

## 왜 GitHub Pages 배포에 Subtree를 사용했을까?

예전에 정적 사이트를 직접 Branch에 배포할 때 `git subtree`가 꽤 유용했다.

예를 들어 프로젝트 구조가:

```text
blog/
├── src/
├── posts/
├── package.json
└── dist/
    ├── index.html
    ├── assets/
    └── ...
```

라고 하자.

`main` Branch에는 소스 코드까지 모두 있지만 GitHub Pages에서는 빌드 결과인 `dist/`만 필요하다.

그래서:

```bash
git subtree push --prefix dist origin gh-pages
```

라고 하면:

```text
main

src/
posts/
package.json
dist/
 ├── index.html
 └── assets/

         ↓

gh-pages

index.html
assets/
```

처럼 배포할 수 있다.

즉:

> Repository 전체를 `gh-pages`에 Push하지 않고 빌드 결과 디렉터리만 Branch Root로 보내는 방식

이다.

전에 봤던:

```bash
git subtree push --prefix book origin gh-pages
```

도 정확히 같은 구조다.

`book/` 디렉터리를 GitHub Pages에 배포하는 것이다.

---

## Worktree 방식과는 무엇이 다를까?

같은 GitHub Pages 배포를 예로 들면 차이가 더 잘 보인다.

### Worktree 방식

`gh-pages` Branch를 별도 Working Tree로 checkout한다.

```text
projects/
├── blog/
│   └── main
│
└── blog-pages/
    └── gh-pages
```

빌드한다.

```text
blog/
└── dist/
```

그리고 결과물을:

```text
blog-pages/
```

로 복사한다.

그다음:

```bash
git add .
git commit
git push
```

한다.

즉:

```text
main Working Tree
       │
       │ build
       ▼
     dist/
       │
       │ 파일 복사
       ▼
gh-pages Working Tree
       │
       ▼
    commit/push
```

이다.

---

### Subtree 방식

별도 Working Tree를 만들지 않는다.

```text
blog/
├── src/
└── dist/
```

현재 Repository의 `dist/`만:

```bash
git subtree push --prefix dist origin gh-pages
```

로 보낸다.

```text
현재 Repository
      │
      │ dist/만 분리
      ▼
 gh-pages Branch
```

즉 두 방식의 차이는:

```text
worktree
→ gh-pages Branch를 별도 폴더에 직접 checkout

subtree
→ 현재 Repository의 특정 폴더를 떼어서 gh-pages로 Push
```

이다.

---

## Subtree와 Submodule은 무엇이 다를까?

Git Subtree를 공부하면 거의 반드시 `git submodule`도 같이 등장한다.

둘 다:

> 다른 Repository의 코드를 현재 Repository 안에서 사용

할 수 있기 때문이다.

하지만 방식이 꽤 다르다.

예를 들어 외부 라이브러리 Repository가 있다고 하자.

```text
shared-library
```

이걸 현재 프로젝트의:

```text
libs/shared/
```

에 넣고 싶다.

---

### Submodule

Submodule 방식에서는 부모 Repository가 외부 Repository의 특정 Commit을 가리킨다.

```text
my-project/
├── src/
└── libs/
    └── shared/
        → 별도의 Git Repository
```

즉 Repository 안에 또 다른 Repository가 들어간 형태다.

부모 Repository는:

> shared-library의 이 Commit을 사용한다.

라는 참조를 저장한다.

그래서 clone 후:

```bash
git submodule update --init
```

같은 추가 작업이 필요할 수 있다.

---

### Subtree

Subtree는 외부 Repository의 내용을 현재 Repository 안에 **실제 파일로 포함**한다.

```text
my-project/
├── src/
└── libs/
    └── shared/
        ├── file1
        ├── file2
        └── ...
```

일반 사용자는 이 Repository를 clone하면 파일이 이미 들어 있다.

별도의 Submodule 초기화가 필요하지 않다.

단순하게 비교하면:

```text
Submodule
→ 다른 Repository를 참조

Subtree
→ 다른 Repository의 내용을 현재 Repository에 포함
```

라고 볼 수 있다.

---

## 외부 Repository를 Subtree로 추가하기

Subtree는 배포뿐 아니라 다른 Repository의 코드를 가져오는 데도 사용할 수 있다.

예를 들어:

```text
https://example.com/shared-library.git
```

이라는 Repository를:

```text
libs/shared
```

에 넣고 싶다고 하자.

Remote를 추가한다.

```bash
git remote add shared https://example.com/shared-library.git
```

그리고:

```bash
git subtree add \
    --prefix libs/shared \
    shared main \
    --squash
```

를 사용할 수 있다.

결과:

```text
my-project/
├── src/
└── libs/
    └── shared/
        ├── ...
        └── ...
```

가 된다.

`shared` Repository의 내용을 현재 Repository의 `libs/shared/`에 포함시킨 것이다.

---

## `--squash`는 무엇인가?

Subtree 명령에서 자주 등장하는 옵션이:

```text
--squash
```

다.

외부 Repository에 Commit이 수백 개 있다고 해보자.

그 History를 모두 현재 Repository에 가져오면 History가 상당히 복잡해질 수 있다.

`--squash`를 사용하면 외부 Repository의 여러 Commit을 현재 Repository에서는 하나의 통합된 Commit처럼 가져올 수 있다.

개념적으로:

```text
외부 Repository

A → B → C → D → E
```

를:

```text
현재 Repository

X → Y → [shared subtree update]
```

처럼 가져오는 방식이다.

History를 단순하게 유지하고 싶을 때 유용하다.

다만 원본 Repository의 세부 Commit History를 그대로 보존하고 싶다면 `--squash`를 사용하지 않을 수도 있다.

---

## Subtree 변경 사항 가져오기

외부 Repository가 업데이트됐다고 하자.

```text
shared repository
A → B → C
```

현재 프로젝트는 B까지 가져온 상태다.

새로운 변경 C를 가져오려면:

```bash
git subtree pull \
    --prefix libs/shared \
    shared main \
    --squash
```

를 사용할 수 있다.

즉:

```text
외부 Repository
       │
       │ subtree pull
       ▼
libs/shared/
```

방향으로 변경을 가져온다.

---

## Subtree 변경 사항 보내기

반대로 현재 프로젝트의 Subtree 디렉터리를 수정했다고 해보자.

```text
my-project/
└── libs/shared/
        ↓ 수정
```

이 변경을 원래 Repository로 보내고 싶다면:

```bash
git subtree push \
    --prefix libs/shared \
    shared main
```

처럼 사용할 수 있다.

즉:

```text
libs/shared/
      │
      │ subtree push
      ▼
shared Repository
```

가 된다.

그래서 Subtree는 경우에 따라 **양방향 관리**도 가능하다.

---

## Subtree에서 중요한 점: 디렉터리가 특별해지는 것은 아니다

Subtree로 가져온:

```text
libs/shared/
```

디렉터리를 열어보면 `.git`이 따로 있는 것이 아니다.

```text
my-project/
├── .git/
├── src/
└── libs/
    └── shared/
```

전체가 하나의 Repository다.

즉 Git 입장에서 `libs/shared`는 일반적인 디렉터리와 크게 다르지 않다.

이게 Submodule과 큰 차이다.

```text
Submodule

Parent Repo
└── Child Repo
    └── .git 관련 정보
```

와 달리:

```text
Subtree

Single Repo
└── ordinary directory
```

에 가깝다.

---

## Subtree의 장점

Subtree의 가장 큰 장점은 **사용자가 Repository를 clone했을 때 추가 작업이 거의 필요하지 않다는 것**이다.

```bash
git clone ...
```

하면 Subtree의 파일들도 같이 들어온다.

Submodule처럼:

```bash
git submodule init
git submodule update
```

를 별도로 수행할 필요가 없다.

또한 외부 Repository의 코드를:

```text
vendor/
libs/
docs/
```

같은 특정 디렉터리에 자연스럽게 포함시킬 수 있다.

특정 디렉터리만 다른 Branch에 배포하는 용도로도 사용할 수 있다.

---

## Subtree의 단점

반면 단점도 있다.

Subtree 명령 자체가 일반적인 Git 명령보다 익숙하지 않다.

예를 들어:

```bash
git subtree pull ...
git subtree push ...
git subtree split ...
```

등을 별도로 알아야 한다.

또 외부 Repository와 변경을 자주 양방향으로 주고받는 프로젝트라면 History 관리가 복잡해질 수 있다.

그래서:

```text
외부 Repository를 강하게 독립적으로 유지
```

해야 한다면 Submodule이 더 자연스러운 경우도 있고,

```text
외부 코드를 그냥 프로젝트 안에 포함해서 편하게 사용
```

하고 싶다면 Subtree가 더 편할 수 있다.

---

## Worktree / Subtree / Submodule 비교

세 개를 함께 보면 차이가 훨씬 명확하다.

| 기능              | 목적                                          |
| --------------- | ------------------------------------------- |
| `git worktree`  | 같은 Repository의 여러 Branch를 여러 작업 폴더에서 동시에 사용 |
| `git subtree`   | 특정 디렉터리를 다른 Repository/Branch와 연결해서 관리      |
| `git submodule` | 다른 Repository를 현재 Repository가 참조하도록 포함      |

구조적으로 보면:

### Worktree

```text
         Repository
        /          \
       ↓            ↓
Working Tree   Working Tree
    main          feature
```

### Subtree

```text
Repository
├── src/
└── shared/
      ↑
      │
Other Repository
```

### Submodule

```text
Parent Repository
└── shared/
      │
      └── Separate Repository
```

---

## `git subtree push --prefix book origin gh-pages` 다시 읽기

이제 처음 봤던 명령을 다시 보자.

```bash
git subtree push --prefix book origin gh-pages
```

각 부분을 해석하면:

```text
git subtree push
→ Subtree 영역을 다른 Branch/Repository에 Push

--prefix book
→ 현재 Repository의 book/ 디렉터리를 대상으로 사용

origin
→ 대상 Remote

gh-pages
→ 대상 Branch
```

따라서 전체 의미는:

> **현재 Repository의 `book/` 디렉터리 History를 분리해서 `origin/gh-pages` Branch로 Push한다.**

이다.

그 결과:

```text
main

project/
├── src/
└── book/
    ├── index.html
    └── chapter.html

        ↓ subtree push

gh-pages

├── index.html
└── chapter.html
```

이 된다.

따라서 이 명령은 `git worktree`를 사용하는 것이 아니다.

별도의 `gh-pages` Working Tree를 만들지 않고, 현재 Repository의 특정 디렉터리를 Branch로 분리해서 Push하는 방식이다.

---

## 현재 GitHub Pages에서는 꼭 필요할까?

예전에는 다음과 같은 방식이 흔했다.

```text
source
  ↓
build
  ↓
dist/
  ↓
git subtree push
  ↓
gh-pages
  ↓
GitHub Pages
```

하지만 GitHub Actions 기반 Pages 배포에서는:

```text
main
 ↓
GitHub Actions
 ↓
build
 ↓
Artifact
 ↓
GitHub Pages
```

처럼 빌드 결과를 Branch에 저장하지 않고 바로 배포할 수도 있다.

이 경우 GitHub Pages 배포만을 위해 `git subtree`를 사용할 필요는 줄어든다.

그렇다고 Subtree 자체가 불필요해진 것은 아니다.

다른 Repository의 코드를 현재 Repository 안에 포함하거나, 특정 디렉터리의 History를 별도로 관리해야 할 때는 여전히 사용할 수 있다.

---

## 직접 해볼 작은 실험

간단한 테스트 Repository를 만든다.

```text
project/
├── README.md
└── book/
    ├── index.md
    └── chapter1.md
```

몇 번 Commit을 만든 뒤:

```bash
git subtree split --prefix book
```

을 실행해본다.

Commit ID 하나가 출력된다.

그 Commit의 내용을:

```bash
git ls-tree -r <commit-id>
```

로 확인한다.

원래 Repository에서는:

```text
README.md
book/index.md
book/chapter1.md
```

였지만 Split된 Commit에서는:

```text
index.md
chapter1.md
```

만 존재하는 것을 볼 수 있다.

즉:

```text
book/
```

가 새로운 History에서는 **Root Directory가 된 것**이다.

이 실험을 하면 Subtree가 단순한 파일 복사가 아니라:

> 특정 하위 디렉터리를 하나의 독립된 Git History처럼 다시 바라보는 기능

이라는 것을 이해하기 쉬워진다.

---

## 정리

`git subtree`는:

> **Repository의 특정 하위 디렉터리를 별도의 Repository나 Branch와 연결해서 관리할 수 있게 해주는 Git 기능**

이다.

대표적으로:

```bash
git subtree push --prefix book origin gh-pages
```

는:

```text
현재 Repository
└── book/
      │
      │ subtree
      ▼
origin/gh-pages
```

처럼 `book/` 부분만 별도의 Branch로 보낼 수 있다.

반면 `git worktree`는:

```text
Repository
├── Working Tree A
└── Working Tree B
```

처럼 **작업 공간을 여러 개 만드는 기능**이다.

따라서 둘의 차이를 한 문장으로 정리하면:

> **Worktree는 브랜치를 다른 폴더에 펼치는 기능이고, Subtree는 저장소의 한 폴더를 떼어서 다른 Repository나 Branch와 관리하는 기능이다.**

지금까지의 내용을 모두 연결하면 Git을 다음과 같은 여러 층으로 나누어 볼 수 있다.

```text
Git 저장 객체

Commit
  ↓
Tree
  ↓
Blob


Git 작업 상태

HEAD
Index
Working Tree


Git 활용 기능

git worktree
git subtree
```

`Commit → Tree → Blob`은 Git이 **어떻게 데이터를 저장하는가**를 설명하고,

`HEAD → Index → Working Tree`는 Git이 **현재 작업 상태를 어떻게 관리하는가**를 설명한다.

그리고:

```text
git worktree
git subtree
```

는 그 Git 구조를 이용해서 실제 개발 과정의 문제를 해결하는 기능들이다.

이렇게 연결해서 보면 `worktree`와 `subtree`가 단순히 외워야 하는 Git 명령이 아니라, 앞에서 살펴본 Git 내부 구조 위에 만들어진 기능이라는 점이 보이기 시작한다.
