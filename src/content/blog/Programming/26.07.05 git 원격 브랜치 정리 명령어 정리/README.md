---
title: "Git 원격 브랜치 정리하기: git remote prune, git fetch --prune, git push --delete 정리"
slug: "git-remote-branch-cleanup-guide"
description: "git branch -r, git fetch --prune, git remote prune origin, git push origin --delete로 원격 브랜치를 확인하고 정리하는 방법을 정리합니다."
pubDate: "2026-07-05T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

Git으로 협업하다 보면 원격 저장소에 많은 브랜치가 생깁니다.

기능 개발용 브랜치, 버그 수정 브랜치, 테스트 브랜치 등이 계속 만들어지고, 작업이 끝나면 삭제되기도 합니다.

그런데 원격 저장소에서는 이미 삭제된 브랜치가 내 로컬 Git에는 계속 보이는 경우가 있습니다.

이럴 때 원격 브랜치 정보를 정리하거나, 원격 저장소의 브랜치를 삭제하는 명령어를 사용할 수 있습니다.

이번 글에서는 다음 명령어를 정리합니다.

```bash
git remote prune origin
git fetch --prune
git branch -r
git push origin --delete <branch>
```

---

## 1. 원격 브랜치란?

원격 브랜치는 GitHub, GitLab 같은 원격 저장소에 있는 브랜치를 의미합니다.

예를 들어 원격 저장소에 `main`, `develop`, `feature/login` 브랜치가 있다면, 로컬 Git에서는 보통 다음과 같은 형태로 보입니다.

```text
origin/main
origin/develop
origin/feature/login
```

여기서 `origin`은 원격 저장소의 이름이고, 그 뒤의 `main`, `develop`, `feature/login`은 원격 브랜치 이름입니다.

```text
origin/main
→ origin 원격 저장소의 main 브랜치
```

주의할 점은 `origin/main`은 실제 원격 브랜치 자체라기보다, 내 로컬 Git이 기억하고 있는 원격 브랜치의 상태입니다.

즉, 원격 저장소의 브랜치 정보를 로컬에 가져와서 추적하고 있는 것입니다.

---

## 2. `git branch -r`

```bash
git branch -r
```

`git branch -r`은 **원격 브랜치 목록을 확인하는 명령어**입니다.

여기서 `-r`은 remote의 의미입니다.

예를 들어 다음 명령어를 실행하면:

```bash
git branch -r
```

다음과 같은 결과가 나올 수 있습니다.

```bash
  origin/HEAD -> origin/main
  origin/main
  origin/develop
  origin/feature/login
  origin/feature/payment
```

이 결과는 현재 로컬 Git이 알고 있는 원격 브랜치 목록입니다.

`git branch -r`은 다음과 같은 상황에서 사용합니다.

```text
원격 저장소에 어떤 브랜치가 있는지 확인할 때
다른 사람이 만든 원격 브랜치가 보이는지 확인할 때
원격 브랜치가 삭제되었는지 확인할 때
원격 브랜치 정리 전후 상태를 비교할 때
```

예를 들어 원격 저장소에 `feature/login` 브랜치가 있는지 확인하고 싶다면 다음 명령어를 사용할 수 있습니다.

```bash
git branch -r
```

출력 결과에 다음 항목이 있다면:

```bash
origin/feature/login
```

내 로컬 Git은 현재 `origin/feature/login`이라는 원격 브랜치 정보를 알고 있는 상태입니다.

---

## 3. `git fetch --prune`

```bash
git fetch --prune
```

`git fetch --prune`은 원격 저장소의 최신 정보를 가져오면서, **원격에서 삭제된 브랜치의 추적 정보를 로컬에서도 정리하는 명령어**입니다.

여기서 `prune`은 가지치기, 정리하기 정도로 이해하면 됩니다.

즉, `git fetch --prune`은 다음 두 작업을 함께 수행합니다.

```text
원격 저장소의 최신 브랜치 정보 가져오기
원격에서 이미 삭제된 브랜치 정보를 로컬에서 정리하기
```

### 왜 `--prune`이 필요할까?

예를 들어 원격 저장소에 다음 브랜치가 있었다고 해보겠습니다.

```text
origin/main
origin/develop
origin/feature/login
```

그런데 GitHub에서 `feature/login` 브랜치가 삭제되었습니다.

하지만 내 로컬 Git에는 여전히 이전에 가져온 정보가 남아 있을 수 있습니다.

그래서 다음 명령어를 실행하면:

```bash
git branch -r
```

아직도 다음처럼 보일 수 있습니다.

```bash
origin/feature/login
```

이때 `git fetch --prune`을 실행하면 원격 저장소의 최신 정보를 가져오면서, 원격에서 삭제된 `origin/feature/login` 정보를 로컬에서도 정리합니다.

```bash
git fetch --prune
```

이후 다시 원격 브랜치 목록을 확인합니다.

```bash
git branch -r
```

그러면 원격에서 삭제된 브랜치 정보가 더 이상 보이지 않을 수 있습니다.

`git fetch --prune`은 다음 상황에서 유용합니다.

```text
원격에서 삭제된 브랜치가 로컬에 계속 보일 때
PR이 merge된 후 삭제된 브랜치 정보를 정리하고 싶을 때
오래된 origin/feature 브랜치가 너무 많이 보일 때
원격 브랜치 목록을 최신 상태로 맞추고 싶을 때
```

자주 쓰는 흐름은 다음과 같습니다.

```bash
git branch -r
git fetch --prune
git branch -r
```

이렇게 하면 정리 전후의 원격 브랜치 목록을 비교할 수 있습니다.

---

## 4. `git remote prune origin`

```bash
git remote prune origin
```

`git remote prune origin`은 **origin 원격 저장소에서 이미 삭제된 브랜치의 로컬 추적 정보를 정리하는 명령어**입니다.

즉, 원격 저장소에는 더 이상 존재하지 않는데, 내 로컬 Git에는 남아 있는 `origin/브랜치명` 정보를 제거합니다.

예를 들어 원격 저장소에서는 `feature/login` 브랜치가 삭제되었지만, 로컬에는 다음 정보가 남아 있다고 해보겠습니다.

```bash
origin/feature/login
```

이때 다음 명령어를 실행할 수 있습니다.

```bash
git remote prune origin
```

그러면 원격에는 없는 오래된 원격 추적 브랜치 정보가 로컬에서 정리됩니다.

### `git remote prune origin`과 `git fetch --prune` 차이

두 명령어는 비슷한 목적을 가집니다.

둘 다 원격에서 삭제된 브랜치의 로컬 추적 정보를 정리할 수 있습니다.

하지만 동작 방식에 차이가 있습니다.

| 명령어                       | 의미                             |
| ------------------------- | ------------------------------ |
| `git fetch --prune`       | 원격 최신 정보를 가져오면서 삭제된 브랜치 정보도 정리 |
| `git remote prune origin` | 원격에서 삭제된 브랜치의 로컬 추적 정보만 정리     |

간단히 말하면 다음과 같습니다.

```text
git fetch --prune
→ 최신 정보 가져오기 + 삭제된 브랜치 정리

git remote prune origin
→ 삭제된 원격 추적 브랜치 정보 정리
```

실무에서는 보통 `git fetch --prune`을 더 자주 사용해도 충분합니다.

원격 저장소의 최신 정보도 함께 가져오기 때문입니다.

반면 `git remote prune origin`은 원격에서 삭제된 브랜치 정보를 정리하는 목적이 더 직접적입니다.

---

## 5. `git push origin --delete <branch>`

```bash
git push origin --delete <branch>
```

`git push origin --delete <branch>`는 **원격 저장소의 브랜치를 삭제하는 명령어**입니다.

앞에서 본 `git fetch --prune`이나 `git remote prune origin`은 원격에서 이미 삭제된 브랜치의 로컬 추적 정보를 정리하는 명령어였습니다.

반면 `git push origin --delete <branch>`는 실제로 원격 저장소에 있는 브랜치를 삭제합니다.

예를 들어 원격 저장소의 `feature/login` 브랜치를 삭제하려면 다음처럼 입력합니다.

```bash
git push origin --delete feature/login
```

이 명령어는 `origin` 원격 저장소에 있는 `feature/login` 브랜치를 삭제합니다.

### 원격 브랜치 삭제와 로컬 정보 정리는 다르다

원격 브랜치 삭제와 로컬 추적 정보 정리가 다르다는 점이 중요합니다.

```bash
git push origin --delete feature/login
```

이 명령어는 원격 저장소의 `feature/login` 브랜치를 삭제합니다.

반면 다음 명령어들은:

```bash
git fetch --prune
git remote prune origin
```

원격에서 이미 삭제된 브랜치 정보를 내 로컬 Git에서 정리합니다.

즉, 역할을 이렇게 구분할 수 있습니다.

```text
git push origin --delete <branch>
→ 원격 저장소의 브랜치를 실제로 삭제

git fetch --prune
→ 원격에서 삭제된 브랜치 정보를 로컬에서도 정리

git remote prune origin
→ origin 기준으로 사라진 원격 추적 브랜치 정보 정리
```

`git push origin --delete`는 다음 상황에서 사용할 수 있습니다.

```text
기능 개발이 끝난 원격 브랜치를 삭제할 때
PR 또는 MR이 merge된 후 원격 feature 브랜치를 정리할 때
잘못 만든 원격 브랜치를 삭제하고 싶을 때
더 이상 사용하지 않는 원격 브랜치를 제거할 때
```

예를 들어 `feature/payment` 브랜치 작업이 끝났고, 이미 `main`에 병합되었다면 다음처럼 삭제할 수 있습니다.

```bash
git push origin --delete feature/payment
```

그 후 원격 브랜치 목록을 다시 확인합니다.

```bash
git branch -r
```

만약 로컬에 오래된 원격 추적 정보가 남아 있다면 다음 명령어로 정리합니다.

```bash
git fetch --prune
```

### 로컬 브랜치 삭제와 원격 브랜치 삭제

원격 브랜치 삭제와 로컬 브랜치 삭제는 명령어가 다릅니다.

로컬 브랜치를 삭제할 때는 다음 명령어를 사용합니다.

```bash
git branch -d <branch>
```

예시:

```bash
git branch -d feature/login
```

반면 원격 브랜치를 삭제할 때는 다음 명령어를 사용합니다.

```bash
git push origin --delete <branch>
```

예시:

```bash
git push origin --delete feature/login
```

차이는 다음과 같습니다.

| 목적               | 명령어                                 |
| ---------------- | ----------------------------------- |
| 로컬 브랜치 삭제        | `git branch -d <branch>`            |
| 원격 브랜치 삭제        | `git push origin --delete <branch>` |
| 삭제된 원격 브랜치 정보 정리 | `git fetch --prune`                 |

즉, 로컬 브랜치를 삭제했다고 해서 원격 브랜치가 자동으로 삭제되지는 않습니다.

반대로 원격 브랜치를 삭제했다고 해서 로컬 브랜치가 자동으로 삭제되는 것도 아닙니다.

---

## 6. 자주 쓰는 흐름

원격 브랜치 목록을 확인합니다.

```bash
git branch -r
```

원격 저장소에서 삭제된 브랜치 정보를 로컬에서도 정리합니다.

```bash
git fetch --prune
```

또는 다음 명령어를 사용할 수도 있습니다.

```bash
git remote prune origin
```

작업이 끝난 원격 브랜치를 삭제합니다.

```bash
git push origin --delete <branch>
```

예를 들어 `feature/login` 원격 브랜치를 삭제하려면:

```bash
git push origin --delete feature/login
```

삭제 후 원격 브랜치 목록을 다시 확인합니다.

```bash
git branch -r
```

---

## 7. 명령어별 정리

| 명령어                                 | 의미                                  |
| ----------------------------------- | ----------------------------------- |
| `git branch -r`                     | 원격 브랜치 목록 확인                        |
| `git fetch --prune`                 | 원격 최신 정보를 가져오면서 삭제된 원격 브랜치 추적 정보 정리 |
| `git remote prune origin`           | origin에서 삭제된 원격 브랜치 추적 정보 정리        |
| `git push origin --delete <branch>` | 원격 저장소의 브랜치 삭제                      |

```text
git branch -r
→ 원격 브랜치 목록을 확인한다.

git fetch --prune
→ 원격 정보를 가져오면서 사라진 원격 브랜치 정보를 정리한다.

git remote prune origin
→ origin 기준으로 사라진 원격 브랜치 정보를 정리한다.

git push origin --delete <branch>
→ 원격 저장소에 있는 브랜치를 삭제한다.
```

---

## 8. 자주 헷갈리는 상황

### `git branch -r`에 보이는 브랜치는 전부 실제 원격에 존재할까?

항상 그렇지는 않습니다.

`git branch -r`에 보이는 목록은 내 로컬 Git이 알고 있는 원격 브랜치 정보입니다.

원격에서 이미 삭제되었는데, 내 로컬 정보가 아직 갱신되지 않았다면 계속 보일 수 있습니다.

이럴 때는 다음 명령어로 정리합니다.

```bash
git fetch --prune
```

### `git remote prune origin`은 원격 브랜치를 삭제할까?

아닙니다.

`git remote prune origin`은 원격 저장소의 브랜치를 삭제하는 명령어가 아닙니다.

원격에서 이미 삭제된 브랜치의 로컬 추적 정보를 정리하는 명령어입니다.

즉, 원격 브랜치를 실제로 삭제하려면 다음 명령어를 사용해야 합니다.

```bash
git push origin --delete <branch>
```

### 원격 브랜치를 삭제하면 로컬 브랜치도 삭제될까?

아닙니다.

다음 명령어로 원격 브랜치를 삭제해도:

```bash
git push origin --delete feature/login
```

내 로컬의 `feature/login` 브랜치는 그대로 남아 있을 수 있습니다.

로컬 브랜치까지 삭제하고 싶다면 별도로 삭제해야 합니다.

```bash
git branch -d feature/login
```

### `git fetch --prune`과 `git remote prune origin` 중 무엇을 쓰면 좋을까?

보통은 `git fetch --prune`을 사용하면 충분합니다.

원격 저장소의 최신 정보도 가져오면서, 삭제된 원격 브랜치 추적 정보도 정리할 수 있기 때문입니다.

```bash
git fetch --prune
```

단순히 사라진 원격 추적 브랜치만 정리하고 싶다면 다음 명령어도 사용할 수 있습니다.

```bash
git remote prune origin
```

---

## 마무리 정리

원격 브랜치를 정리할 때는 먼저 `git branch -r`로 현재 로컬 Git이 알고 있는 원격 브랜치 목록을 확인합니다.

원격에서 이미 삭제된 브랜치 정보가 로컬에 남아 있다면 `git fetch --prune` 또는 `git remote prune origin`으로 정리할 수 있습니다.

반대로 원격 저장소에 실제로 존재하는 브랜치를 삭제하려면 `git push origin --delete <branch>`를 사용합니다.

한 문장으로 정리하면 다음과 같습니다.

> `git branch -r`은 원격 브랜치 목록을 확인하는 명령어이고, `git fetch --prune`과 `git remote prune origin`은 삭제된 원격 브랜치 정보를 로컬에서 정리하며, `git push origin --delete <branch>`는 원격 저장소의 브랜치를 실제로 삭제할 때 사용한다.
