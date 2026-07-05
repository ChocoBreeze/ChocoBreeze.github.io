---
title: "Git 특정 커밋 가져오기: git cherry-pick 정리"
slug: "git-cherry-pick-command-guide"
description: "git cherry-pick으로 특정 커밋을 현재 브랜치에 적용하는 방법과 충돌 해결, --no-commit 옵션까지 정리합니다."
pubDate: "2026-07-06T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

`git cherry-pick`은 Git에서 **특정 커밋 하나를 골라 현재 브랜치에 적용할 때 사용하는 명령어**입니다.

보통 Git에서는 브랜치 단위로 작업을 합칠 때 `merge`나 `rebase`를 사용합니다.

하지만 작업하다 보면 브랜치 전체가 아니라, 특정 커밋 하나만 가져오고 싶은 경우가 있습니다.

예를 들어 다음과 같은 상황입니다.

```text
다른 브랜치에 있는 버그 수정 커밋 하나만 현재 브랜치로 가져오고 싶을 때
feature 브랜치 전체는 아직 합치기 싫지만, 특정 기능 커밋만 가져오고 싶을 때
main에 들어간 hotfix 커밋을 develop에도 반영하고 싶을 때
실수로 다른 브랜치에 커밋한 내용을 현재 브랜치로 가져오고 싶을 때
```

이때 사용할 수 있는 명령어가 `git cherry-pick`입니다.

기본 사용법은 다음과 같습니다.

```bash
git cherry-pick <commit-hash>
```

---

## 1. `git cherry-pick`이란?

`git cherry-pick`은 특정 커밋의 변경 사항을 현재 브랜치에 새 커밋으로 적용하는 명령어입니다.

예를 들어 브랜치 흐름이 다음과 같다고 해보겠습니다.

```text
main:    A --- B
              \
feature:       C --- D
```

현재 `main` 브랜치에 있고, `feature` 브랜치의 `D` 커밋만 가져오고 싶다면 `cherry-pick`을 사용할 수 있습니다.

```bash
git cherry-pick <D의 커밋 해시>
```

그러면 `D` 커밋의 변경 사항이 현재 브랜치인 `main`에 적용됩니다.

```text
main:    A --- B --- D'
              \
feature:       C --- D
```

여기서 `D'`는 `D`와 같은 변경 사항을 가진 새 커밋입니다.

즉, 기존 `D` 커밋 자체가 이동하는 것이 아니라, `D` 커밋의 변경 내용이 현재 브랜치에 새 커밋으로 만들어지는 것입니다.

---

## 2. `git cherry-pick <commit-hash>`

```bash
git cherry-pick <commit-hash>
```

`git cherry-pick <commit-hash>`는 지정한 커밋의 변경 사항을 현재 브랜치에 적용합니다.

예를 들어 다음과 같은 커밋 기록이 있다고 해보겠습니다.

```bash
git log --oneline --all --graph
```

예시:

```text
* d4e5f6g Add payment validation
* c3d4e5f Add payment page
| * a1b2c3d Fix login bug
|/
* h7i8j9k Initial commit
```

현재 브랜치에 `a1b2c3d Fix login bug` 커밋만 가져오고 싶다면 다음처럼 입력합니다.

```bash
git cherry-pick a1b2c3d
```

그러면 `Fix login bug` 커밋의 변경 내용이 현재 브랜치에 적용되고, 새로운 커밋이 생성됩니다.

### 커밋 해시는 어디서 확인할까?

`cherry-pick`을 하려면 가져올 커밋의 해시를 알아야 합니다.

커밋 해시는 보통 `git log --oneline`으로 확인합니다.

```bash
git log --oneline
```

현재 브랜치뿐만 아니라 다른 브랜치의 커밋까지 같이 보고 싶다면 다음처럼 확인할 수 있습니다.

```bash
git log --oneline --all --graph
```

예시:

```text
* a1b2c3d Fix login bug
* d4e5f6g Add login form
| * k1l2m3n Add payment validation
| * p4q5r6s Add payment page
|/
* h7i8j9k Initial commit
```

여기서 가져오고 싶은 커밋이 `k1l2m3n Add payment validation`이라면 다음 명령어를 실행합니다.

```bash
git cherry-pick k1l2m3n
```

`git cherry-pick`은 다음과 같은 상황에서 유용합니다.

```text
다른 브랜치의 특정 커밋 하나만 가져오고 싶을 때
전체 브랜치를 merge하기에는 부담스럽지만 일부 변경은 필요한 경우
hotfix 커밋을 여러 브랜치에 반영해야 할 때
실수로 잘못된 브랜치에 커밋한 내용을 가져오고 싶을 때
```

예를 들어 `main` 브랜치에 긴급 버그 수정 커밋이 들어갔고, 이 수정 사항을 `develop` 브랜치에도 반영해야 한다고 해보겠습니다.

```bash
git switch develop
git cherry-pick <hotfix-commit-hash>
```

이렇게 하면 `main`에 있던 특정 hotfix 커밋의 변경 사항만 `develop` 브랜치에 적용할 수 있습니다.

---

## 3. `merge`와 `cherry-pick` 차이

`merge`와 `cherry-pick`은 모두 다른 브랜치의 변경 사항을 현재 브랜치에 반영할 수 있습니다.

하지만 적용 범위가 다릅니다.

| 명령어                             | 의미                 | 적용 범위         |
| ------------------------------- | ------------------ | ------------- |
| `git merge <branch>`            | 다른 브랜치를 현재 브랜치에 병합 | 브랜치의 변경 흐름 전체 |
| `git cherry-pick <commit-hash>` | 특정 커밋만 현재 브랜치에 적용  | 지정한 커밋 하나     |

예를 들어 다음 브랜치 구조가 있다고 해보겠습니다.

```text
main:    A --- B
              \
feature:       C --- D --- E
```

`main`에서 다음 명령어를 실행하면:

```bash
git merge feature
```

`feature` 브랜치의 `C`, `D`, `E` 흐름이 함께 병합됩니다.

반면 다음 명령어를 실행하면:

```bash
git cherry-pick D
```

`D` 커밋의 변경 사항만 현재 브랜치에 적용됩니다.

```text
merge
→ 브랜치 전체 흐름을 가져온다.

cherry-pick
→ 특정 커밋 하나만 골라 가져온다.
```

---

## 4. `cherry-pick`은 기존 커밋을 그대로 가져오는 걸까?

엄밀히 말하면 기존 커밋 자체를 그대로 이동시키는 것은 아닙니다.

`git cherry-pick`은 지정한 커밋의 변경 내용을 현재 브랜치에 적용한 뒤, 새로운 커밋을 만듭니다.

그래서 원래 커밋과 cherry-pick으로 만들어진 커밋은 변경 내용은 같을 수 있지만 커밋 해시는 달라질 수 있습니다.

예를 들어 원래 커밋이 다음과 같다고 해보겠습니다.

```text
a1b2c3d Fix login bug
```

이를 다른 브랜치에서 cherry-pick하면 다음처럼 새로운 커밋이 생길 수 있습니다.

```text
k9l8m7n Fix login bug
```

두 커밋은 같은 변경 사항을 가질 수 있지만, 서로 다른 커밋입니다.

```text
원본 커밋
→ a1b2c3d

cherry-pick된 커밋
→ k9l8m7n
```

즉, cherry-pick은 커밋을 복사해서 현재 브랜치에 새로 적용하는 느낌으로 이해하면 좋습니다.

---

## 5. 실수로 다른 브랜치에 커밋했을 때

`git cherry-pick`은 실수로 다른 브랜치에 커밋했을 때도 유용합니다.

예를 들어 원래는 `feature/login` 브랜치에서 작업해야 했는데, 실수로 `main` 브랜치에 커밋했다고 해보겠습니다.

현재 커밋 기록은 다음과 같을 수 있습니다.

```text
main: A --- B --- C
                  ↑
        실수로 만든 커밋
```

이 커밋 `C`를 `feature/login` 브랜치로 가져오고 싶다면 다음처럼 할 수 있습니다.

먼저 커밋 해시를 확인합니다.

```bash
git log --oneline
```

예시:

```text
c3c3c3c Add login validation
b2b2b2b Update README
a1a1a1a Initial commit
```

그다음 올바른 브랜치로 이동합니다.

```bash
git switch feature/login
```

실수로 만든 커밋을 가져옵니다.

```bash
git cherry-pick c3c3c3c
```

이렇게 하면 `main`에 잘못 만든 커밋의 변경 사항을 `feature/login` 브랜치로 가져올 수 있습니다.

이후 `main`에서 해당 커밋을 제거할지는 상황에 따라 `reset`이나 `revert`로 처리할 수 있습니다.

---

## 6. cherry-pick 중 충돌이 날 수도 있다

`git cherry-pick`을 실행할 때 충돌이 발생할 수 있습니다.

예를 들어 가져오려는 커밋이 수정한 파일과 현재 브랜치에서 수정된 파일이 같은 부분을 건드렸다면, Git이 자동으로 적용하지 못할 수 있습니다.

이 경우 Git은 충돌이 난 파일을 알려줍니다.

```bash
git status
```

예시:

```text
both modified:   src/login.js
```

충돌 파일을 열어보면 다음과 같은 표시가 있을 수 있습니다.

```text
<<<<<<< HEAD
현재 브랜치의 내용
=======
cherry-pick으로 가져오려는 커밋의 내용
>>>>>>> a1b2c3d
```

이 부분을 직접 수정해서 최종 코드로 정리해야 합니다.

### 충돌 해결 후 계속 진행하기

cherry-pick 중 충돌이 발생하면 다음 흐름으로 해결합니다.

```bash
git status
# 충돌 파일 수정
git add <file>
git cherry-pick --continue
```

예를 들어 `src/login.js`에서 충돌이 났다면 다음처럼 처리합니다.

```bash
# src/login.js 파일에서 충돌 부분 수정
git add src/login.js
git cherry-pick --continue
```

그러면 Git은 cherry-pick을 계속 진행하고, 커밋을 완료합니다.

즉, 충돌이 난 경우에는 파일을 수정한 뒤 `git cherry-pick --continue`를 실행해야 합니다.

---

## 7. cherry-pick을 취소하고 싶을 때

cherry-pick 중 충돌이 발생했거나, 잘못된 커밋을 가져오고 있다는 것을 알게 되었다면 진행 중인 cherry-pick을 취소할 수 있습니다.

```bash
git cherry-pick --abort
```

이 명령어는 cherry-pick을 시작하기 전 상태로 되돌립니다.

예를 들어 다음 명령어를 실행했다가:

```bash
git cherry-pick a1b2c3d
```

충돌이 났고, 지금은 cherry-pick을 하지 않기로 했다면 다음처럼 취소합니다.

```bash
git cherry-pick --abort
```

이렇게 하면 진행 중이던 cherry-pick 작업이 중단됩니다.

---

## 8. 바로 커밋하지 않고 변경 사항만 적용하기

기본적으로 `git cherry-pick <commit-hash>`는 지정한 커밋의 변경 사항을 적용하고 새 커밋을 만듭니다.

하지만 경우에 따라 커밋은 바로 만들지 않고 변경 사항만 작업 디렉토리에 적용하고 싶을 수 있습니다.

이때는 `--no-commit` 옵션을 사용할 수 있습니다.

```bash
git cherry-pick --no-commit <commit-hash>
```

또는 짧게 `-n` 옵션을 사용할 수 있습니다.

```bash
git cherry-pick -n <commit-hash>
```

이 명령어는 지정한 커밋의 변경 사항을 현재 브랜치에 적용하지만, 자동으로 커밋하지는 않습니다.

그래서 변경 내용을 확인한 뒤 직접 커밋할 수 있습니다.

```bash
git cherry-pick -n <commit-hash>
git status -sb
git diff --staged
git commit -m "Apply selected changes"
```

여러 커밋을 가져온 뒤 하나의 커밋으로 묶고 싶을 때도 사용할 수 있습니다.

```bash
git cherry-pick -n a1b2c3d
git cherry-pick -n d4e5f6g
git commit -m "Apply selected fixes"
```

---

## 9. 여러 커밋을 cherry-pick하기

여러 커밋 해시를 한 번에 나열할 수 있습니다.

```bash
git cherry-pick <commit-hash-1> <commit-hash-2>
```

예를 들어 다음처럼 사용할 수 있습니다.

```bash
git cherry-pick a1b2c3d d4e5f6g
```

이 경우 Git은 지정한 커밋들을 순서대로 현재 브랜치에 적용합니다.

다만 중간에 충돌이 발생하면 충돌을 해결한 뒤 계속 진행해야 합니다.

```bash
git add <file>
git cherry-pick --continue
```

연속된 커밋 여러 개를 가져오고 싶을 때는 범위 표현을 사용할 수도 있습니다.

```bash
git cherry-pick A..D
```

이 표현은 일반적으로 `A` 이후부터 `D`까지의 커밋들을 적용하는 의미로 볼 수 있습니다.

다만 범위 표현은 처음에는 헷갈릴 수 있으므로, 초반에는 커밋 해시를 직접 나열하는 방식이 더 안전합니다.

```bash
git cherry-pick a1b2c3d d4e5f6g
```

가져올 커밋이 많다면 먼저 로그를 확인하는 것이 좋습니다.

```bash
git log --oneline --graph --all
```

---

## 10. 자주 쓰는 흐름

다른 브랜치의 특정 커밋을 가져올 때:

```bash
git log --oneline --all --graph
git switch <target-branch>
git cherry-pick <commit-hash>
```

예를 들어 `develop` 브랜치에 hotfix 커밋을 가져올 때:

```bash
git switch develop
git cherry-pick <hotfix-commit-hash>
```

cherry-pick 중 충돌이 났을 때:

```bash
git status
# 충돌 파일 수정
git add <file>
git cherry-pick --continue
```

cherry-pick을 취소하고 싶을 때:

```bash
git cherry-pick --abort
```

커밋하지 않고 변경 사항만 적용하고 싶을 때:

```bash
git cherry-pick -n <commit-hash>
```

---

## 11. 명령어 정리

| 명령어                                         | 의미                                 |
| ------------------------------------------- | ---------------------------------- |
| `git cherry-pick <commit-hash>`             | 특정 커밋의 변경 사항을 현재 브랜치에 적용하고 새 커밋 생성 |
| `git cherry-pick --continue`                | 충돌 해결 후 cherry-pick 계속 진행          |
| `git cherry-pick --abort`                   | 진행 중인 cherry-pick 취소               |
| `git cherry-pick --no-commit <commit-hash>` | 커밋하지 않고 변경 사항만 적용                  |
| `git cherry-pick -n <commit-hash>`          | `--no-commit`과 같은 의미               |

```text
git cherry-pick <commit-hash>
→ 특정 커밋 하나를 현재 브랜치로 가져온다.

git cherry-pick --continue
→ 충돌 해결 후 계속 진행한다.

git cherry-pick --abort
→ 진행 중인 cherry-pick을 취소한다.

git cherry-pick -n <commit-hash>
→ 커밋하지 않고 변경 사항만 적용한다.
```

---

## 12. 자주 헷갈리는 상황

### `cherry-pick`은 브랜치 전체를 가져오는 명령어인가?

아닙니다.

`cherry-pick`은 브랜치 전체가 아니라 특정 커밋을 가져오는 명령어입니다.

브랜치 전체 흐름을 합치고 싶다면 보통 `merge`나 `rebase`를 사용합니다.

```bash
git merge <branch>
```

특정 커밋만 가져오고 싶다면 `cherry-pick`을 사용합니다.

```bash
git cherry-pick <commit-hash>
```

### cherry-pick하면 커밋 해시도 그대로 유지될까?

보통 유지되지 않습니다.

`cherry-pick`은 기존 커밋의 변경 사항을 현재 브랜치에 새 커밋으로 적용합니다.

따라서 원본 커밋과 cherry-pick된 커밋은 변경 내용은 같아도 커밋 해시는 달라질 수 있습니다.

### 이미 가져온 커밋을 다시 cherry-pick하면 어떻게 될까?

상황에 따라 이미 적용된 변경이라고 판단되어 빈 커밋이 되거나, 충돌이 발생할 수 있습니다.

그래서 cherry-pick하기 전에 현재 브랜치에 이미 해당 변경이 들어와 있는지 확인하는 것이 좋습니다.

```bash
git log --oneline --all --graph
```

### cherry-pick 중 충돌이 나면 실패한 걸까?

실패라기보다는 Git이 자동으로 적용하지 못한 상태입니다.

충돌 파일을 직접 수정한 뒤 다음 명령어로 계속 진행하면 됩니다.

```bash
git add <file>
git cherry-pick --continue
```

진행하지 않고 취소하고 싶다면 다음 명령어를 사용합니다.

```bash
git cherry-pick --abort
```

---

## 마무리 정리

`git cherry-pick <commit-hash>`는 특정 커밋의 변경 사항만 현재 브랜치에 가져올 때 사용하는 명령어입니다.

브랜치 전체를 합치는 `merge`와 달리, `cherry-pick`은 필요한 커밋 하나만 선택해서 적용할 수 있습니다.

다른 브랜치의 hotfix 커밋을 가져오거나, 실수로 다른 브랜치에 만든 커밋을 올바른 브랜치로 가져올 때 유용합니다.

다만 cherry-pick은 기존 커밋을 그대로 이동시키는 것이 아니라, 같은 변경 사항을 가진 새 커밋을 현재 브랜치에 만드는 방식입니다.

충돌이 발생하면 파일을 수정한 뒤 `git cherry-pick --continue`를 실행하고, 취소하고 싶다면 `git cherry-pick --abort`를 사용할 수 있습니다.

한 문장으로 정리하면 다음과 같습니다.

> `git cherry-pick`은 다른 브랜치의 특정 커밋 하나를 골라 현재 브랜치에 새 커밋으로 적용하는 명령어이다.
