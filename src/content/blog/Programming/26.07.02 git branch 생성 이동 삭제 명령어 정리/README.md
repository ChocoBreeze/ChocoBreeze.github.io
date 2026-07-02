---
title: "Git 브랜치 생성·이동·삭제 명령어 정리"
slug: "git-branch-create-switch-delete-guide"
description: "git switch, git checkout, git branch로 브랜치를 생성하고 이동하고 삭제하는 방법을 정리합니다."
pubDate: "2026-07-02T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

Git에서 브랜치는 작업 흐름을 나누기 위해 사용합니다.

예를 들어 안정적인 코드는 `main` 브랜치에 두고, 새로운 기능은 `feature/login` 같은 별도 브랜치에서 작업할 수 있습니다.

브랜치를 사용하면 기존 코드에 바로 영향을 주지 않고 기능 개발, 버그 수정, 테스트 작업을 분리해서 진행할 수 있습니다.

이번 글에서는 브랜치를 **이동, 생성, 삭제**할 때 자주 사용하는 명령어를 정리합니다.

```bash
git switch <branch>
git switch -c <new-branch>
git checkout <branch>
git checkout -b <new-branch>
git branch <new-branch>
git branch -d <branch>
git branch -D <branch>
```

---

## 1. 브랜치 이동하기: `git switch <branch>`

```bash
git switch <branch>
```

`git switch <branch>`는 **현재 작업 브랜치를 다른 브랜치로 이동하는 명령어**입니다.

예를 들어 현재 `feature/login` 브랜치에 있는데 `main` 브랜치로 이동하고 싶다면 다음처럼 입력합니다.

```bash
git switch main
```

또는 `develop` 브랜치로 이동하려면 다음처럼 입력합니다.

```bash
git switch develop
```

브랜치 이동 후 현재 위치를 확인하고 싶다면 다음 명령어를 사용할 수 있습니다.

```bash
git branch
```

예시:

```bash
  develop
* main
  feature/login
```

여기서 `*` 표시가 붙은 브랜치가 현재 위치한 브랜치입니다.

`git switch`는 다음과 같은 상황에서 자주 사용합니다.

```text
main 브랜치로 돌아가고 싶을 때
develop 브랜치로 이동하고 싶을 때
작업 중인 feature 브랜치로 다시 이동하고 싶을 때
```

일반적인 사용 흐름은 다음과 같습니다.

```bash
git branch
git switch main
```

---

## 2. 새 브랜치 생성 후 이동하기: `git switch -c <new-branch>`

```bash
git switch -c <new-branch>
```

`git switch -c <new-branch>`는 **새 브랜치를 만들고, 바로 그 브랜치로 이동하는 명령어**입니다.

예를 들어 `feature/login`이라는 새 브랜치를 만들고 바로 이동하려면 다음처럼 입력합니다.

```bash
git switch -c feature/login
```

이 명령어는 다음 두 명령어를 한 번에 실행하는 것과 비슷합니다.

```bash
git branch feature/login
git switch feature/login
```

새로운 기능을 개발할 때는 보통 별도 브랜치를 만들어 작업합니다.

```bash
git switch -c feature/login     # 로그인 기능 개발
git switch -c fix/login-validation  # 버그 수정
git switch -c docs/update-readme    # 문서 수정
```

이렇게 브랜치 이름에 작업 목적을 넣어두면, 나중에 브랜치 목록을 봤을 때 어떤 작업을 위한 브랜치인지 쉽게 알 수 있습니다.

`git switch -c <new-branch>`를 실행하면 **현재 위치한 브랜치의 현재 커밋을 기준으로 새 브랜치가 만들어집니다.** 따라서 새 브랜치를 만들기 전에는 내가 어느 브랜치에 있는지 확인하는 것이 좋습니다.

```bash
git branch
git switch main          # 기준 브랜치로 이동
git switch -c feature/login  # 새 브랜치 생성
```

---

## 3. 예전 방식: `git checkout <branch>`, `git checkout -b <new-branch>`

```bash
git checkout <branch>
git checkout -b <new-branch>
```

`git checkout <branch>`는 예전부터 많이 사용되던 **브랜치 이동 명령어**입니다.

```bash
git checkout main
```

`git checkout -b <new-branch>`는 새 브랜치를 만들고 바로 이동하는 예전 방식입니다.

```bash
git checkout -b feature/login
```

이 두 명령어는 각각 다음 명령어와 같은 목적을 가집니다.

```bash
git switch main              # = git checkout main
git switch -c feature/login  # = git checkout -b feature/login
```

### 왜 `switch`를 사용할까?

`checkout`은 역할이 여러 개입니다.

```bash
git checkout develop       # 브랜치 이동
git checkout -- README.md  # 파일 수정 내용 되돌리기
```

이처럼 같은 `checkout`이지만 하나는 브랜치를 이동하고, 하나는 파일을 되돌립니다. 역할이 넓어서 처음 Git을 배울 때 헷갈릴 수 있습니다.

최근 Git에서는 역할을 더 명확하게 나누어 사용합니다.

```text
브랜치 이동 → git switch
파일 복구   → git restore
```

따라서 새로 Git을 정리하거나 학습한다면 브랜치 이동은 `git switch`로 설명하는 것이 더 이해하기 쉽습니다. 다만 기존 프로젝트 문서나 오래된 블로그 글에서는 아직도 `checkout`을 많이 볼 수 있으므로, `checkout`도 함께 알아두면 좋습니다.

---

## 4. `switch`와 `checkout` 비교

| 목적 | 요즘 방식 | 예전 방식 |
| --- | --- | --- |
| 기존 브랜치로 이동 | `git switch <branch>` | `git checkout <branch>` |
| 새 브랜치 생성 후 이동 | `git switch -c <new-branch>` | `git checkout -b <new-branch>` |

---

## 5. 브랜치 생성만 하기: `git branch <new-branch>`

```bash
git branch <new-branch>
```

`git branch <new-branch>`는 **새 브랜치를 생성만 하는 명령어**입니다.

중요한 점은 이 명령어는 브랜치를 만들기만 하고, 자동으로 그 브랜치로 이동하지는 않는다는 것입니다.

예를 들어 다음 명령어를 실행하면:

```bash
git branch feature/login
```

`feature/login` 브랜치는 생성됩니다. 하지만 현재 브랜치는 그대로입니다.

```bash
git branch
```

```bash
  feature/login
* main
```

`feature/login` 브랜치는 만들어졌지만, `*` 표시가 `main`에 있으므로 현재 브랜치는 여전히 `main`입니다.

생성한 브랜치로 이동하려면 다음 명령어를 추가로 실행해야 합니다.

```bash
git switch feature/login
```

| 명령어 | 동작 |
| --- | --- |
| `git branch <new-branch>` | 새 브랜치를 만들기만 함 |
| `git switch -c <new-branch>` | 새 브랜치를 만들고 바로 이동함 |

```text
생성만 하기 → git branch <new-branch>
생성 후 이동 → git switch -c <new-branch>
```

---

## 6. 브랜치 삭제하기: `git branch -d <branch>`

```bash
git branch -d <branch>
```

`git branch -d <branch>`는 **로컬 브랜치를 삭제하는 명령어**입니다. 여기서 `-d`는 delete의 의미입니다.

예를 들어 `feature/login` 브랜치를 삭제하려면 다음처럼 입력합니다.

```bash
git branch -d feature/login
```

다만 현재 위치한 브랜치는 삭제할 수 없습니다. 현재 `feature/login` 브랜치에 있으면서 `feature/login`을 삭제하려고 하면 실패합니다. 이 경우 먼저 다른 브랜치로 이동해야 합니다.

```bash
git switch main
git branch -d feature/login
```

`-d` 옵션은 비교적 안전한 삭제 방식입니다. 브랜치가 아직 병합되지 않았다면 Git이 경고를 보여주고 삭제를 막을 수 있습니다.

---

## 7. 브랜치 강제 삭제하기: `git branch -D <branch>`

```bash
git branch -D <branch>
```

`git branch -D <branch>`는 **로컬 브랜치를 강제로 삭제하는 명령어**입니다. 대문자 `-D`는 강제 삭제를 의미합니다.

`-D`는 아직 병합되지 않은 브랜치도 삭제할 수 있습니다. 즉, 해당 브랜치에만 있던 커밋이 사라질 수 있으므로 조심해서 사용해야 합니다.

| 명령어 | 의미 | 특징 |
| --- | --- | --- |
| `git branch -d <branch>` | 브랜치 삭제 | 병합되지 않은 브랜치는 삭제를 막을 수 있음 |
| `git branch -D <branch>` | 브랜치 강제 삭제 | 병합 여부와 상관없이 강제로 삭제 |

일반적으로는 먼저 `-d`를 사용하는 것이 좋습니다. 작업 내용이 필요한지 애매하다면 먼저 로그를 확인하는 것이 좋습니다.

```bash
git log --oneline feature/login
```

---

## 8. 자주 쓰는 브랜치 작업 흐름

새 기능 작업을 시작할 때는 보통 다음 흐름을 사용합니다.

```bash
git switch main
git pull
git switch -c feature/login
```

```text
main 브랜치로 이동
원격 저장소의 최신 변경 사항 반영
feature/login 브랜치를 만들고 이동
```

작업 후 커밋합니다.

```bash
git add .
git commit -m "Add login feature"
```

작업이 끝나고 병합까지 완료했다면 로컬 브랜치를 삭제할 수 있습니다.

```bash
git switch main
git branch -d feature/login
```

---

## 9. 명령어별 정리

| 명령어 | 의미 |
| --- | --- |
| `git switch <branch>` | 기존 브랜치로 이동 |
| `git switch -c <new-branch>` | 새 브랜치를 만들고 바로 이동 |
| `git checkout <branch>` | 기존 브랜치로 이동하는 예전 방식 |
| `git checkout -b <new-branch>` | 새 브랜치를 만들고 이동하는 예전 방식 |
| `git branch <new-branch>` | 새 브랜치를 만들기만 함 |
| `git branch -d <branch>` | 로컬 브랜치 삭제 |
| `git branch -D <branch>` | 로컬 브랜치 강제 삭제 |

```text
브랜치 이동         → git switch <branch>
브랜치 생성 후 이동  → git switch -c <new-branch>
브랜치 생성만 하기   → git branch <new-branch>
브랜치 삭제         → git branch -d <branch>
브랜치 강제 삭제     → git branch -D <branch>
```

---

## 마무리 정리

Git에서 브랜치를 이동할 때는 `git switch <branch>`를 사용합니다.

새 브랜치를 만들고 바로 이동할 때는 `git switch -c <new-branch>`를 사용합니다.

예전 방식으로는 `git checkout <branch>`, `git checkout -b <new-branch>`도 많이 사용됩니다.

브랜치를 만들기만 하려면 `git branch <new-branch>`를 사용하고, 삭제할 때는 `git branch -d <branch>`를 사용합니다.

강제로 삭제해야 할 때는 `git branch -D <branch>`를 사용할 수 있지만, 병합되지 않은 작업이 사라질 수 있으므로 주의해야 합니다.

한 문장으로 정리하면 다음과 같습니다.

> 브랜치 이동과 생성 후 이동은 `git switch`를 사용하는 것이 명확하고, 브랜치 생성만 할 때는 `git branch <new-branch>`, 삭제할 때는 `git branch -d <branch>` 또는 `git branch -D <branch>`를 사용한다.
