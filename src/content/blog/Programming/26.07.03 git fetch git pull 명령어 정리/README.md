---
title: "Git 원격 변경 사항 가져오기: git fetch와 git pull 정리"
slug: "git-fetch-pull-command-guide"
description: "git fetch와 git pull의 차이, git fetch --prune, git pull origin 브랜치 사용법을 정리합니다."
pubDate: "2026-07-03T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

Git에서 원격 저장소의 변경 사항을 로컬로 가져올 때는 주로 `git fetch`와 `git pull`을 사용합니다.

두 명령어 모두 원격 저장소의 변경 사항을 가져오는 데 사용되지만, 동작 방식에는 중요한 차이가 있습니다.

```bash
git fetch
git fetch origin
git fetch --prune
git pull
git pull origin <branch>
```

이번 글에서는 위 명령어들을 기준으로, 원격 저장소의 변경 사항을 어떻게 가져오고 반영하는지 정리합니다.

---

## 1. 원격 저장소의 변경 사항을 가져온다는 뜻

Git 프로젝트는 보통 내 컴퓨터의 **로컬 저장소**와 GitHub, GitLab 같은 **원격 저장소**를 함께 사용합니다.

```text
로컬 저장소 → 내 컴퓨터에 있는 저장소
원격 저장소 → GitHub, GitLab 등에 있는 저장소
```

다른 사람이 원격 저장소에 새로운 커밋을 push하면, 내 로컬 저장소는 그 사실을 자동으로 알지 못합니다.

이때 원격 저장소의 최신 상태를 로컬 Git에 가져오기 위해 `fetch`나 `pull`을 사용합니다.

다만 두 명령어의 차이를 먼저 이해해야 합니다.

```text
git fetch → 원격 저장소의 최신 정보를 가져오기만 함
git pull  → 원격 저장소의 최신 정보를 가져오고 현재 브랜치에 반영함
```

즉, `fetch`는 비교적 안전하게 원격 상태를 확인하는 명령어이고, `pull`은 가져온 변경 사항을 현재 브랜치에 바로 반영하는 명령어입니다.

---

## 2. `git fetch`

```bash
git fetch
```

`git fetch`는 **원격 저장소의 최신 변경 정보를 로컬로 가져오는 명령어**입니다.

중요한 점은, `git fetch`는 원격 저장소의 변경 사항을 가져오지만 현재 작업 중인 브랜치의 파일을 바로 바꾸지는 않는다는 것입니다.

즉, `git fetch`는 원격 저장소의 최신 상태를 내 로컬 Git이 알 수 있게 해주는 명령어입니다.

### `git fetch`는 무엇을 갱신할까?

`git fetch`를 실행하면 로컬 브랜치가 바로 바뀌는 것이 아니라, 원격 추적 브랜치가 갱신됩니다.

예를 들어 원격 저장소에 `main` 브랜치가 있다면, 내 로컬 Git은 그 상태를 보통 다음 이름으로 기억합니다.

```text
origin/main
```

여기서 `origin/main`은 원격 저장소의 `main` 브랜치를 내 로컬 Git이 추적하는 브랜치입니다.

```text
main        → 내가 실제로 작업하는 로컬 브랜치
origin/main → 원격 저장소 main 브랜치의 상태를 나타내는 원격 추적 브랜치
```

`git fetch`를 실행하면 `origin/main`, `origin/develop` 같은 원격 추적 브랜치들이 최신 상태로 갱신됩니다.

하지만 내가 작업 중인 `main` 브랜치의 파일 내용은 자동으로 바뀌지 않습니다.

### `git fetch` 사용 예시

예를 들어 현재 `main` 브랜치에서 작업 중이라고 해보겠습니다.

```bash
git status -sb
```

```bash
## main...origin/main
```

이 상태에서 다른 사람이 원격 `main` 브랜치에 새로운 커밋을 push했을 수 있습니다.

다음 명령어를 실행합니다.

```bash
git fetch
```

그 후 다시 상태를 확인합니다.

```bash
git status -sb
```

```bash
## main...origin/main [behind 2]
```

이 결과는 로컬 `main` 브랜치가 원격의 `origin/main`보다 2커밋 뒤처져 있다는 뜻입니다.

즉, `git fetch`를 통해 원격 저장소에 새로운 커밋이 있다는 사실을 로컬 Git이 알게 된 것입니다.

### `git fetch` 후 변경 사항 확인하기

`git fetch`는 현재 브랜치에 변경 사항을 바로 반영하지 않기 때문에, 가져온 변경 내용을 먼저 확인할 수 있습니다.

원격에는 있지만 내 로컬 브랜치에는 없는 커밋을 확인하려면 다음처럼 사용할 수 있습니다.

```bash
git log --oneline HEAD..origin/main
```

파일 변경 내용을 확인하고 싶다면 다음처럼 볼 수 있습니다.

```bash
git diff HEAD..origin/main
```

이렇게 먼저 확인한 뒤, 문제가 없다고 판단되면 병합할 수 있습니다.

```bash
git merge origin/main
```

즉, `git fetch`는 원격 변경 사항을 바로 반영하지 않고 먼저 확인하고 싶을 때 유용합니다.

---

## 3. `git fetch origin`

```bash
git fetch origin
```

`git fetch origin`은 `origin`이라는 원격 저장소에서 최신 정보를 가져오는 명령어입니다.

여기서 `origin`은 보통 원격 저장소의 기본 이름입니다.

### `git fetch`와 `git fetch origin` 차이

대부분의 프로젝트에서는 원격 저장소가 하나만 등록되어 있고, 그 이름이 `origin`입니다.

| 명령어 | 의미 |
| --- | --- |
| `git fetch` | 기본 원격 저장소에서 최신 정보 가져오기 |
| `git fetch origin` | `origin`이라는 특정 원격 저장소에서 최신 정보 가져오기 |

원격 저장소가 하나뿐이라면 보통 `git fetch`만으로도 충분합니다.

하지만 여러 원격 저장소가 등록되어 있다면, 어떤 원격 저장소에서 가져올지 명확하게 지정하기 위해 `git fetch origin`처럼 작성할 수 있습니다.

예를 들어 원격 저장소가 여러 개라면 다음처럼 보일 수 있습니다.

```bash
git remote -v
```

```bash
origin    https://github.com/user/project.git (fetch)
upstream  https://github.com/original/project.git (fetch)
```

이 경우 `origin`에서 가져오려면:

```bash
git fetch origin
```

`upstream`에서 가져오려면:

```bash
git fetch upstream
```

처럼 사용할 수 있습니다.

---

## 4. `git fetch --prune`

```bash
git fetch --prune
```

`git fetch --prune`은 원격 저장소의 최신 정보를 가져오면서, **원격에서 삭제된 브랜치 정보를 로컬에서도 정리하는 명령어**입니다.

여기서 `prune`은 가지치기, 정리하기 정도의 의미로 이해할 수 있습니다.

### 왜 `--prune`이 필요할까?

예를 들어 원격 저장소에 다음 브랜치가 있었다고 해보겠습니다.

```text
origin/main
origin/develop
origin/feature/login
```

그런데 협업자가 GitHub에서 `feature/login` 브랜치를 삭제했습니다.

원격 저장소에서는 삭제되었지만, 내 로컬 Git에는 여전히 다음 정보가 남아 있을 수 있습니다.

```text
origin/feature/login
```

이 상태에서 `git branch -a`를 실행하면 원격에는 이미 삭제된 브랜치가 계속 보일 수 있습니다.

```bash
git branch -a
```

```bash
  main
  remotes/origin/main
  remotes/origin/develop
  remotes/origin/feature/login
```

이때 다음 명령어를 실행합니다.

```bash
git fetch --prune
```

그러면 원격 저장소의 최신 정보를 가져오면서, 원격에서 이미 삭제된 브랜치 추적 정보도 로컬에서 정리됩니다.

`git fetch --prune`은 다음 상황에서 유용합니다.

```text
원격에서 삭제된 브랜치가 로컬에 계속 보일 때
git branch -a 결과에 오래된 remotes/origin 브랜치가 많을 때
PR이 merge된 뒤 삭제된 브랜치 정보를 정리하고 싶을 때
로컬의 원격 추적 브랜치 목록을 깔끔하게 유지하고 싶을 때
```

---

## 5. `git pull`

```bash
git pull
```

`git pull`은 **원격 저장소의 변경 사항을 가져오고, 현재 브랜치에 바로 반영하는 명령어**입니다.

보통 `git pull`은 내부적으로 다음 두 작업을 수행한다고 이해할 수 있습니다.

```bash
git fetch
git merge
```

즉, 원격 저장소의 최신 정보를 가져온 뒤, 현재 브랜치에 병합합니다.

설정에 따라 merge 대신 rebase 방식으로 동작할 수도 있습니다.

처음에는 다음처럼 이해하면 충분합니다.

```text
git pull = 원격 변경 사항 가져오기 + 현재 브랜치에 반영하기
```

### `git pull` 사용 예시

현재 `main` 브랜치에 있다고 해보겠습니다.

```bash
git status -sb
```

```bash
## main...origin/main [behind 2]
```

이 상태는 로컬 `main` 브랜치가 원격의 `origin/main`보다 2커밋 뒤처져 있다는 뜻입니다.

이때 다음 명령어를 실행하면:

```bash
git pull
```

원격의 변경 사항을 가져와서 현재 `main` 브랜치에 반영합니다.

실행 후 상태가 다음처럼 바뀔 수 있습니다.

```bash
## main...origin/main
```

이제 로컬 `main`과 원격 `origin/main`이 같은 상태가 된 것입니다.

---

## 6. `git fetch`와 `git pull` 차이

`git fetch`와 `git pull`의 가장 큰 차이는 현재 브랜치에 변경 사항을 바로 반영하는지 여부입니다.

| 명령어 | 원격 정보 가져오기 | 현재 브랜치에 반영 |
| --- | --- | --- |
| `git fetch` | O | X |
| `git pull` | O | O |

원격 변경 사항을 먼저 확인하고 싶다면 `git fetch`가 더 안전합니다.

```bash
git fetch origin
git log --oneline HEAD..origin/main
git diff HEAD..origin/main
```

반대로 원격 변경 사항을 바로 반영해도 괜찮다면 `git pull`을 사용할 수 있습니다.

---

## 7. `git pull origin <branch>`

```bash
git pull origin <branch>
```

`git pull origin <branch>`는 `origin` 원격 저장소의 특정 브랜치 변경 사항을 가져와서 현재 브랜치에 반영하는 명령어입니다.

예를 들어 현재 브랜치에 원격 `main` 브랜치의 변경 사항을 가져와 반영하려면 다음처럼 입력할 수 있습니다.

```bash
git pull origin main
```

이 명령어는 다음과 비슷한 의미입니다.

```text
origin 원격 저장소의 main 브랜치를 가져와서 현재 브랜치에 병합한다.
```

주의할 점은, 이 명령어는 **현재 내가 위치한 브랜치에** 원격 브랜치의 변경 사항을 반영한다는 것입니다.

그래서 `pull`을 실행하기 전에는 현재 브랜치를 확인하는 것이 좋습니다.

```bash
git status -sb
```

### `git pull`과 `git pull origin <branch>` 차이

| 명령어 | 의미 |
| --- | --- |
| `git pull` | 현재 브랜치에 설정된 upstream 브랜치에서 가져와 반영 |
| `git pull origin <branch>` | `origin`의 특정 브랜치를 지정해서 가져와 현재 브랜치에 반영 |

일반적으로 현재 브랜치와 원격 추적 브랜치가 잘 연결되어 있다면 `git pull`만으로 충분합니다.

하지만 특정 원격 브랜치를 지정해서 가져오고 싶다면 `git pull origin <branch>`를 사용할 수 있습니다.

---

## 8. `pull` 전에 확인하면 좋은 것들

`git pull`은 현재 브랜치에 변경 사항을 바로 반영하기 때문에, 실행 전에 현재 상태를 확인하는 것이 좋습니다.

```bash
git status -sb
```

작업 중인 변경 사항이 있다면 먼저 커밋하거나 stash하는 것이 안전합니다.

```bash
git add .
git commit -m "WIP"
```

또는 임시 저장할 수도 있습니다.

```bash
git stash
git pull
git stash pop
```

특히 충돌이 날 가능성이 있거나, 원격 변경 사항을 먼저 보고 싶다면 `pull`보다 `fetch`를 먼저 사용하는 흐름이 더 안전합니다.

```bash
git fetch origin
git status -sb
git log --oneline HEAD..origin/main
```

---

## 9. 자주 쓰는 흐름

원격 변경 사항이 있는지 안전하게 확인하고 싶을 때:

```bash
git fetch origin
git status -sb
```

원격 브랜치의 커밋을 먼저 확인하고 싶을 때:

```bash
git log --oneline HEAD..origin/main
```

원격 브랜치와의 파일 차이를 확인하고 싶을 때:

```bash
git diff HEAD..origin/main
```

확인 후 현재 브랜치에 반영하고 싶을 때:

```bash
git merge origin/main
```

바로 원격 변경 사항을 가져와 반영하고 싶을 때:

```bash
git pull
```

특정 원격 브랜치를 지정해서 가져오고 싶을 때:

```bash
git pull origin main
```

원격에서 삭제된 브랜치 정보까지 정리하고 싶을 때:

```bash
git fetch --prune
```

---

## 10. 명령어별 정리

| 명령어 | 의미 |
| --- | --- |
| `git fetch` | 원격 저장소의 최신 정보를 가져오지만 현재 브랜치에는 반영하지 않음 |
| `git fetch origin` | `origin` 원격 저장소의 최신 정보를 가져옴 |
| `git fetch --prune` | 원격 최신 정보를 가져오면서 삭제된 원격 브랜치 추적 정보도 정리 |
| `git pull` | 원격 변경 사항을 가져와 현재 브랜치에 바로 반영 |
| `git pull origin <branch>` | `origin`의 특정 브랜치를 가져와 현재 브랜치에 반영 |

```text
git fetch
→ 원격 정보만 가져오기

git fetch origin
→ origin 원격 저장소 정보 가져오기

git fetch --prune
→ 원격 정보 가져오면서 삭제된 브랜치 정리

git pull
→ 원격 변경 사항 가져오고 현재 브랜치에 반영

git pull origin <branch>
→ 특정 원격 브랜치를 가져와 현재 브랜치에 반영
```

---

## 11. `fetch`와 `pull` 중 무엇을 쓰면 좋을까?

원격 변경 사항을 먼저 확인하고 싶다면 `fetch`를 사용하는 것이 좋습니다.

```bash
git fetch origin
git status -sb
git log --oneline HEAD..origin/main
git diff HEAD..origin/main
git merge origin/main
```

반대로 원격 변경 사항을 바로 현재 브랜치에 반영해도 괜찮은 상황이라면 `pull`을 사용할 수 있습니다.

```bash
git pull
```

처음 Git을 배우는 입장에서는 다음 기준으로 생각하면 좋습니다.

```text
안전하게 확인 먼저 → git fetch
바로 가져와서 반영 → git pull
```

---

## 마무리 정리

`git fetch`와 `git pull`은 모두 원격 저장소의 변경 사항을 가져올 때 사용하는 명령어입니다.

`git fetch`는 원격 저장소의 최신 정보를 가져오지만, 현재 브랜치에는 바로 반영하지 않습니다.

`git fetch origin`은 `origin` 원격 저장소에서 최신 정보를 가져오는 명령어입니다.

`git fetch --prune`은 원격 정보를 가져오면서, 원격에서 삭제된 브랜치 추적 정보까지 정리합니다.

반면 `git pull`은 원격 변경 사항을 가져온 뒤 현재 브랜치에 바로 반영합니다.

`git pull origin <branch>`는 특정 원격 브랜치를 지정해서 현재 브랜치에 반영할 때 사용합니다.

한 문장으로 정리하면 다음과 같습니다.

> `git fetch`는 원격 변경 사항을 가져와 확인할 수 있게 해주는 명령어이고, `git pull`은 원격 변경 사항을 가져와 현재 브랜치에 바로 반영하는 명령어이다.
