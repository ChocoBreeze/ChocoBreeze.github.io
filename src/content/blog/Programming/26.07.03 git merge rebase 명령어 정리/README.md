---
title: "Git 브랜치 합치기: git merge와 git rebase 정리"
slug: "git-merge-rebase-command-guide"
description: "git merge와 git rebase의 차이, git rebase origin/main 사용법과 각 명령어를 언제 쓰면 좋은지 정리합니다."
pubDate: "2026-07-03T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

Git에서 여러 브랜치로 작업하다 보면, 한 브랜치의 변경 사항을 다른 브랜치에 반영해야 하는 상황이 생깁니다.

예를 들어 `main` 브랜치에는 안정적인 코드가 있고, `feature/login` 브랜치에서는 로그인 기능을 개발하고 있다고 해보겠습니다.

```text
main
feature/login
```

작업이 끝나면 `feature/login` 브랜치의 변경 사항을 `main` 브랜치에 합쳐야 합니다.

이때 사용할 수 있는 대표적인 방법이 `merge`와 `rebase`입니다.

이번 글에서는 다음 명령어를 중심으로 정리합니다.

```bash
git merge <branch>
git rebase <branch>
git rebase origin/main
```

---

## 1. 브랜치를 합친다는 뜻

브랜치를 합친다는 것은 한 브랜치에서 작업한 커밋들을 다른 브랜치에 반영한다는 의미입니다.

예를 들어 다음과 같은 상황이 있다고 해보겠습니다.

```text
main 브랜치
A --- B

feature/login 브랜치
A --- B --- C --- D
```

`feature/login` 브랜치에는 `C`, `D` 커밋이 추가되어 있습니다.

이 변경 사항을 `main`에 반영하면, `main`에서도 로그인 기능 변경 내용을 사용할 수 있게 됩니다.

Git에서는 이런 작업을 할 때 대표적으로 두 가지 방식을 사용합니다.

```text
merge  → 브랜치를 병합한다.
rebase → 내 커밋을 기준 브랜치 위로 다시 올린다.
```

두 방식 모두 변경 사항을 합치는 데 사용되지만, 커밋 히스토리를 만드는 방식이 다릅니다.

---

## 2. `git merge <branch>`

```bash
git merge <branch>
```

`git merge <branch>`는 **지정한 브랜치의 변경 사항을 현재 브랜치에 병합하는 명령어**입니다.

중요한 점은 `merge`는 항상 **현재 내가 위치한 브랜치에** 다른 브랜치의 변경 사항을 가져온다는 것입니다.

예를 들어 `feature/login` 브랜치의 변경 사항을 `main` 브랜치에 합치고 싶다면, 먼저 `main` 브랜치로 이동합니다.

```bash
git switch main
```

그다음 `feature/login` 브랜치를 병합합니다.

```bash
git merge feature/login
```

이 명령어의 의미는 다음과 같습니다.

```text
현재 브랜치인 main에 feature/login 브랜치의 변경 사항을 병합한다.
```

### `git merge` 예시

다음과 같은 커밋 흐름이 있다고 해보겠습니다.

```text
main
A --- B

feature/login
A --- B --- C --- D
```

현재 `main` 브랜치에서 다음 명령어를 실행합니다.

```bash
git merge feature/login
```

그러면 `feature/login`의 `C`, `D` 커밋이 `main`에 반영됩니다.

`main`이 `feature/login`보다 뒤처져만 있었고, 중간에 따로 갈라진 커밋이 없다면 Git은 브랜치 포인터를 앞으로 이동시키는 방식으로 병합합니다.

```text
main
A --- B --- C --- D
```

이런 경우를 보통 **fast-forward merge**라고 합니다.

### 병합 커밋이 생기는 경우

실제 협업에서는 브랜치가 서로 다르게 진행되는 경우가 많습니다.

```text
main
A --- B --- E

feature/login
A --- B --- C --- D
```

`main`에는 `E` 커밋이 생겼고, `feature/login`에는 `C`, `D` 커밋이 생겼습니다.

이 상태에서 `main` 브랜치에서 다음 명령어를 실행하면:

```bash
git merge feature/login
```

Git은 두 흐름을 합치기 위해 새로운 병합 커밋을 만들 수 있습니다.

```text
A --- B --- E -------- M
       \              /
        C --- D -----
```

여기서 `M`은 merge commit입니다.

즉, `merge`는 두 브랜치의 작업 흐름을 그대로 보존하면서 합치는 방식입니다.

커밋 히스토리를 보면 "어디서 브랜치가 갈라졌고, 어디서 다시 합쳐졌는지" 확인할 수 있습니다.

### `git merge`는 언제 사용할까?

```text
기능 브랜치를 main 또는 develop에 병합할 때
브랜치가 갈라지고 합쳐진 기록을 남기고 싶을 때
협업 브랜치의 히스토리를 그대로 보존하고 싶을 때
PR 또는 MR을 통해 브랜치를 합칠 때
```

특히 협업에서는 `merge`가 많이 사용됩니다.

브랜치가 어떻게 진행되었는지 기록이 남기 때문에, 나중에 작업 흐름을 추적하기 쉽습니다.

다만 merge commit이 많아지면 히스토리가 복잡해 보일 수 있습니다.

---

## 3. `git rebase <branch>`

```bash
git rebase <branch>
```

`git rebase <branch>`는 **현재 브랜치의 커밋들을 지정한 브랜치의 최신 커밋 위로 다시 올리는 명령어**입니다.

핵심은 다음과 같습니다.

```text
내 브랜치의 시작점을 다른 브랜치의 최신 위치로 옮긴다.
```

예를 들어 현재 `feature/login` 브랜치에서 작업 중이고, `main` 브랜치의 최신 변경 사항을 내 작업 브랜치에 반영하고 싶다고 해보겠습니다.

```bash
git switch feature/login
git rebase main
```

이 명령어의 의미는 다음과 같습니다.

```text
feature/login 브랜치의 커밋들을 main 브랜치의 최신 커밋 위로 다시 올린다.
```

### `git rebase` 예시

다음과 같은 커밋 흐름이 있다고 해보겠습니다.

```text
main
A --- B --- E

feature/login
A --- B --- C --- D
```

현재 `feature/login` 브랜치에서 다음 명령어를 실행합니다.

```bash
git rebase main
```

그러면 Git은 `feature/login`의 `C`, `D` 커밋을 잠시 떼어낸 뒤, `main`의 최신 커밋 `E` 뒤에 다시 붙입니다.

```text
feature/login
A --- B --- E --- C' --- D'
```

여기서 `C'`, `D'`는 기존 `C`, `D` 커밋과 같은 변경 내용을 담고 있지만, 새 기준 위에 다시 만들어진 커밋입니다. 커밋 해시가 달라질 수 있습니다.

### `rebase`는 히스토리를 깔끔하게 만든다

`merge`를 사용하면 브랜치가 갈라지고 합쳐진 흔적이 남습니다.

```text
A --- B --- E -------- M
       \              /
        C --- D -----
```

반면 `rebase`를 사용하면 커밋 흐름이 직선처럼 정리됩니다.

```text
A --- B --- E --- C' --- D'
```

그래서 `rebase`는 히스토리를 더 깔끔하게 만들고 싶을 때 유용합니다.

### `git rebase`는 언제 사용할까?

```text
내 작업 브랜치에 최신 main 변경 사항을 반영하고 싶을 때
merge commit 없이 히스토리를 깔끔하게 유지하고 싶을 때
PR을 올리기 전에 feature 브랜치를 최신 상태로 맞추고 싶을 때
내 로컬 작업 커밋을 기준 브랜치 위로 정리하고 싶을 때
```

---

## 4. `git rebase origin/main`

```bash
git rebase origin/main
```

`git rebase origin/main`은 **현재 브랜치의 커밋들을 원격 `main` 브랜치의 최신 상태 위로 다시 올리는 명령어**입니다.

여기서 `origin/main`은 원격 저장소의 `main` 브랜치 상태를 로컬 Git이 기억하고 있는 원격 추적 브랜치입니다.

```text
main        → 내 로컬 main 브랜치
origin/main → 원격 저장소 main 브랜치의 상태
```

### `git rebase origin/main`을 사용하기 전 `fetch`가 필요한 이유

`origin/main`은 원격 저장소의 상태를 나타내지만, 자동으로 항상 최신은 아닙니다.

내 로컬 Git이 마지막으로 원격 정보를 가져온 시점의 `origin/main`일 수 있습니다.

그래서 최신 원격 main 기준으로 rebase하고 싶다면 먼저 fetch를 하는 것이 좋습니다.

```bash
git fetch origin
git rebase origin/main
```

이 흐름의 의미는 다음과 같습니다.

```text
git fetch origin
→ 원격 저장소의 최신 정보를 가져와 origin/main을 갱신

git rebase origin/main
→ 현재 브랜치의 커밋들을 최신 origin/main 위로 다시 올림
```

예를 들어 현재 `feature/login` 브랜치에서 작업 중이라면 다음 흐름을 사용할 수 있습니다.

```bash
git switch feature/login
git fetch origin
git rebase origin/main
```

### `git rebase main`과 `git rebase origin/main` 차이

| 명령어 | 기준 브랜치 |
| --- | --- |
| `git rebase main` | 로컬 `main` 브랜치 |
| `git rebase origin/main` | 원격 추적 브랜치 `origin/main` |

로컬 `main`이 최신 원격 상태를 반영하지 않은 오래된 상태라면 `git rebase main`은 오래된 기준으로 rebase할 수 있습니다.

feature 브랜치를 최신 원격 main 위로 올리고 싶다면 보통 다음 흐름이 더 명확합니다.

```bash
git fetch origin
git rebase origin/main
```

---

## 5. `merge`와 `rebase` 차이

| 구분 | `merge` | `rebase` |
| --- | --- | --- |
| 방식 | 두 브랜치의 흐름을 병합 | 내 커밋을 기준 브랜치 위로 다시 올림 |
| 히스토리 | 브랜치가 갈라지고 합쳐진 기록이 남음 | 커밋 흐름이 직선처럼 정리됨 |
| 병합 커밋 | 생길 수 있음 | 보통 생기지 않음 |
| 커밋 해시 | 기존 커밋 유지 | 내 커밋 해시가 바뀔 수 있음 |
| 사용 상황 | 작업 흐름을 보존하고 싶을 때 | 히스토리를 깔끔하게 만들고 싶을 때 |

```text
merge
→ 브랜치 흐름을 그대로 보존하면서 합친다.

rebase
→ 내 커밋을 기준 브랜치 최신 커밋 위로 다시 올린다.
```

### 언제 `merge`를 쓰고 언제 `rebase`를 쓸까?

처음에는 다음 기준으로 생각하면 좋습니다.

```text
공유 브랜치에 합칠 때 → merge
내 작업 브랜치를 최신 main 위로 정리할 때 → rebase
```

예를 들어 `feature/login` 작업이 끝나서 `main`에 합치려면 merge를 사용할 수 있습니다.

```bash
git switch main
git merge feature/login
```

반대로 `feature/login` 브랜치에서 작업 중인데 최신 `main` 변경 사항을 내 브랜치에 반영하고 싶다면 rebase를 사용할 수 있습니다.

```bash
git switch feature/login
git fetch origin
git rebase origin/main
```

---

## 6. rebase 사용 시 주의점

`rebase`는 커밋을 다시 만드는 방식이기 때문에 커밋 해시가 바뀔 수 있습니다.

그래서 이미 원격 저장소에 push했고, 다른 사람도 사용 중인 브랜치에서는 조심해야 합니다.

```text
내 로컬에서만 작업 중인 브랜치 → rebase 사용하기 좋음
이미 공유된 브랜치 → rebase 주의
main, develop 같은 공용 브랜치 → 함부로 rebase하지 않기
```

특히 협업 중인 브랜치에서 rebase 후 강제 push를 하면 다른 사람의 작업 흐름에 영향을 줄 수 있습니다.

따라서 처음에는 rebase를 다음 상황에 주로 사용하는 것이 안전합니다.

```text
내 feature 브랜치를 최신 main 기준으로 정리할 때
아직 다른 사람과 공유하지 않은 로컬 커밋을 정리할 때
```

---

## 7. 자주 쓰는 흐름

기능 브랜치를 `main`에 병합할 때:

```bash
git switch main
git pull
git merge feature/login
```

현재 feature 브랜치를 최신 원격 main 위로 올릴 때:

```bash
git switch feature/login
git fetch origin
git rebase origin/main
```

로컬 `main` 기준으로 rebase할 때:

```bash
git switch feature/login
git rebase main
```

---

## 8. 명령어별 정리

| 명령어 | 의미 |
| --- | --- |
| `git merge <branch>` | 지정한 브랜치의 변경 사항을 현재 브랜치에 병합 |
| `git rebase <branch>` | 현재 브랜치의 커밋을 지정한 브랜치 위로 다시 올림 |
| `git rebase origin/main` | 현재 브랜치의 커밋을 원격 `main`의 최신 상태 위로 다시 올림 |

```text
git merge <branch>
→ 현재 브랜치에 다른 브랜치를 병합한다.

git rebase <branch>
→ 현재 브랜치의 커밋들을 다른 브랜치 위로 다시 올린다.

git rebase origin/main
→ 현재 브랜치의 커밋들을 원격 main 최신 상태 위로 다시 올린다.
```

---

## 마무리 정리

`git merge <branch>`와 `git rebase <branch>`는 모두 브랜치의 변경 사항을 합칠 때 사용하는 명령어입니다.

`merge`는 두 브랜치의 흐름을 그대로 보존하면서 병합합니다. 이 과정에서 병합 커밋이 생길 수 있습니다.

`rebase`는 현재 브랜치의 커밋을 기준 브랜치의 최신 커밋 위로 다시 올립니다. 그래서 커밋 흐름이 더 직선처럼 정리됩니다.

`git rebase origin/main`은 현재 브랜치를 원격 `main`의 최신 상태 위로 정리할 때 자주 사용합니다. 이때 `origin/main`을 최신 상태로 만들기 위해 먼저 `git fetch origin`을 실행하는 것이 좋습니다.

한 문장으로 정리하면 다음과 같습니다.

> `merge`는 브랜치의 작업 흐름을 보존하면서 합치는 방식이고, `rebase`는 내 작업 커밋을 기준 브랜치 위로 다시 올려 히스토리를 깔끔하게 정리하는 방식이다.
