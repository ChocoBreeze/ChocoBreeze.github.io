---
title: "Git 작업 복구하기: git reflog 정리"
slug: "git-reflog-command-guide"
description: "git reflog로 HEAD 이동 기록을 확인하고, 실수로 사라진 커밋을 복구하는 방법을 정리합니다."
pubDate: "2026-07-05T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

`git reflog`는 Git에서 **HEAD와 브랜치가 이동한 기록을 확인하는 명령어**입니다.

조금 쉽게 말하면, 내가 Git에서 어떤 커밋으로 이동했는지, 어떤 커밋에서 reset했는지, rebase나 checkout으로 어디를 오갔는지 확인할 수 있는 기록입니다.

작업하다 보면 다음과 같은 상황이 생길 수 있습니다.

```text
실수로 git reset --hard를 실행했다.
rebase를 잘못해서 커밋이 사라진 것처럼 보인다.
브랜치를 이동하다가 이전 커밋 위치를 잃어버렸다.
방금 전까지 있던 커밋 해시를 다시 찾고 싶다.
```

이때 사용할 수 있는 명령어가 `git reflog`입니다.

기본 사용법은 다음과 같습니다.

```bash
git reflog
```

---

## 1. `git reflog`란?

`git reflog`는 reference log의 줄임말입니다.

Git에서 reference는 브랜치나 `HEAD`처럼 특정 커밋을 가리키는 포인터를 의미합니다.

즉, `git reflog`는 `HEAD`가 어디를 가리켰는지에 대한 이동 기록을 보여줍니다.

예를 들어 커밋을 만들거나, 브랜치를 이동하거나, reset을 실행하면 `HEAD` 위치가 바뀝니다.

```text
commit
checkout
switch
reset
rebase
merge
cherry-pick
```

이런 작업들은 대부분 reflog에 기록됩니다.

그래서 `git reflog`를 보면 "내가 방금 전까지 어느 커밋에 있었는지"를 추적할 수 있습니다.

---

## 2. `git reflog`

```bash
git reflog
```

`git reflog`는 현재 저장소에서 `HEAD`가 이동한 기록을 보여줍니다.

예를 들어 다음 명령어를 실행하면:

```bash
git reflog
```

다음과 비슷한 결과가 나올 수 있습니다.

```bash
a1b2c3d HEAD@{0}: reset: moving to HEAD~1
d4e5f6g HEAD@{1}: commit: Add login validation
h7i8j9k HEAD@{2}: commit: Add login form
k1l2m3n HEAD@{3}: checkout: moving from main to feature/login
```

여기서 각 줄은 `HEAD`가 이동한 기록을 의미합니다.

가장 위에 있는 `HEAD@{0}`이 가장 최근 기록이고, 아래로 갈수록 이전 기록입니다.

```text
HEAD@{0}
→ 가장 최근 HEAD 위치

HEAD@{1}
→ 그 바로 이전 HEAD 위치

HEAD@{2}
→ 더 이전 HEAD 위치
```

### `git reflog` 출력 읽는 방법

예시를 다시 보겠습니다.

```bash
a1b2c3d HEAD@{0}: reset: moving to HEAD~1
d4e5f6g HEAD@{1}: commit: Add login validation
h7i8j9k HEAD@{2}: commit: Add login form
k1l2m3n HEAD@{3}: checkout: moving from main to feature/login
```

각 줄은 보통 다음 구조로 되어 있습니다.

```text
커밋해시 HEAD@{번호}: 어떤 작업이 있었는지
```

예를 들어:

```text
d4e5f6g HEAD@{1}: commit: Add login validation
```

이 줄은 다음 의미입니다.

```text
HEAD@{1} 시점에 HEAD는 d4e5f6g 커밋을 가리키고 있었다.
그때 Add login validation 커밋이 만들어졌다.
```

또 다른 예시입니다.

```text
a1b2c3d HEAD@{0}: reset: moving to HEAD~1
```

이 줄은 다음 의미입니다.

```text
최근에 reset을 실행해서 HEAD가 HEAD~1 위치로 이동했다.
현재 HEAD는 a1b2c3d 커밋을 가리키고 있다.
```

즉, reflog는 단순한 커밋 목록이 아니라 **HEAD가 움직인 기록**입니다.

---

## 3. `git log`와 `git reflog` 차이

`git log`와 `git reflog`는 모두 커밋 해시를 보여줄 수 있습니다.

하지만 목적이 다릅니다.

| 명령어          | 의미                        |
| ------------ | ------------------------- |
| `git log`    | 현재 브랜치의 커밋 기록을 확인         |
| `git reflog` | HEAD와 브랜치 포인터가 이동한 기록을 확인 |

예를 들어 `git reset --hard HEAD~1`을 실행하면 최신 커밋이 현재 브랜치의 `git log`에서는 보이지 않을 수 있습니다.

```bash
git log --oneline
```

하지만 `git reflog`에는 이전에 그 커밋에 있었던 기록이 남아 있을 수 있습니다.

```bash
git reflog
```

즉, `git log`에서 안 보이는 커밋도 `git reflog`에서는 찾을 수 있는 경우가 있습니다.

```text
git log
→ 현재 브랜치 기준의 기록

git reflog
→ 내가 지나온 HEAD 이동 기록
```

그래서 실수로 커밋이 사라진 것처럼 보일 때는 `git log`만 보지 말고 `git reflog`를 확인하는 것이 좋습니다.

`git reflog`는 다음 상황에서 유용합니다.

```text
reset으로 사라진 커밋을 찾고 싶을 때
rebase 전 커밋 위치로 돌아가고 싶을 때
checkout이나 switch 이전 위치를 찾고 싶을 때
이전에 있던 커밋 해시를 다시 확인하고 싶을 때
실수로 브랜치가 꼬였을 때 복구 단서를 찾고 싶을 때
```

특히 다음 명령어를 잘못 실행했을 때 자주 사용합니다.

```bash
git reset --hard HEAD~1
```

이 명령어는 최신 커밋과 작업 내용을 되돌릴 수 있기 때문에, 실수로 실행하면 커밋이 사라진 것처럼 보일 수 있습니다.

이때 `git reflog`로 이전 커밋 해시를 찾고, 다시 복구할 수 있습니다.

---

## 4. 실수로 reset한 커밋 찾기

예를 들어 다음과 같은 커밋 기록이 있었다고 해보겠습니다.

```text
A --- B --- C
          ↑
         HEAD
```

여기서 실수로 다음 명령어를 실행했습니다.

```bash
git reset --hard HEAD~1
```

그러면 현재 브랜치는 `B` 커밋으로 이동합니다.

```text
A --- B
      ↑
     HEAD
```

이제 `git log --oneline`을 보면 `C` 커밋이 보이지 않을 수 있습니다.

```bash
git log --oneline
```

하지만 `git reflog`를 실행하면 `C` 커밋에 있었던 기록을 찾을 수 있습니다.

```bash
git reflog
```

예시:

```bash
b2b2b2b HEAD@{0}: reset: moving to HEAD~1
c3c3c3c HEAD@{1}: commit: Add payment validation
b2b2b2b HEAD@{2}: commit: Add payment page
```

여기서 `c3c3c3c`가 reset 전에 있었던 커밋입니다.

이 커밋으로 돌아가고 싶다면 다음처럼 사용할 수 있습니다.

```bash
git reset --hard c3c3c3c
```

그러면 브랜치가 다시 `c3c3c3c` 커밋으로 이동합니다.

---

## 5. `reflog`로 커밋을 복구하는 기본 흐름

실수로 커밋을 잃어버린 것처럼 보일 때는 다음 흐름을 사용할 수 있습니다.

```bash
git reflog
```

출력에서 복구하고 싶은 커밋 해시를 찾습니다.

```bash
c3c3c3c HEAD@{1}: commit: Add payment validation
```

그 커밋으로 돌아갑니다.

```bash
git reset --hard c3c3c3c
```

또는 현재 작업 내용을 보존하면서 복구 브랜치를 따로 만들 수도 있습니다.

```bash
git branch recover-payment c3c3c3c
```

이렇게 하면 `c3c3c3c` 커밋을 가리키는 새 브랜치가 만들어집니다.

```bash
git switch recover-payment
```

복구할 때 바로 `reset --hard`를 하기보다, 먼저 새 브랜치를 만들어 확인하는 방식이 더 안전합니다.

```bash
git branch recover-branch <commit-hash>
git switch recover-branch
```

### `reset --hard`로 바로 복구할 때 주의점

`git reset --hard <commit-hash>`는 현재 브랜치를 해당 커밋으로 이동시키고, 작업 디렉토리도 그 커밋 상태로 맞춥니다.

```bash
git reset --hard <commit-hash>
```

그래서 현재 작업 디렉토리에 아직 커밋하지 않은 변경 사항이 있다면 사라질 수 있습니다.

복구 전에 현재 작업 상태를 먼저 확인하는 것이 좋습니다.

```bash
git status -sb
```

작업 내용이 남아 있고 보관하고 싶다면 먼저 stash를 사용할 수 있습니다.

```bash
git stash
```

그 후 복구 작업을 진행합니다.

```bash
git reflog
git reset --hard <commit-hash>
```

즉, `reflog`는 복구 단서를 찾는 명령어이고, 실제로 돌아갈 때는 `reset`, `branch`, `checkout` 같은 명령어를 함께 사용합니다.

---

## 6. 복구 브랜치를 만드는 방식

실수 복구 상황에서는 바로 현재 브랜치를 이동시키는 것보다, 먼저 복구 브랜치를 만드는 방식이 안전할 때가 많습니다.

예를 들어 `git reflog`에서 다음 커밋을 찾았다고 해보겠습니다.

```bash
c3c3c3c HEAD@{1}: commit: Add payment validation
```

이 커밋을 기준으로 새 브랜치를 만들 수 있습니다.

```bash
git branch recover-payment c3c3c3c
```

그리고 해당 브랜치로 이동합니다.

```bash
git switch recover-payment
```

이렇게 하면 원래 브랜치를 바로 건드리지 않고, 복구할 커밋이 맞는지 확인할 수 있습니다.

```bash
git log --oneline
```

확인 후 필요한 커밋만 가져오거나, 브랜치를 정리하면 됩니다.

이 방식은 특히 확신이 없을 때 안전합니다.

---

## 7. `HEAD@{n}`을 직접 사용할 수도 있다

`git reflog`에는 `HEAD@{0}`, `HEAD@{1}` 같은 표현이 나옵니다.

이 표현을 커밋 해시처럼 사용할 수도 있습니다.

예를 들어 다음 기록이 있다고 해보겠습니다.

```bash
a1b2c3d HEAD@{0}: reset: moving to HEAD~1
d4e5f6g HEAD@{1}: commit: Add login validation
```

여기서 `HEAD@{1}` 위치로 돌아가고 싶다면 다음처럼 사용할 수 있습니다.

```bash
git reset --hard HEAD@{1}
```

다만 처음에는 커밋 해시를 직접 사용하는 방식이 더 명확합니다.

```bash
git reset --hard d4e5f6g
```

그래서 처음에는 다음 흐름으로 기억하면 좋습니다.

```bash
git reflog
# 복구할 커밋 해시 확인
git reset --hard <commit-hash>
```

---

## 8. rebase 전 상태로 돌아가고 싶을 때

`git reflog`는 rebase를 잘못했을 때도 유용합니다.

예를 들어 다음 명령어를 실행했다고 해보겠습니다.

```bash
git rebase main
```

그런데 rebase 후 커밋 흐름이 예상과 다르게 바뀌었다면, rebase 전 위치를 찾고 싶을 수 있습니다.

이때 `git reflog`를 확인합니다.

```bash
git reflog
```

예시:

```bash
f1f1f1f HEAD@{0}: rebase finished: returning to refs/heads/feature/login
c3c3c3c HEAD@{1}: rebase: Add login validation
b2b2b2b HEAD@{2}: rebase: Add login form
a9a9a9a HEAD@{3}: rebase started: checkout main
d4e5f6g HEAD@{4}: commit: Add login validation
```

여기서 rebase 전 커밋이 `d4e5f6g`라면 다음처럼 복구할 수 있습니다.

```bash
git reset --hard d4e5f6g
```

또는 복구 브랜치를 먼저 만들 수도 있습니다.

```bash
git branch before-rebase d4e5f6g
git switch before-rebase
```

---

## 9. `git reflog`가 항상 모든 것을 복구해줄까?

`git reflog`는 매우 유용하지만, 모든 상황을 영원히 복구해주는 것은 아닙니다.

reflog 기록은 일정 기간이 지나면 정리될 수 있습니다.

또한 Git 객체가 실제로 정리되어 사라진 경우에는 복구가 어려울 수 있습니다.

그래서 중요한 작업은 reflog에만 의존하기보다, 적절한 시점에 커밋하거나 원격 저장소에 push해두는 것이 좋습니다.

```bash
git add .
git commit -m "작업 내용 저장"
git push
```

즉, `git reflog`는 실수했을 때 큰 도움이 되는 복구 도구이지만, 백업을 대신하는 기능은 아닙니다.

---

## 10. 자주 쓰는 흐름

실수로 reset한 커밋을 찾을 때:

```bash
git reflog
```

복구할 커밋 해시를 확인한 뒤, 새 브랜치를 만들 때:

```bash
git branch recover-branch <commit-hash>
git switch recover-branch
```

현재 브랜치를 해당 커밋으로 되돌릴 때:

```bash
git reset --hard <commit-hash>
```

복구 전에 현재 작업 상태를 확인할 때:

```bash
git status -sb
```

작업 내용을 임시 저장한 뒤 복구할 때:

```bash
git stash
git reflog
git reset --hard <commit-hash>
```

---

## 11. 명령어 정리

| 명령어                                      | 의미                      |
| ---------------------------------------- | ----------------------- |
| `git reflog`                             | HEAD와 브랜치 포인터의 이동 기록 확인 |
| `git reset --hard <commit-hash>`         | 현재 브랜치를 특정 커밋으로 되돌림     |
| `git branch <branch-name> <commit-hash>` | 특정 커밋을 기준으로 새 브랜치 생성    |
| `git switch <branch-name>`               | 해당 브랜치로 이동              |
| `git status -sb`                         | 현재 작업 상태 확인             |

```text
git reflog
→ 내가 지나온 HEAD 이동 기록을 확인한다.

git reset --hard <commit-hash>
→ 특정 커밋으로 현재 브랜치를 되돌린다.

git branch recover <commit-hash>
→ 복구할 커밋을 기준으로 새 브랜치를 만든다.
```

---

## 12. 자주 헷갈리는 상황

### `git reflog`는 커밋 기록인가?

정확히는 일반적인 커밋 기록이라기보다, `HEAD`와 브랜치 포인터가 이동한 기록입니다.

커밋 기록을 보려면 보통 다음 명령어를 사용합니다.

```bash
git log
```

반면 이동 기록을 보려면 다음 명령어를 사용합니다.

```bash
git reflog
```

### `git log`에서 안 보이는 커밋도 `git reflog`에서 보일 수 있나?

네, 가능합니다.

예를 들어 `reset`으로 현재 브랜치에서 빠진 커밋은 `git log`에서 보이지 않을 수 있습니다.

하지만 최근에 그 커밋을 가리키고 있었다면 `git reflog`에서 찾을 수 있습니다.

```bash
git reflog
```

### 복구할 때 꼭 `reset --hard`를 써야 할까?

아닙니다.

`reset --hard`는 강력하지만 작업 내용이 사라질 수 있습니다.

확신이 없다면 먼저 복구 브랜치를 만드는 방식이 안전합니다.

```bash
git branch recover-branch <commit-hash>
git switch recover-branch
```

이렇게 하면 원래 브랜치를 바로 건드리지 않고 복구할 커밋을 확인할 수 있습니다.

### `git reflog`만 실행하면 자동으로 복구될까?

아닙니다.

`git reflog`는 복구할 수 있는 단서를 보여주는 명령어입니다.

실제로 특정 커밋으로 돌아가려면 `git reset`, `git branch`, `git switch` 같은 명령어를 함께 사용해야 합니다.

---

## 마무리 정리

`git reflog`는 Git에서 `HEAD`와 브랜치 포인터가 이동한 기록을 확인하는 명령어입니다.

실수로 `reset`, `rebase`, `switch`, `checkout` 등을 실행해서 커밋이 사라진 것처럼 보일 때, `git reflog`를 통해 이전 커밋 해시를 찾을 수 있습니다.

복구할 커밋을 찾은 뒤에는 `git reset --hard <commit-hash>`로 현재 브랜치를 되돌릴 수 있고, 더 안전하게는 `git branch <branch-name> <commit-hash>`로 복구 브랜치를 먼저 만들 수도 있습니다.

다만 `git reflog`는 영구적인 백업 기능은 아니므로, 중요한 작업은 적절히 커밋하고 원격 저장소에 push해두는 것이 좋습니다.

한 문장으로 정리하면 다음과 같습니다.

> `git reflog`는 HEAD가 이동한 기록을 확인해, reset이나 rebase 등으로 사라진 것처럼 보이는 커밋을 다시 찾을 때 사용하는 복구용 명령어이다.
