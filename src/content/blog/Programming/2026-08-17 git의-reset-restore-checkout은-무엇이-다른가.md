---
title: "Git의 reset / restore / checkout은 무엇이 다른가"
description: "HEAD·Index·Working Tree 세 영역을 기준으로 git reset, restore, checkout이 각각 무엇을 바꾸는지 비교합니다."
pubDate: "2026-08-17T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "Version Control", "Developer Tools"]
slug: "git-internals-reset-restore-checkout"
---

Git을 사용하다 보면 다음 명령들을 자주 접한다.

```bash
git reset
git restore
git checkout
```

셋 다 뭔가를 "되돌리거나 바꾸는" 명령처럼 보이기 때문에 처음에는 상당히 헷갈린다.

하지만 앞에서 살펴본 다음 세 영역을 기준으로 보면 차이가 명확해진다.

```text
HEAD
→ 현재 기준이 되는 Commit

Index
→ 다음 Commit으로 만들 상태

Working Tree
→ 현재 디스크에서 직접 수정하고 있는 상태
```

핵심은 이 질문이다.

> 이 명령은 HEAD, Index, Working Tree 중 어디를 바꾸는가?

이 관점으로 보면 `reset`, `restore`, `checkout`을 외우지 않고 이해할 수 있다.

---

## 먼저 전체 그림부터 보기

가장 단순하게 정리하면 다음과 같다.

```text
git restore
→ 파일 상태를 복원
→ 주로 Index / Working Tree를 다룸

git reset
→ HEAD를 이동하고,
  옵션에 따라 Index / Working Tree도 함께 변경

git checkout
→ 오래된 다목적 명령
→ Branch 이동과 파일 복원을 모두 담당
```

현재 Git에서는 역할을 좀 더 명확하게 나누기 위해:

```text
checkout의 Branch 이동 역할
→ git switch

checkout의 파일 복원 역할
→ git restore
```

로 분리해서 사용하는 경우가 많다.

즉 현대적인 관점에서는:

```text
git switch
git restore
```

를 우선적으로 이해하고,

`git checkout`은 기존 명령과 과거 코드베이스를 읽기 위해 이해하는 것이 좋다.

---

## git restore

`git restore`는 이름 그대로:

> 파일 상태를 다른 Git 상태에서 가져와 복원하는 명령

이다.

주로 Working Tree 또는 Index를 바꾼다.

---

### Working Tree의 수정 내용을 버리기

현재 상태가 다음과 같다고 하자.

```text
HEAD          A
Index         A
Working Tree  B
```

즉 마지막 Commit과 Index는 같은데 Working Tree에서만 파일을 수정했다.

이때:

```bash
git restore main.cpp
```

를 실행하면 기본적으로 Index의 상태를 Working Tree로 복사한다.

```text
Before

HEAD          A
Index         A
Working Tree  B
```

```text
git restore main.cpp
```

```text
After

HEAD          A
Index         A
Working Tree  A
```

즉:

```text
Index
  ↓
Working Tree
```

방향으로 복원한 것이다.

중요한 점은 Working Tree의 수정 내용 `B`가 사라진다는 것이다.

따라서 아직 저장하지 않은 작업이라면 주의해야 한다.

---

## git restore --staged

이번에는 Stage에 올린 파일을 다시 Stage에서 빼고 싶다고 하자.

상태:

```text
HEAD          A
Index         B
Working Tree  B
```

이때:

```bash
git restore --staged main.cpp
```

를 실행한다.

그러면 Index가 HEAD의 상태로 돌아간다.

```text
HEAD
  ↓
Index
```

결과:

```text
HEAD          A
Index         A
Working Tree  B
```

즉 파일 수정 내용 `B`는 Working Tree에 그대로 남아 있다.

단지:

> 다음 Commit에 포함할 상태에서 제외한 것

이다.

그래서 `git add`를 취소하고 싶을 때 매우 유용하다.

---

## git restore의 핵심

정리하면:

```text
git restore file
→ Index → Working Tree

git restore --staged file
→ HEAD → Index
```

라고 볼 수 있다.

조금 더 일반적으로는 `--source`를 이용해서 특정 Commit의 파일을 가져올 수도 있다.

예를 들어:

```bash
git restore --source=HEAD~1 main.cpp
```

는 이전 Commit의 `main.cpp` 내용을 Working Tree에 가져온다.

---

## git reset

`git reset`은 `restore`보다 더 강력하다.

왜냐하면 `reset`의 핵심은:

> **HEAD가 가리키는 Commit을 변경하는 것**

이기 때문이다.

그리고 옵션에 따라 Index와 Working Tree도 같이 변경할 수 있다.

가장 많이 보는 세 옵션은:

```text
--soft
--mixed
--hard
```

다.

이 셋의 차이는:

> HEAD만 바꿀 것인가,
> Index까지 바꿀 것인가,
> Working Tree까지 바꿀 것인가

이다.

---

## git reset --soft

현재 Commit History가 다음과 같다고 하자.

```text
A ← B ← C
        ↑
       main
        ↑
       HEAD
```

여기서:

```bash
git reset --soft HEAD~1
```

을 실행한다.

그러면 HEAD와 Branch가 B로 이동한다.

```text
A ← B ← C
    ↑
   main
    ↑
   HEAD
```

하지만 Index와 Working Tree는 그대로 유지된다.

즉 Commit C에 들어 있던 변경사항은 Stage된 상태로 남는다.

개념적으로:

```text
Before

HEAD          C
Index         C
Working Tree  C
```

```text
git reset --soft HEAD~1
```

```text
After

HEAD          B
Index         C
Working Tree  C
```

이다.

따라서:

> 마지막 Commit은 취소하고 싶지만, 변경사항은 Stage 상태로 그대로 두고 싶다.

는 상황에 적합하다.

---

## git reset --mixed

`--mixed`는 기본값이다.

즉:

```bash
git reset HEAD~1
```

은 사실상:

```bash
git reset --mixed HEAD~1
```

과 같다.

이 경우 HEAD와 Index가 변경된다.

Working Tree는 그대로 유지된다.

```text
Before

HEAD          C
Index         C
Working Tree  C
```

```text
git reset --mixed HEAD~1
```

```text
After

HEAD          B
Index         B
Working Tree  C
```

즉 Commit C는 사라졌지만 해당 변경 내용은 Working Tree에 남는다.

Stage는 해제된다.

따라서:

> 마지막 Commit도 취소하고 Stage도 풀고 싶지만, 코드 수정 내용은 남겨두고 싶다.

는 상황에 사용할 수 있다.

---

## git reset --hard

가장 조심해야 하는 옵션이다.

```bash
git reset --hard HEAD~1
```

은:

```text
HEAD
Index
Working Tree
```

를 모두 대상 Commit으로 맞춘다.

```text
Before

HEAD          C
Index         C
Working Tree  C
```

```text
git reset --hard HEAD~1
```

```text
After

HEAD          B
Index         B
Working Tree  B
```

즉 Commit C의 변경뿐 아니라 현재 Working Tree의 수정 내용까지 사라질 수 있다.

그래서 `--hard`는:

> 지금 작업 중인 내용이 정말 없어져도 되는지

확인하고 사용해야 한다.

---

## reset 세 옵션 비교

세 옵션의 차이를 표처럼 보면 다음과 같다.

```text
              HEAD    Index    Working Tree

--soft         변경     유지        유지

--mixed        변경     변경        유지

--hard         변경     변경        변경
```

즉 범위가 점점 넓어진다.

```text
soft
HEAD

mixed
HEAD + Index

hard
HEAD + Index + Working Tree
```

라고 기억하면 된다.

---

## reset은 왜 강력한가?

`restore`는 주로 파일 상태를 복원한다.

반면 `reset`은 Branch의 Commit 위치 자체를 변경할 수 있다.

예를 들어:

```text
A ← B ← C ← D
            ↑
           main
```

에서:

```bash
git reset --hard B
```

를 실행하면:

```text
A ← B ← C ← D
    ↑
   main
```

처럼 `main` Branch가 B를 가리키도록 이동할 수 있다.

즉:

```text
Branch
 ↓
Commit
```

이라는 참조 자체가 움직인다.

이것이 `reset`이 단순 파일 복원보다 더 강력한 이유다.

---

## 이미 Push한 Commit에 reset을 조심해야 하는 이유

예를 들어 Remote에 이미:

```text
A ← B ← C
```

까지 Push했다고 하자.

그런데 Local에서:

```bash
git reset --hard B
```

를 실행하면 Local History는:

```text
A ← B
```

처럼 보이게 된다.

하지만 Remote에는 아직 C가 있다.

이 상태에서 강제로 Push하면 공유 History를 다시 작성할 수 있다.

즉 다른 개발자의 History와 충돌할 수 있다.

그래서 일반적으로:

> 이미 공유된 Commit을 취소해야 한다면 reset보다 revert가 더 안전한 경우가 많다.

`git revert`는 과거 Commit을 없애는 것이 아니라 반대 변경을 가진 새로운 Commit을 추가한다.

```text
A ← B ← C ← Revert C
```

따라서 기존 History를 유지한다.

---

## git checkout

`git checkout`은 Git의 오래된 다목적 명령이다.

이 명령은 크게 두 가지 서로 다른 역할을 담당한다.

```text
1. Branch 또는 Commit으로 이동
2. 파일 내용을 복원
```

이 두 역할이 하나의 명령에 섞여 있기 때문에 헷갈리기 쉽다.

그래서 현대 Git에서는 각각:

```text
Branch 이동
→ git switch

파일 복원
→ git restore
```

로 나누어 사용할 수 있게 되었다.

---

## Branch를 checkout

예전에는 Branch를 이동할 때:

```bash
git checkout feature
```

를 사용했다.

이 명령은:

```text
HEAD
 ↓
main
```

을:

```text
HEAD
 ↓
feature
```

로 변경하고,

해당 Commit 상태에 맞춰 Index와 Working Tree도 갱신한다.

즉 개념적으로:

```text
feature Commit
      ↓
    Index
      ↓
Working Tree
```

로 파일 상태도 바뀐다.

현재는 같은 목적에:

```bash
git switch feature
```

를 사용하는 것이 더 의도가 명확하다.

---

## 새로운 Branch 생성과 checkout

예전에는:

```bash
git checkout -b feature/login
```

처럼 사용했다.

이는:

```text
새 Branch 생성
+
해당 Branch로 이동
```

을 한 번에 수행한다.

현재는:

```bash
git switch -c feature/login
```

처럼 사용할 수 있다.

---

## 특정 파일을 checkout

`checkout`은 파일 복원도 할 수 있다.

예를 들어:

```bash
git checkout -- main.cpp
```

는 현재 Branch 기준의 파일 상태를 Working Tree로 가져오는 오래된 방식이다.

현재는:

```bash
git restore main.cpp
```

가 더 명확하다.

즉:

```text
git checkout -- file
```

의 역할을:

```text
git restore file
```

가 대신할 수 있다.

---

## 왜 checkout이 헷갈렸을까?

다음 두 명령을 보자.

```bash
git checkout feature
```

```bash
git checkout -- main.cpp
```

첫 번째는 Branch 이동이다.

두 번째는 파일 복원이다.

같은 `checkout`인데 전혀 다른 역할이다.

이 때문에 Git은 Git 2.23부터 역할을 분리한:

```text
git switch
git restore
```

를 제공하기 시작했다.

개념적으로:

```text
              git checkout
                 /    \
                /      \
               ▼        ▼
        git switch   git restore
        Branch 이동    파일 복원
```

이라고 이해하면 된다.

---

## checkout과 Detached HEAD

특정 Commit으로 직접 이동할 수도 있다.

예를 들어:

```bash
git checkout abc123
```

또는 현대 방식으로:

```bash
git switch --detach abc123
```

를 실행하면:

```text
HEAD
 ↓
Commit abc123
```

처럼 HEAD가 Branch가 아니라 Commit을 직접 가리킨다.

이를 **Detached HEAD** 상태라고 한다.

이 상태에서도 수정과 Commit은 가능하지만 Branch에 연결되지 않은 Commit이 만들어질 수 있기 때문에 주의해야 한다.

필요하다면:

```bash
git switch -c new-branch
```

로 새로운 Branch를 만들면 된다.

---

## restore와 reset의 차이

둘 다 복원처럼 보이지만 출발점이 다르다.

`restore`는 주로:

> 파일 상태를 어디에서 가져와 Working Tree 또는 Index에 복원할까?

라는 명령이다.

```text
HEAD / Commit / Index
        ↓
Working Tree 또는 Index
```

반면 `reset`은:

> 현재 Branch와 HEAD를 어느 Commit으로 이동할까?

가 핵심이다.

```text
Branch / HEAD
      ↓
새 Commit 위치
```

그리고 옵션에 따라 Index와 Working Tree까지 맞춘다.

따라서:

```text
restore
→ 파일 중심

reset
→ Commit / Branch 상태 중심
```

이라고 구분하면 이해하기 쉽다.

---

## checkout과 restore의 차이

예전의:

```bash
git checkout -- file
```

은 현재의:

```bash
git restore file
```

와 비슷한 역할을 한다.

하지만 `checkout`은 Branch 이동 역할까지 함께 가지고 있다.

그래서 새 코드나 새로운 학습에서는:

```text
Branch 변경
→ switch

파일 복원
→ restore
```

로 목적을 분리해 사용하는 것이 이해하기 쉽다.

---

## HEAD / Index / Working Tree로 전체 비교

현재 다음 상태를 생각해보자.

```text
HEAD          A
Index         B
Working Tree  C
```

이 상황에서 각 명령이 무엇을 만질 수 있는지 보면 차이가 잘 보인다.

### restore

```bash
git restore file
```

```text
Index B
   ↓
Working Tree B
```

결과:

```text
HEAD          A
Index         B
Working Tree  B
```

---

### restore --staged

```bash
git restore --staged file
```

```text
HEAD A
  ↓
Index A
```

결과:

```text
HEAD          A
Index         A
Working Tree  C
```

---

### reset --soft

```text
HEAD만 이동
Index 유지
Working Tree 유지
```

---

### reset --mixed

```text
HEAD 이동
Index도 맞춤
Working Tree 유지
```

---

### reset --hard

```text
HEAD 이동
Index 맞춤
Working Tree도 맞춤
```

이렇게 보면 명령을 외우기보다 어느 영역이 바뀌는지 이해할 수 있다.

---

## 자주 사용하는 상황별로 보기

### 수정한 파일을 그냥 버리고 싶다

```bash
git restore main.cpp
```

Working Tree 수정 내용을 버린다.

---

### git add를 취소하고 싶다

```bash
git restore --staged main.cpp
```

Working Tree 수정은 유지하면서 Stage만 해제한다.

---

### 마지막 Commit만 취소하고 Stage는 유지하고 싶다

```bash
git reset --soft HEAD~1
```

---

### 마지막 Commit과 Stage를 취소하되 수정한 코드는 유지하고 싶다

```bash
git reset HEAD~1
```

또는:

```bash
git reset --mixed HEAD~1
```

---

### Commit과 현재 수정 내용까지 전부 버리고 싶다

```bash
git reset --hard <commit>
```

주의해서 사용해야 한다.

---

### 다른 Branch로 이동하고 싶다

현재 권장 방식:

```bash
git switch feature
```

기존 방식:

```bash
git checkout feature
```

---

### 과거 Commit의 파일 하나만 가져오고 싶다

```bash
git restore --source=<commit> main.cpp
```

기존 방식으로는:

```bash
git checkout <commit> -- main.cpp
```

같은 형태를 볼 수 있다.

---

## reset과 revert를 혼동하지 말자

둘은 특히 중요하게 구분해야 한다.

`reset`:

```text
A ← B ← C
        ↑
       main
```

에서 B로 이동하면:

```text
A ← B
    ↑
   main
```

처럼 Branch의 History 위치를 뒤로 이동시킨다.

반면 `revert`는:

```text
A ← B ← C ← D
```

에서 C의 변경을 취소하는 새로운 Commit을 만든다.

```text
A ← B ← C ← D ← Revert C
```

History를 다시 쓰지 않는다.

그래서 공유된 Branch에서는 `revert`가 더 안전한 경우가 많다.

---

## 직접 해볼 작은 실험

테스트 Repository를 하나 만든다.

먼저 파일을 작성한다.

```text
value.txt

10
```

Commit한다.

```bash
git add value.txt
git commit -m "value 10"
```

다시:

```text
20
```

으로 수정한 뒤 Commit한다.

```bash
git add value.txt
git commit -m "value 20"
```

이제:

```bash
git log --oneline
```

을 확인한다.

현재 상태를:

```text
Commit A
value = 10

Commit B
value = 20
```

이라고 하자.

먼저:

```bash
git reset --soft HEAD~1
```

을 실행하고:

```bash
git status
```

를 확인한다.

`20` 변경이 Stage 상태로 남는 것을 볼 수 있다.

다시 원래 상태로 되돌리기 위해 Stage된 변경을 그대로 Commit한다.

```bash
git commit -m "value 20"
```

그리고 이번에는:

```bash
git reset --mixed HEAD~1
```

을 실행하면 수정 내용은 Working Tree에 남지만 Stage는 해제된다.

마지막으로 다시 Commit한 뒤:

```bash
git add value.txt
git commit -m "value 20"
```

테스트용 Repository에서만:

```bash
git reset --hard HEAD~1
```

을 실행해보면 Working Tree까지 이전 Commit 상태로 돌아가는 것을 확인할 수 있다.

이 세 가지를 직접 비교하면 `soft / mixed / hard`의 차이를 가장 빠르게 이해할 수 있다.

---

## 정리

`reset`, `restore`, `checkout`은 모두 Git의 상태를 변경하지만 역할이 다르다.

### git restore

파일 중심의 명령이다.

```text
Index → Working Tree

HEAD → Index

Commit → Working Tree
```

등의 복원을 수행한다.

---

### git reset

Commit History와 HEAD를 중심으로 동작한다.

```text
--soft
HEAD

--mixed
HEAD + Index

--hard
HEAD + Index + Working Tree
```

까지 변경한다.

---

### git checkout

과거부터 존재하던 다목적 명령이다.

```text
Branch 이동
+
파일 복원
```

두 역할을 모두 가지고 있다.

현재는 역할을 분리해서:

```text
git switch
→ Branch 이동

git restore
→ 파일 복원
```

을 사용할 수 있다.

결국 가장 중요한 기준은 다시 이것이다.

```text
HEAD
Index
Working Tree
```

Git 명령을 볼 때:

> 이 명령이 세 영역 중 어디를 읽고 어디를 변경하는가?

를 생각하면 훨씬 쉽게 이해할 수 있다.

전체 흐름을 한 번 더 정리하면:

```text
                 Commit
                    ↑
                    │
                   HEAD
                    │

            ┌───────┴───────┐
            │               │
          Index       Working Tree
            │               │
            └──── git add ←─┘
```

그리고:

```text
restore
→ 주로 Index / Working Tree 복원

reset
→ HEAD 중심으로 상태 되돌리기

checkout
→ Branch 이동 + 파일 복원을 모두 담당하던 기존 명령
```

이라고 기억하면 된다.

이제 다음으로는 Repository 안에 다른 Repository를 포함시키는 방식인 `git submodule`을 살펴보면 `subtree`와의 차이까지 자연스럽게 연결할 수 있다.
