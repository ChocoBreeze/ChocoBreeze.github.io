---
title: "Git 임시 저장하기: git stash 정리"
slug: "git-stash-command-guide"
description: "git stash, git stash list, git stash pop, git stash apply, git stash drop, git stash clear로 작업 내용을 임시 저장하는 방법을 정리합니다."
pubDate: "2026-07-05T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

`git stash`는 Git에서 **아직 커밋하지 않은 변경 사항을 임시로 저장할 때 사용하는 명령어**입니다.

작업하다 보면 아직 커밋하기는 애매한데, 급하게 다른 브랜치로 이동해야 하는 경우가 있습니다.

예를 들어 다음과 같은 상황입니다.

```text
현재 feature/login 브랜치에서 작업 중이다.
아직 작업이 끝나지 않아서 커밋하기는 애매하다.
그런데 급하게 main 브랜치로 이동해서 버그를 확인해야 한다.
```

이때 작업 중인 변경 사항이 있으면 브랜치 이동이 막히거나, 이동하더라도 변경 내용이 섞여서 헷갈릴 수 있습니다.

이런 경우 `git stash`를 사용하면 현재 작업 내용을 잠시 보관해두고, 작업 디렉토리를 깨끗한 상태로 만들 수 있습니다.

이번 글에서는 다음 명령어를 정리합니다.

```bash
git stash
git stash list
git stash pop
git stash apply
git stash drop
git stash clear
```

---

## 1. `git stash`란?

`git stash`는 아직 커밋하지 않은 변경 사항을 임시 저장 공간에 보관하는 명령어입니다.

Git 작업 흐름을 간단히 보면 다음과 같습니다.

```text
작업 디렉토리 → 스테이징 영역 → 커밋
```

보통 파일을 수정하면 작업 디렉토리에 변경 사항이 생깁니다.

```bash
git status -sb
```

예시:

```bash
 M README.md
 M src/app.js
```

이 상태에서 `git stash`를 실행하면, 수정 중이던 변경 사항이 stash 공간에 임시 저장되고 작업 디렉토리는 깨끗한 상태로 돌아갑니다.

```bash
git stash
```

즉, `git stash`는 다음과 같이 이해할 수 있습니다.

```text
아직 커밋하지 않은 작업 내용을 잠깐 보관한다.
그리고 현재 작업 디렉토리를 깨끗하게 만든다.
```

---

## 2. `git stash`

```bash
git stash
```

`git stash`는 현재 작업 중인 변경 사항을 임시로 저장합니다.

예를 들어 다음과 같은 상태가 있다고 해보겠습니다.

```bash
git status -sb
```

```bash
 M README.md
 M src/app.js
```

아직 커밋하기에는 작업이 애매하지만, 다른 브랜치로 이동해야 한다면 다음 명령어를 실행합니다.

```bash
git stash
```

그러면 변경 사항이 stash에 저장됩니다.

다시 상태를 확인하면 작업 디렉토리가 깨끗해진 것을 볼 수 있습니다.

```bash
git status -sb
```

예시:

```bash
## feature/login...origin/feature/login
```

이제 다른 브랜치로 이동할 수 있습니다.

```bash
git switch main
```

### `git stash`는 언제 사용할까?

`git stash`는 다음과 같은 상황에서 유용합니다.

```text
작업 중인데 급하게 다른 브랜치로 이동해야 할 때
아직 커밋하기 애매한 변경 사항을 잠깐 보관하고 싶을 때
pull이나 rebase 전에 작업 내용을 임시로 치워두고 싶을 때
실험 중인 변경 사항을 잠시 숨겨두고 싶을 때
```

예를 들어 현재 작업 중인 내용이 있는데 최신 원격 변경 사항을 가져오고 싶다면 다음 흐름을 사용할 수 있습니다.

```bash
git stash
git pull
git stash pop
```

이렇게 하면 작업 내용을 잠시 보관한 뒤, 원격 변경 사항을 반영하고, 다시 작업 내용을 꺼내올 수 있습니다.

---

## 3. `git stash list`

```bash
git stash list
```

`git stash list`는 현재 저장되어 있는 stash 목록을 확인하는 명령어입니다.

`git stash`는 한 번만 사용할 수 있는 것이 아니라, 여러 번 사용할 수 있습니다.

예를 들어 여러 번 stash를 만들었다면 다음처럼 목록을 확인할 수 있습니다.

```bash
git stash list
```

예시:

```bash
stash@{0}: WIP on feature/login: a1b2c3d Add login form
stash@{1}: WIP on main: d4e5f6g Update README
stash@{2}: WIP on develop: h7i8j9k Add API logic
```

여기서 `stash@{0}`이 가장 최근에 저장한 stash입니다.

```text
stash@{0} → 가장 최근 stash
stash@{1} → 그 이전 stash
stash@{2} → 더 이전 stash
```

즉, `git stash list`는 내가 임시 저장해둔 작업 목록을 확인할 때 사용합니다.

### stash 이름 이해하기

stash 목록에는 다음과 같은 형태가 나옵니다.

```bash
stash@{0}: WIP on feature/login: a1b2c3d Add login form
```

각 부분을 나누어 보면 다음과 같습니다.

```text
stash@{0}
→ stash 번호

WIP on feature/login
→ feature/login 브랜치에서 작업 중이던 내용을 stash했다는 뜻

a1b2c3d Add login form
→ stash를 만들 당시 기준이 된 커밋 정보
```

여기서 `WIP`는 Work In Progress의 줄임말입니다.

즉, 아직 완료되지 않은 작업이라는 의미입니다.

---

## 4. `git stash apply`

```bash
git stash apply
```

`git stash apply`는 저장해둔 stash를 다시 적용하는 명령어입니다.

예를 들어 작업 중이던 변경 사항을 stash로 저장했다고 해보겠습니다.

```bash
git stash
```

이후 다시 그 작업 내용을 꺼내오고 싶다면 다음 명령어를 사용합니다.

```bash
git stash apply
```

이 명령어는 가장 최근 stash인 `stash@{0}`을 현재 작업 디렉토리에 적용합니다.

중요한 점은 `apply`는 stash를 적용한 뒤에도 stash 목록에서 삭제하지 않는다는 것입니다.

즉, 적용 후에도 `git stash list`를 실행하면 해당 stash가 여전히 남아 있습니다.

```text
git stash apply
→ stash 내용을 적용한다.
→ stash 목록에는 그대로 남겨둔다.
```

### 특정 stash 적용하기

가장 최근 stash가 아니라 특정 stash를 적용하고 싶다면 stash 이름을 지정할 수 있습니다.

```bash
git stash apply stash@{1}
```

이 명령어는 `stash@{1}`에 저장된 변경 사항을 현재 작업 디렉토리에 적용합니다.

예를 들어 목록이 다음과 같다고 해보겠습니다.

```bash
stash@{0}: WIP on feature/login: a1b2c3d Add login form
stash@{1}: WIP on main: d4e5f6g Update README
```

여기서 `stash@{1}`을 적용하고 싶다면 다음처럼 입력합니다.

```bash
git stash apply stash@{1}
```

이렇게 하면 가장 최근 stash가 아니라, 지정한 stash를 꺼내올 수 있습니다.

---

## 5. `git stash pop`

```bash
git stash pop
```

`git stash pop`은 저장해둔 stash를 다시 적용하고, 적용된 stash를 stash 목록에서 제거하는 명령어입니다.

즉, `apply`와 비슷하지만 적용 후 stash 목록에서 삭제된다는 차이가 있습니다.

```text
git stash pop
→ stash 내용을 적용한다.
→ 적용한 stash를 목록에서 제거한다.
```

예를 들어 다음 흐름을 사용할 수 있습니다.

```bash
git stash
git stash pop
```

첫 번째 명령어는 현재 변경 사항을 stash에 저장합니다.

두 번째 명령어는 저장한 변경 사항을 다시 꺼내오고, stash 목록에서 제거합니다.

### `apply`와 `pop` 차이

`git stash apply`와 `git stash pop`은 둘 다 stash 내용을 다시 적용한다는 점에서 비슷합니다.

하지만 stash 목록에 남기는지 여부가 다릅니다.

| 명령어               | stash 적용 | stash 목록에서 제거 |
| ----------------- | -------: | ------------: |
| `git stash apply` |        O |             X |
| `git stash pop`   |        O |             O |

간단히 정리하면 다음과 같습니다.

```text
git stash apply
→ 다시 쓸 가능성이 있으니 stash를 남겨둔다.

git stash pop
→ 한 번 꺼내 쓰고 stash 목록에서 제거한다.
```

보통 임시로 저장한 작업을 다시 꺼내서 계속 작업할 때는 `git stash pop`을 많이 사용합니다.

반면 같은 stash를 여러 번 적용해보거나, 안전하게 남겨두고 싶다면 `git stash apply`를 사용할 수 있습니다.

### `git stash pop` 사용 시 충돌

`git stash pop`을 실행할 때 충돌이 발생할 수도 있습니다.

예를 들어 stash를 저장한 이후 같은 파일의 같은 부분이 다른 방식으로 변경되었다면, Git이 자동으로 적용하지 못할 수 있습니다.

이 경우 `git status`로 충돌난 파일을 확인합니다.

```bash
git status
```

충돌 파일을 직접 수정한 뒤 스테이징합니다.

```bash
git add <file>
```

그 후 필요한 경우 커밋합니다.

```bash
git commit -m "Resolve stash conflict"
```

stash 적용도 merge처럼 충돌이 날 수 있다는 점을 알아두면 좋습니다.

---

## 6. `git stash drop`

```bash
git stash drop
```

`git stash drop`은 stash 목록에서 특정 stash를 삭제하는 명령어입니다.

기본적으로는 가장 최근 stash인 `stash@{0}`을 삭제합니다.

```bash
git stash drop
```

특정 stash를 삭제하고 싶다면 이름을 지정할 수 있습니다.

```bash
git stash drop stash@{1}
```

예를 들어 다음과 같은 stash 목록이 있다고 해보겠습니다.

```bash
git stash list
```

```bash
stash@{0}: WIP on feature/login: a1b2c3d Add login form
stash@{1}: WIP on main: d4e5f6g Update README
```

여기서 `stash@{1}`이 더 이상 필요 없다면 다음 명령어로 삭제합니다.

```bash
git stash drop stash@{1}
```

즉, `git stash drop`은 stash 하나를 선택해서 삭제할 때 사용합니다.

### `drop`은 언제 사용할까?

`git stash drop`은 다음 상황에서 사용할 수 있습니다.

```text
더 이상 필요 없는 stash를 삭제하고 싶을 때
stash 목록을 정리하고 싶을 때
apply로 적용한 stash가 더 이상 필요 없을 때
잘못 저장한 stash를 제거하고 싶을 때
```

예를 들어 `git stash apply`는 stash를 적용해도 목록에 남아 있습니다.

```bash
git stash apply
```

적용 후 더 이상 필요 없다면 다음 명령어로 삭제할 수 있습니다.

```bash
git stash drop
```

---

## 7. `git stash clear`

```bash
git stash clear
```

`git stash clear`는 저장된 stash를 모두 삭제하는 명령어입니다.

이 명령어를 실행하면 stash 목록에 있는 모든 항목이 삭제됩니다.

예를 들어 다음과 같이 여러 stash가 있다고 해보겠습니다.

```bash
git stash list
```

```bash
stash@{0}: WIP on feature/login: a1b2c3d Add login form
stash@{1}: WIP on main: d4e5f6g Update README
stash@{2}: WIP on develop: h7i8j9k Add API logic
```

이 상태에서 다음 명령어를 실행하면:

```bash
git stash clear
```

stash 목록이 모두 비워집니다.

### `drop`과 `clear` 차이

`git stash drop`과 `git stash clear`는 둘 다 stash를 삭제하는 명령어입니다.

하지만 삭제 범위가 다릅니다.

| 명령어                        | 의미          |
| -------------------------- | ----------- |
| `git stash drop`           | stash 하나 삭제 |
| `git stash drop stash@{n}` | 특정 stash 삭제 |
| `git stash clear`          | stash 전체 삭제 |

간단히 정리하면 다음과 같습니다.

```text
git stash drop
→ 하나만 삭제

git stash clear
→ 전부 삭제
```

`git stash clear`는 모든 stash를 삭제하므로 조심해야 합니다.

특히 stash 안에 아직 필요한 작업 내용이 남아 있을 수 있으므로, 실행 전에는 반드시 목록을 확인하는 것이 좋습니다.

```bash
git stash list
```

---

## 8. 자주 쓰는 흐름

작업 중 변경 사항을 잠시 저장하고 다른 브랜치로 이동할 때:

```bash
git status -sb
git stash
git switch main
```

다시 원래 브랜치로 돌아와 작업 내용을 꺼낼 때:

```bash
git switch feature/login
git stash pop
```

stash 목록을 확인할 때:

```bash
git stash list
```

stash를 적용하되 목록에 남겨두고 싶을 때:

```bash
git stash apply
```

특정 stash를 적용하고 싶을 때:

```bash
git stash apply stash@{1}
```

필요 없는 stash 하나를 삭제할 때:

```bash
git stash drop stash@{0}
```

stash 전체를 삭제할 때:

```bash
git stash clear
```

---

## 9. 명령어별 정리

| 명령어                         | 의미                        |
| --------------------------- | ------------------------- |
| `git stash`                 | 현재 작업 중인 변경 사항을 임시 저장     |
| `git stash list`            | 저장된 stash 목록 확인           |
| `git stash apply`           | 가장 최근 stash를 적용하되 목록에는 유지 |
| `git stash apply stash@{n}` | 특정 stash 적용               |
| `git stash pop`             | 가장 최근 stash를 적용하고 목록에서 제거 |
| `git stash drop`            | 가장 최근 stash 삭제            |
| `git stash drop stash@{n}`  | 특정 stash 삭제               |
| `git stash clear`           | 모든 stash 삭제               |

```text
git stash
→ 작업 내용을 임시 저장한다.

git stash list
→ 임시 저장 목록을 확인한다.

git stash apply
→ 임시 저장 내용을 다시 적용하지만 목록에는 남긴다.

git stash pop
→ 임시 저장 내용을 다시 적용하고 목록에서 제거한다.

git stash drop
→ stash 하나를 삭제한다.

git stash clear
→ stash 전체를 삭제한다.
```

---

## 10. 자주 헷갈리는 상황

### `git stash`는 커밋인가?

아닙니다.

`git stash`는 정식 커밋처럼 브랜치 히스토리에 남는 기록은 아닙니다.

작업 내용을 임시로 보관하는 기능에 가깝습니다.

따라서 중요한 작업이라면 stash에 오래 두기보다 적절한 시점에 커밋하는 것이 좋습니다.

```bash
git add .
git commit -m "작업 내용"
```

### `git stash pop`과 `git stash apply` 중 무엇을 쓰면 좋을까?

임시 저장한 작업을 다시 꺼내서 계속 작업할 목적이라면 `git stash pop`을 많이 사용합니다.

```bash
git stash pop
```

반면 stash를 적용한 뒤에도 목록에 남겨두고 싶다면 `git stash apply`를 사용합니다.

```bash
git stash apply
```

처음에는 다음 기준으로 기억하면 좋습니다.

```text
pop   → 꺼내고 목록에서 제거
apply → 적용만 하고 목록에 유지
```

### stash를 삭제해도 될지 모르겠다면?

삭제하기 전에 먼저 목록을 확인합니다.

```bash
git stash list
```

필요 없는 stash 하나만 삭제하려면:

```bash
git stash drop stash@{n}
```

전체를 삭제하려면:

```bash
git stash clear
```

다만 `clear`는 모든 stash를 삭제하므로, 확실할 때만 사용하는 것이 좋습니다.

### stash 적용 후 충돌이 나면?

stash를 적용할 때도 충돌이 날 수 있습니다.

이 경우 일반적인 충돌 해결과 비슷하게 처리합니다.

```bash
git status
# 충돌 파일 수정
git add <file>
```

필요하다면 이후 커밋합니다.

```bash
git commit -m "Resolve stash conflict"
```

---

## 마무리 정리

`git stash`는 아직 커밋하지 않은 작업 내용을 임시로 저장할 때 사용하는 명령어입니다.

작업 중인 변경 사항을 잠시 치워두고 다른 브랜치로 이동하거나, pull/rebase 전에 작업 디렉토리를 깨끗하게 만들 때 유용합니다.

`git stash list`로 저장된 stash 목록을 확인할 수 있고, `git stash apply`나 `git stash pop`으로 다시 적용할 수 있습니다.

`apply`는 stash를 적용해도 목록에 남겨두고, `pop`은 적용 후 목록에서 제거합니다.

필요 없는 stash는 `git stash drop`으로 하나씩 삭제할 수 있고, 전체를 삭제하려면 `git stash clear`를 사용할 수 있습니다.

한 문장으로 정리하면 다음과 같습니다.

> `git stash`는 아직 커밋하지 않은 작업 내용을 잠시 보관하는 명령어이며, `apply`는 다시 적용하되 목록에 남기고, `pop`은 다시 적용한 뒤 목록에서 제거한다.
