---
title: "Git 원격 저장소에 올리기: git push 정리"
slug: "git-push-command-guide"
description: "git push, git push origin 브랜치, git push -u origin 브랜치의 차이와 upstream 설정 방법을 정리합니다."
pubDate: "2026-07-03T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

Git에서 `git push`는 **로컬 저장소의 커밋을 원격 저장소에 올리는 명령어**입니다.

내 컴퓨터에서 작업한 커밋은 처음에는 로컬 저장소에만 존재합니다.
이 커밋을 GitHub, GitLab 같은 원격 저장소에 올려야 다른 사람과 공유하거나, 원격 저장소에 백업할 수 있습니다.

이번 글에서는 다음 명령어를 기준으로 `push`를 정리합니다.

```bash
git push
git push origin <branch>
git push -u origin <branch>
```

---

## 1. `git push`란?

`git push`는 로컬 브랜치의 커밋을 원격 저장소로 업로드하는 명령어입니다.

예를 들어 로컬 `main` 브랜치에서 작업한 뒤 커밋을 만들었다고 해보겠습니다.

```bash
git add .
git commit -m "Update README"
```

이 커밋은 아직 내 컴퓨터에만 있습니다.

이 커밋을 원격 저장소에 올리려면 다음 명령어를 사용합니다.

```bash
git push
```

즉, `git push`는 로컬에서 만든 커밋을 원격 저장소에 반영하는 명령어입니다.

---

## 2. `git push`

```bash
git push
```

`git push`는 현재 브랜치에 설정된 원격 추적 브랜치, 즉 upstream 브랜치로 커밋을 올립니다.

예를 들어 로컬 `main` 브랜치가 원격의 `origin/main`과 연결되어 있다면, 다음 명령어는 로컬 `main`의 커밋을 원격 `origin/main`으로 올립니다.

```bash
git push
```

즉, 다음과 비슷하게 동작한다고 이해할 수 있습니다.

```bash
git push origin main
```

다만 `git push`만 사용하려면 현재 브랜치가 어느 원격 브랜치와 연결되어 있어야 합니다.

### upstream 브랜치란?

upstream 브랜치는 로컬 브랜치가 기본적으로 연결된 원격 브랜치입니다.

예를 들어 다음과 같은 관계가 있다고 해보겠습니다.

```text
로컬 main → 원격 origin/main
```

이 경우 로컬 `main` 브랜치의 upstream 브랜치는 `origin/main`입니다.

이렇게 연결되어 있으면 현재 `main` 브랜치에서 다음 명령어만 실행해도 됩니다.

```bash
git push
```

현재 브랜치가 어떤 원격 브랜치를 추적하고 있는지는 다음 명령어로 확인할 수 있습니다.

```bash
git branch -vv
```

예시:

```bash
* main          a1b2c3d [origin/main: ahead 1] Update README
  feature/login d4e5f6g [origin/feature/login] Add login page
```

여기서 `[origin/main: ahead 1]`은 로컬 `main` 브랜치가 `origin/main`을 추적하고 있으며, 원격보다 1커밋 앞서 있다는 뜻입니다.

이 상태에서 `git push`를 실행하면 그 1커밋이 원격 `origin/main`으로 올라갑니다.

### `ahead` 상태와 push

`git status -sb`나 `git branch -vv`에서 다음과 같은 표시를 볼 수 있습니다.

```bash
## main...origin/main [ahead 1]
```

이 뜻은 로컬 `main` 브랜치에 원격 `origin/main`에는 없는 커밋이 1개 있다는 의미입니다.

즉, 아직 원격 저장소에 올리지 않은 커밋이 있다는 뜻입니다.

이때 다음 명령어를 실행하면:

```bash
git push
```

로컬에만 있던 커밋이 원격 저장소에 올라갑니다.

push 후 다시 상태를 확인하면 다음처럼 표시될 수 있습니다.

```bash
## main...origin/main
```

이제 로컬 브랜치와 원격 브랜치가 같은 상태가 된 것입니다.

---

## 3. `git push origin <branch>`

```bash
git push origin <branch>
```

`git push origin <branch>`는 로컬 브랜치의 커밋을 `origin` 원격 저장소의 특정 브랜치로 올리는 명령어입니다.

예를 들어 현재 `main` 브랜치의 커밋을 원격 `origin/main`으로 올리고 싶다면 다음처럼 사용할 수 있습니다.

```bash
git push origin main
```

또는 `feature/login` 브랜치를 원격 저장소에 올리고 싶다면 다음처럼 사용할 수 있습니다.

```bash
git push origin feature/login
```

이 명령어는 로컬 `feature/login` 브랜치의 커밋을 원격 `origin/feature/login` 브랜치로 올립니다.

### `git push`와 `git push origin <branch>` 차이

| 명령어 | 의미 |
| --- | --- |
| `git push` | 현재 브랜치에 설정된 upstream 브랜치로 push |
| `git push origin <branch>` | `origin`의 특정 브랜치로 명시적으로 push |

예를 들어 로컬 `main` 브랜치가 이미 `origin/main`과 연결되어 있다면 다음 명령어만으로 충분합니다.

```bash
git push
```

하지만 어떤 원격 저장소의 어떤 브랜치로 올릴지 명확히 지정하고 싶다면 다음처럼 사용할 수 있습니다.

```bash
git push origin main
```

`git push origin <branch>`는 다음 상황에서 자주 사용합니다.

```text
현재 브랜치를 특정 원격 브랜치로 명시적으로 올리고 싶을 때
upstream 설정이 되어 있지 않지만 일단 push하고 싶을 때
여러 원격 저장소가 있어 origin을 명확히 지정하고 싶을 때
```

---

## 4. `git push -u origin <branch>`

```bash
git push -u origin <branch>
```

`git push -u origin <branch>`는 로컬 브랜치를 원격 저장소에 올리면서, 동시에 upstream 브랜치를 설정하는 명령어입니다.

여기서 `-u`는 `--set-upstream`의 짧은 옵션입니다.

즉, 다음 두 명령어는 같은 의미입니다.

```bash
git push -u origin feature/login
git push --set-upstream origin feature/login
```

이 명령어는 새 브랜치를 처음 원격 저장소에 올릴 때 자주 사용합니다.

### `-u` 옵션의 의미

`-u` 옵션을 사용하면 두 가지 일이 일어납니다.

```text
1. 로컬 feature/login 브랜치가 원격 origin/feature/login으로 push됨
2. 로컬 feature/login 브랜치가 origin/feature/login을 추적하도록 설정됨
```

이후에는 같은 브랜치에서 다음 명령어만 실행해도 됩니다.

```bash
git push
git pull
```

Git이 이미 현재 브랜치가 어떤 원격 브랜치와 연결되어 있는지 알고 있기 때문입니다.

### 새 브랜치를 처음 push할 때

새 브랜치를 만들고 처음 원격 저장소에 올리는 흐름은 보통 다음과 같습니다.

```bash
git switch -c feature/login
git add .
git commit -m "Add login feature"
git push -u origin feature/login
```

이후 같은 브랜치에서 추가 작업 후 push할 때는 다음처럼 간단히 사용할 수 있습니다.

```bash
git add .
git commit -m "Fix login validation"
git push
```

처음에 `-u` 옵션으로 upstream을 설정해두었기 때문입니다.

### `git push -u`를 하지 않으면?

새 브랜치에서 처음으로 `git push`만 실행하면 Git이 다음과 비슷한 메시지를 보여줄 수 있습니다.

```text
fatal: The current branch feature/login has no upstream branch.
```

이 의미는 현재 로컬 브랜치가 어떤 원격 브랜치와 연결되어 있지 않다는 뜻입니다.

이때는 다음 명령어를 실행하면 됩니다.

```bash
git push -u origin feature/login
```

한 번 upstream을 설정하고 나면 이후에는 `git push`만으로 push할 수 있습니다.

---

## 5. `git push origin <branch>`와 `git push -u origin <branch>` 차이

두 명령어는 모두 원격 저장소에 브랜치를 올릴 수 있습니다.

| 명령어 | push | upstream 설정 |
| --- | --- | --- |
| `git push origin <branch>` | O | X |
| `git push -u origin <branch>` | O | O |

`git push origin feature/login`은 브랜치를 원격에 올리지만, 이후에 `git push`만 입력했을 때 바로 동작하지 않을 수 있습니다.

반면 `git push -u origin feature/login`은 브랜치를 원격에 올리면서 추적 관계까지 설정합니다.

그래서 새 브랜치를 처음 원격에 올릴 때는 보통 `git push -u origin <branch>`를 사용하는 것이 편합니다.

---

## 6. 자주 쓰는 흐름

기존 브랜치에서 커밋 후 push할 때:

```bash
git status -sb
git add .
git commit -m "Update README"
git push
```

특정 브랜치를 명시해서 push할 때:

```bash
git push origin main
```

새 브랜치를 만들고 처음 원격에 올릴 때:

```bash
git switch -c feature/login
git add .
git commit -m "Add login feature"
git push -u origin feature/login
```

이후 같은 브랜치에서 추가 작업 후 push할 때:

```bash
git add .
git commit -m "Fix login validation"
git push
```

---

## 7. 자주 헷갈리는 상황

### `git push`를 했는데 upstream이 없다고 나오는 경우

새 브랜치에서 처음 `git push`를 실행하면 다음과 같은 메시지가 나올 수 있습니다.

```text
fatal: The current branch feature/login has no upstream branch.
```

이 경우 현재 브랜치가 원격 브랜치와 연결되어 있지 않은 상태입니다.

다음 명령어를 실행하면 됩니다.

```bash
git push -u origin feature/login
```

### `git push`가 거부되는 경우

원격 브랜치에 내 로컬에 없는 커밋이 있으면 push가 거부될 수 있습니다.

예를 들어 다른 사람이 먼저 원격 저장소에 커밋을 올린 경우입니다.

이 경우 먼저 원격 변경 사항을 가져와야 합니다.

```bash
git fetch origin
git status -sb
```

또는 바로 반영하려면:

```bash
git pull
```

그 후 충돌이 없다면 다시 push합니다.

```bash
git push
```

즉, push가 거부될 때는 보통 원격 저장소가 내 로컬보다 앞서 있는 경우가 많습니다.

### 현재 브랜치 이름을 모를 때

현재 브랜치 이름을 확인하려면 다음 명령어를 사용할 수 있습니다.

```bash
git branch
```

또는 간단히 상태를 볼 수도 있습니다.

```bash
git status -sb
```

예시:

```bash
## feature/login...origin/feature/login
```

이 경우 현재 브랜치는 `feature/login`입니다.

---

## 8. 명령어별 정리

| 명령어 | 의미 |
| --- | --- |
| `git push` | 현재 브랜치의 커밋을 연결된 원격 브랜치로 push |
| `git push origin <branch>` | `origin` 원격 저장소의 특정 브랜치로 push |
| `git push -u origin <branch>` | 원격 브랜치로 push하면서 upstream 관계 설정 |

```text
git push
→ 현재 브랜치에 설정된 원격 브랜치로 올리기

git push origin <branch>
→ origin의 특정 브랜치로 명시해서 올리기

git push -u origin <branch>
→ 처음 원격에 올리면서 이후 git push만 가능하도록 연결하기
```

---

## 마무리 정리

`git push`는 로컬 저장소의 커밋을 원격 저장소에 올리는 명령어입니다.

현재 브랜치가 원격 브랜치와 연결되어 있다면 `git push`만으로 커밋을 올릴 수 있습니다.

특정 브랜치를 명시해서 올리고 싶다면 `git push origin <branch>`를 사용합니다.

새 브랜치를 처음 원격 저장소에 올릴 때는 `git push -u origin <branch>`를 사용하는 것이 좋습니다.

`-u` 옵션은 로컬 브랜치와 원격 브랜치의 upstream 관계를 설정해주기 때문에, 이후에는 같은 브랜치에서 `git push`나 `git pull`만 입력해도 됩니다.

한 문장으로 정리하면 다음과 같습니다.

> `git push`는 로컬 커밋을 원격 저장소에 올리는 명령어이며, 새 브랜치를 처음 올릴 때는 `git push -u origin <branch>`로 upstream을 설정해두면 이후 동기화가 편해진다.
