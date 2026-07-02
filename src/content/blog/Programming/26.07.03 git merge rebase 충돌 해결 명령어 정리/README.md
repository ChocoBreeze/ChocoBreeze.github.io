---
title: "Git merge/rebase 충돌 해결 명령어 정리"
slug: "git-conflict-resolution-guide"
description: "git merge --abort, git rebase --abort, git rebase --continue로 merge와 rebase 충돌을 해결하는 방법을 정리합니다."
pubDate: "2026-07-03T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

Git에서 `merge`나 `rebase`를 하다 보면 충돌이 발생할 수 있습니다.

충돌은 Git이 자동으로 변경 사항을 합치지 못하는 상황을 의미합니다.

예를 들어 같은 파일의 같은 부분을 두 브랜치에서 서로 다르게 수정했다면, Git은 어떤 내용을 선택해야 할지 판단하지 못합니다.

이때 사용자가 직접 충돌을 해결해야 합니다.

이번 글에서는 merge 또는 rebase 중 충돌이 발생했을 때 자주 사용하는 명령어를 정리합니다.

```bash
git merge --abort
git rebase --abort
git rebase --continue
```

---

## 1. Git 충돌이란?

Git 충돌은 서로 다른 브랜치의 변경 사항을 합치는 과정에서 Git이 자동으로 처리할 수 없는 변경이 생긴 상태입니다.

예를 들어 `main` 브랜치와 `feature/login` 브랜치에서 같은 파일의 같은 줄을 다르게 수정했다고 해보겠습니다.

```text
main 브랜치:
const message = "Hello";

feature/login 브랜치:
const message = "Login Success";
```

이 상태에서 두 브랜치를 합치려고 하면 Git은 어떤 값을 최종 결과로 선택해야 할지 알 수 없습니다.

충돌이 발생하면 파일 안에 다음과 같은 표시가 생길 수 있습니다.

```text
<<<<<<< HEAD
const message = "Hello";
=======
const message = "Login Success";
>>>>>>> feature/login
```

사용자는 이 부분을 직접 수정해서 최종 코드로 만들어야 합니다.

예를 들어 다음처럼 정리할 수 있습니다.

```text
const message = "Login Success";
```

그리고 충돌 표시인 `<<<<<<<`, `=======`, `>>>>>>>`는 반드시 제거해야 합니다.

---

## 2. merge 중 충돌이 발생한 경우

예를 들어 `main` 브랜치에서 `feature/login` 브랜치를 병합한다고 해보겠습니다.

```bash
git switch main
git merge feature/login
```

이때 충돌이 발생하면 Git은 merge를 완료하지 못하고 중간 상태로 멈춥니다.

```bash
git status
```

예시:

```text
You have unmerged paths.
  both modified:   src/app.js
```

이 상태에서는 선택지가 두 가지입니다.

```text
1. 충돌을 직접 해결하고 merge를 완료한다.
2. merge 자체를 취소하고 이전 상태로 돌아간다.
```

merge를 계속 진행하려면 충돌 파일을 직접 수정한 뒤 `git add`와 `git commit`을 진행합니다.

반대로 merge를 취소하고 싶다면 `git merge --abort`를 사용합니다.

---

## 3. `git merge --abort`

```bash
git merge --abort
```

`git merge --abort`는 **진행 중인 merge를 취소하고, merge를 시작하기 전 상태로 되돌리는 명령어**입니다.

예를 들어 다음 명령어를 실행하다가 충돌이 발생했다고 해보겠습니다.

```bash
git merge feature/login
```

충돌이 너무 복잡하거나, 지금은 merge를 진행하고 싶지 않다면 다음 명령어로 취소할 수 있습니다.

```bash
git merge --abort
```

`git merge --abort`는 다음 상황에서 사용할 수 있습니다.

```text
merge 중 충돌이 났는데 지금 해결하고 싶지 않을 때
잘못된 브랜치를 merge한 것을 알았을 때
충돌이 너무 많아서 merge를 다시 시도하고 싶을 때
merge 전 상태로 돌아가고 싶을 때
```

예를 들어 원래는 `develop` 브랜치를 merge해야 했는데 실수로 `feature/login`을 merge했다면 다음처럼 취소할 수 있습니다.

```bash
git merge --abort
git merge develop
```

### merge 충돌 해결 기본 흐름

merge를 계속 진행하고 싶다면 다음 흐름을 사용합니다.

```bash
git status
# 충돌 파일 확인 후 수정
git add src/app.js
git commit
```

보통 merge 중에는 Git이 기본 merge commit 메시지를 준비해주기 때문에, 편집기에서 메시지를 확인하고 저장하면 됩니다.

반대로 merge를 포기하고 싶다면 다음 명령어를 사용합니다.

```bash
git merge --abort
```

---

## 4. rebase 중 충돌이 발생한 경우

`rebase` 중에도 충돌이 발생할 수 있습니다.

예를 들어 `feature/login` 브랜치를 최신 `origin/main` 위로 다시 올린다고 해보겠습니다.

```bash
git switch feature/login
git fetch origin
git rebase origin/main
```

이때 현재 브랜치의 커밋을 하나씩 다시 적용하는 과정에서 충돌이 발생할 수 있습니다.

rebase 중 충돌이 발생하면 Git은 중간에 멈추고 사용자에게 충돌 해결을 요구합니다.

이때 선택지는 보통 두 가지입니다.

```text
1. 충돌을 해결하고 rebase를 계속 진행한다.
2. rebase를 취소하고 rebase 이전 상태로 돌아간다.
```

---

## 5. `git rebase --abort`

```bash
git rebase --abort
```

`git rebase --abort`는 **진행 중인 rebase를 취소하고, rebase를 시작하기 전 상태로 되돌리는 명령어**입니다.

예를 들어 다음 명령어를 실행하다가 충돌이 발생했다고 해보겠습니다.

```bash
git rebase origin/main
```

충돌이 너무 복잡하거나, 잘못된 기준 브랜치로 rebase했다는 것을 알게 되었다면 다음 명령어로 rebase를 취소할 수 있습니다.

```bash
git rebase --abort
```

`git rebase --abort`는 다음 상황에서 사용할 수 있습니다.

```text
rebase 중 충돌이 났는데 지금 해결하고 싶지 않을 때
잘못된 브랜치 기준으로 rebase한 것을 알았을 때
충돌이 너무 많아서 rebase를 다시 시도하고 싶을 때
rebase 전 상태로 되돌리고 싶을 때
```

예를 들어 잘못된 기준으로 rebase를 했다면 다음처럼 취소하고 다시 실행할 수 있습니다.

```bash
git rebase --abort
git fetch origin
git rebase origin/main
```

---

## 6. `git rebase --continue`

```bash
git rebase --continue
```

`git rebase --continue`는 **rebase 중 발생한 충돌을 해결한 뒤, rebase를 계속 진행하는 명령어**입니다.

rebase는 현재 브랜치의 커밋을 기준 브랜치 위에 하나씩 다시 적용하는 방식입니다.

그래서 충돌이 한 번만 나는 것이 아니라, 커밋을 적용하는 중간중간 여러 번 발생할 수도 있습니다.

충돌이 발생하면 먼저 충돌난 파일을 수정합니다.

그다음 수정한 파일을 스테이징합니다.

```bash
git add <file>
```

그리고 rebase를 계속 진행합니다.

```bash
git rebase --continue
```

### rebase 충돌 해결 기본 흐름

예를 들어 다음 명령어를 실행했다고 해보겠습니다.

```bash
git rebase origin/main
```

충돌이 발생하면 먼저 상태를 확인합니다.

```bash
git status
```

예시:

```text
You are currently rebasing branch 'feature/login' on 'origin/main'.
  both modified:   src/app.js
```

충돌난 파일을 열어 충돌 표시를 정리합니다.

```text
<<<<<<< HEAD
...
=======
...
>>>>>>> 커밋해시 또는 브랜치명
```

최종 코드만 남기고 충돌 표시를 제거합니다.

그다음 파일을 스테이징합니다.

```bash
git add src/app.js
```

그리고 rebase를 계속 진행합니다.

```bash
git rebase --continue
```

다음 커밋을 적용하는 과정에서 또 충돌이 발생하면, 같은 과정을 반복합니다.

```bash
git status
# 충돌 파일 수정
git add <file>
git rebase --continue
```

---

## 7. merge와 rebase 충돌 해결의 차이

| 상황 | 충돌 해결 후 사용하는 명령어 |
| --- | --- |
| merge 중 충돌 | `git add <file>` 후 `git commit` |
| rebase 중 충돌 | `git add <file>` 후 `git rebase --continue` |

merge는 충돌을 해결한 뒤 merge commit을 만들면 완료됩니다.

반면 rebase는 커밋을 하나씩 다시 적용하는 과정이므로, 충돌을 해결한 뒤 `git rebase --continue`로 다음 단계로 넘어가야 합니다.

```text
merge 충돌 해결 후
→ git add <file>
→ git commit

rebase 충돌 해결 후
→ git add <file>
→ git rebase --continue
```

---

## 8. `--abort`와 `--continue` 차이

| 명령어 | 의미 |
| --- | --- |
| `git merge --abort` | 진행 중인 merge 취소 |
| `git rebase --abort` | 진행 중인 rebase 취소 |
| `git rebase --continue` | 충돌 해결 후 rebase 계속 진행 |

```text
--abort
→ 지금 하던 작업을 취소하고 이전 상태로 돌아가기

--continue
→ 충돌 해결을 완료했으니 다음 단계로 진행하기
```

충돌을 해결하지 않고 merge/rebase를 포기하고 싶다면 `--abort`를 사용합니다.

충돌을 해결하고 rebase를 이어가고 싶다면 `--continue`를 사용합니다.

---

## 9. 자주 쓰는 흐름

merge 중 충돌이 났고, 취소하고 싶을 때:

```bash
git merge --abort
```

merge 중 충돌이 났고, 해결하고 싶을 때:

```bash
git status
# 충돌 파일 수정
git add <file>
git commit
```

rebase 중 충돌이 났고, 취소하고 싶을 때:

```bash
git rebase --abort
```

rebase 중 충돌이 났고, 해결하고 계속 진행하고 싶을 때:

```bash
git status
# 충돌 파일 수정
git add <file>
git rebase --continue
```

rebase 중 충돌이 여러 번 발생한다면 다음 과정을 반복합니다.

```bash
# 충돌 파일 수정
git add <file>
git rebase --continue
```

---

## 10. 자주 헷갈리는 상황

### rebase 중 충돌 해결 후 `git commit`을 해야 할까?

보통은 하지 않습니다.

rebase 중 충돌을 해결한 뒤에는 다음 명령어를 사용합니다.

```bash
git add <file>
git rebase --continue
```

rebase는 기존 커밋을 다시 적용하는 과정이므로, 사용자가 직접 `git commit`을 만드는 것이 아니라 `git rebase --continue`로 Git에게 다음 과정을 진행하라고 알려주는 방식입니다.

### `--abort`를 하면 수정 내용이 모두 사라질까?

`git merge --abort`나 `git rebase --abort`는 merge 또는 rebase를 시작하기 전 상태로 되돌리려는 명령어입니다.

즉, merge/rebase 과정에서 생긴 변경 사항은 취소됩니다.

그래서 merge나 rebase를 하기 전에는 작업 디렉토리를 깨끗하게 해두는 것이 좋습니다.

```bash
git status -sb
```

작업 중인 내용이 있다면 먼저 커밋하거나 stash하는 것이 안전합니다.

```bash
git add .
git commit -m "WIP"
```

또는:

```bash
git stash
```

---

## 11. 명령어별 정리

| 명령어 | 의미 |
| --- | --- |
| `git merge --abort` | 진행 중인 merge를 취소하고 merge 전 상태로 돌아감 |
| `git rebase --abort` | 진행 중인 rebase를 취소하고 rebase 전 상태로 돌아감 |
| `git rebase --continue` | rebase 중 충돌을 해결한 뒤 rebase를 계속 진행 |

```text
git merge --abort
→ merge 중 충돌이 났을 때 merge를 취소한다.

git rebase --abort
→ rebase 중 충돌이 났을 때 rebase를 취소한다.

git rebase --continue
→ rebase 중 충돌을 해결한 뒤 계속 진행한다.
```

---

## 마무리 정리

`git merge --abort`는 merge 중 충돌이 발생했을 때 merge를 취소하고 이전 상태로 돌아갈 때 사용합니다.

`git rebase --abort`는 rebase 중 충돌이 발생했을 때 rebase를 취소하고 이전 상태로 돌아갈 때 사용합니다.

`git rebase --continue`는 rebase 중 충돌을 해결한 뒤 rebase를 계속 진행할 때 사용합니다.

merge 충돌은 해결 후 보통 `git add <file>`과 `git commit`으로 마무리합니다.

rebase 충돌은 해결 후 `git add <file>`과 `git rebase --continue`로 이어갑니다.

한 문장으로 정리하면 다음과 같습니다.

> `--abort`는 진행 중인 merge/rebase를 취소할 때 사용하고, `git rebase --continue`는 rebase 중 충돌을 해결한 뒤 다음 단계로 진행할 때 사용한다.
