---
title: "Git 파일 추적/삭제/정리 명령어 정리: git rm, git mv, git clean"
slug: "git-rm-mv-clean-command-guide"
description: "git rm, git rm --cached, git mv, git clean -n, git clean -fd로 파일을 삭제하고 정리하는 방법을 정리합니다."
pubDate: "2026-07-05T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

Git으로 작업하다 보면 파일을 삭제하거나, Git 추적 대상에서 제외하거나, 파일 이름을 변경해야 하는 경우가 있습니다.

또는 작업 중 생긴 임시 파일, 빌드 결과물, 테스트 파일처럼 Git이 추적하지 않는 파일들을 정리해야 할 때도 있습니다.

이때 사용할 수 있는 명령어가 `git rm`, `git mv`, `git clean`입니다.

이번 글에서는 다음 명령어를 정리합니다.

```bash
git rm <file>
git rm --cached <file>
git mv <old-name> <new-name>
git clean -n
git clean -fd
```

---

## 1. Git 파일 관리 명령어는 크게 두 종류로 나눌 수 있다

이번 글에서 다루는 명령어는 크게 두 가지로 나눌 수 있습니다.

첫 번째는 **Git이 이미 추적 중인 파일을 관리하는 명령어**입니다.

```bash
git rm <file>
git rm --cached <file>
git mv <old-name> <new-name>
```

두 번째는 **Git이 추적하지 않는 파일을 정리하는 명령어**입니다.

```bash
git clean -n
git clean -fd
```

여기서 중요한 기준은 Git이 해당 파일을 추적하고 있는지 여부입니다.

```text
tracked file
→ Git이 이미 관리하고 있는 파일

untracked file
→ Git이 아직 관리하지 않는 파일
```

예를 들어 이미 커밋된 `README.md`는 tracked file입니다.

반면 새로 생성했지만 아직 `git add`하지 않은 `temp.txt`는 untracked file입니다.

`git status -sb`로 보면 다음처럼 구분할 수 있습니다.

```bash
git status -sb
```

예시:

```bash
 M README.md
?? temp.txt
```

여기서 `README.md`는 Git이 추적 중인 파일이고, `temp.txt`는 아직 추적하지 않는 파일입니다.

---

## 2. `git rm <file>`

```bash
git rm <file>
```

`git rm <file>`은 **Git이 추적 중인 파일을 삭제하고, 그 삭제 내역을 스테이징하는 명령어**입니다.

예를 들어 Git이 관리 중인 `old.txt` 파일을 삭제하고 싶다면 다음처럼 입력합니다.

```bash
git rm old.txt
```

이 명령어를 실행하면 두 가지 일이 일어납니다.

```text
1. 실제 작업 디렉토리에서 old.txt 파일이 삭제된다.
2. Git에는 old.txt가 삭제되었다는 변경 사항이 스테이징된다.
```

즉, `git rm`은 단순히 파일만 삭제하는 명령어가 아니라, Git에게 "이 파일 삭제를 기록해줘"라고 알려주는 명령어입니다.

### 그냥 파일을 삭제하는 것과 `git rm`의 차이

파일 탐색기나 `rm` 명령어로 파일을 직접 삭제할 수도 있습니다.

예를 들어 다음처럼 삭제할 수 있습니다.

```bash
rm old.txt
```

그 후 상태를 확인하면 Git은 파일이 삭제되었다고 인식합니다.

```bash
git status -sb
```

예시:

```bash
 D old.txt
```

하지만 이 상태는 아직 스테이징되지 않은 삭제입니다.

커밋에 포함하려면 다시 `git add`를 해야 합니다.

```bash
git add old.txt
```

반면 `git rm old.txt`를 사용하면 파일 삭제와 스테이징이 한 번에 처리됩니다.

```bash
git rm old.txt
```

정리하면 다음과 같습니다.

| 방법               | 실제 파일 삭제 | 삭제 내역 스테이징 |
| ---------------- | -------: | ---------: |
| `rm old.txt`     |        O |          X |
| `git rm old.txt` |        O |          O |

즉, Git에 파일 삭제를 바로 기록하고 싶다면 `git rm`을 사용하면 됩니다.

### `git rm <file>` 사용 흐름

예를 들어 `old.txt` 파일을 삭제하고 커밋하려면 다음 흐름을 사용할 수 있습니다.

```bash
git status -sb
git rm old.txt
git status -sb
git commit -m "Remove old file"
```

삭제 후 상태를 보면 다음처럼 표시될 수 있습니다.

```bash
D  old.txt
```

여기서 왼쪽 칸의 `D`는 삭제 내역이 스테이징되었다는 뜻입니다.

즉, 다음 커밋에 `old.txt` 삭제가 포함됩니다.

---

## 3. `git rm --cached <file>`

```bash
git rm --cached <file>
```

`git rm --cached <file>`은 **실제 파일은 삭제하지 않고, Git의 추적 대상에서만 제거하는 명령어**입니다.

즉, 파일은 내 폴더에 그대로 남아 있지만 Git은 더 이상 그 파일을 관리하지 않습니다.

예를 들어 실수로 `config.local` 파일을 Git에 추가했다고 해보겠습니다.

```bash
git add config.local
git commit -m "Add local config"
```

그런데 이 파일이 개인 설정 파일이라 Git에서 추적하면 안 되는 파일이었다면, 다음 명령어로 Git 추적만 해제할 수 있습니다.

```bash
git rm --cached config.local
```

이 명령어는 `config.local` 파일을 실제로 삭제하지 않습니다.

다만 Git 입장에서는 해당 파일이 저장소에서 제거된 것으로 기록됩니다.

### `--cached`는 왜 사용할까?

`git rm --cached`는 보통 다음 상황에서 사용합니다.

```text
실수로 Git에 추가한 파일을 추적 대상에서 제거하고 싶을 때
.env 같은 개인 설정 파일을 Git에서 빼고 싶을 때
빌드 결과물이나 로그 파일을 더 이상 Git으로 관리하지 않으려 할 때
파일은 로컬에 남겨두고 저장소에서만 제거하고 싶을 때
```

대표적인 예시는 `.env` 파일입니다.

```bash
git rm --cached .env
```

그리고 앞으로 다시 Git에 올라가지 않도록 `.gitignore`에 추가합니다.

```text
.env
```

그 후 변경 사항을 커밋합니다.

```bash
git add .gitignore
git commit -m "Stop tracking env file"
```

이렇게 하면 `.env` 파일은 내 로컬에는 남아 있지만, Git 저장소에서는 추적되지 않게 됩니다.

### `git rm`과 `git rm --cached` 차이

두 명령어의 차이는 실제 파일을 삭제하는지 여부입니다.

| 명령어                      | 실제 파일 삭제 | Git 추적 해제 | 삭제 내역 스테이징 |
| ------------------------ | -------: | --------: | ---------: |
| `git rm <file>`          |        O |         O |          O |
| `git rm --cached <file>` |        X |         O |          O |

간단히 정리하면 다음과 같습니다.

```text
git rm <file>
→ 파일도 삭제하고, Git에서도 제거한다.

git rm --cached <file>
→ 파일은 남기고, Git 추적만 해제한다.
```

따라서 파일 자체를 없애고 싶다면 `git rm`을 사용하고, 파일은 보관하되 Git에서만 제외하고 싶다면 `git rm --cached`를 사용하면 됩니다.

---

## 4. `git mv <old-name> <new-name>`

```bash
git mv <old-name> <new-name>
```

`git mv <old-name> <new-name>`은 **Git이 추적 중인 파일의 이름을 변경하거나 위치를 이동할 때 사용하는 명령어**입니다.

예를 들어 `old-name.txt` 파일 이름을 `new-name.txt`로 바꾸고 싶다면 다음처럼 입력합니다.

```bash
git mv old-name.txt new-name.txt
```

이 명령어를 실행하면 Git은 파일 이름 변경을 변경 사항으로 인식합니다.

```text
old-name.txt → new-name.txt
```

상태를 확인하면 다음처럼 보일 수 있습니다.

```bash
git status -sb
```

예시:

```bash
R  old-name.txt -> new-name.txt
```

여기서 `R`은 rename, 즉 파일 이름 변경을 의미합니다.

`git mv`는 다음 상황에서 사용할 수 있습니다.

```text
파일 이름을 변경할 때
파일을 다른 폴더로 이동할 때
Git이 추적 중인 파일의 경로를 바꿀 때
이름 변경 내역을 명확하게 기록하고 싶을 때
```

예를 들어 `README-old.md`를 `README.md`로 바꾸고 싶다면 다음처럼 사용할 수 있습니다.

```bash
git mv README-old.md README.md
```

파일을 다른 폴더로 이동할 때도 사용할 수 있습니다.

```bash
git mv app.js src/app.js
```

### 직접 이름을 바꾸는 것과 `git mv`의 차이

파일 탐색기에서 이름을 직접 바꾸거나, 터미널에서 `mv` 명령어를 사용할 수도 있습니다.

```bash
mv old-name.txt new-name.txt
```

이 경우 Git은 보통 기존 파일이 삭제되고 새 파일이 생긴 것처럼 볼 수 있습니다.

```bash
 D old-name.txt
?? new-name.txt
```

이 상태에서 다시 `git add`를 하면 Git이 이름 변경으로 인식할 수 있습니다.

```bash
git add old-name.txt new-name.txt
```

반면 `git mv`를 사용하면 이름 변경과 스테이징이 한 번에 처리됩니다.

```bash
git mv old-name.txt new-name.txt
```

정리하면 다음과 같습니다.

| 방법               | 이름 변경 | 스테이징 |
| ---------------- | ----: | ---: |
| `mv old new`     |     O |    X |
| `git mv old new` |     O |    O |

즉, Git이 관리 중인 파일의 이름을 바꾸거나 이동할 때는 `git mv`를 사용하면 편합니다.

---

## 5. `git clean -n`

```bash
git clean -n
```

`git clean -n`은 **Git이 추적하지 않는 파일 중 삭제될 파일을 미리 확인하는 명령어**입니다.

여기서 `clean`은 정리한다는 의미이고, `-n`은 실제로 삭제하지 않고 미리보기만 한다는 의미입니다.

즉, `git clean -n`은 안전 확인용 명령어입니다.

예를 들어 다음처럼 추적되지 않는 파일이 있다고 해보겠습니다.

```bash
git status -sb
```

예시:

```bash
?? temp.txt
?? test-output.log
```

이 상태에서 다음 명령어를 실행합니다.

```bash
git clean -n
```

그러면 실제로 삭제하지 않고, 삭제될 파일만 보여줍니다.

```bash
Would remove temp.txt
Would remove test-output.log
```

즉, `git clean -n`은 다음 의미입니다.

```text
지금 clean을 실행하면 어떤 파일이 삭제될지 미리 보여준다.
실제로 삭제하지는 않는다.
```

### `git clean -n`은 왜 중요할까?

`git clean`은 Git이 추적하지 않는 파일을 삭제하는 명령어입니다.

문제는 untracked file 중에도 중요한 파일이 있을 수 있다는 점입니다.

예를 들어 다음 파일들이 untracked 상태일 수 있습니다.

```text
새로 만든 소스 파일
아직 git add하지 않은 문서
로컬 설정 파일
임시 테스트 파일
빌드 결과물
```

이 중에는 삭제해도 되는 파일도 있지만, 아직 커밋하지 않았을 뿐 중요한 파일도 있을 수 있습니다.

그래서 실제 삭제 명령어를 실행하기 전에 항상 `git clean -n`으로 미리 확인하는 것이 좋습니다.

```bash
git clean -n
```

---

## 6. `git clean -fd`

```bash
git clean -fd
```

`git clean -fd`는 **Git이 추적하지 않는 파일과 디렉토리를 실제로 삭제하는 명령어**입니다.

여기서 옵션의 의미는 다음과 같습니다.

```text
-f
→ force, 실제 삭제 실행

-d
→ directory, 추적되지 않는 디렉토리도 삭제 대상에 포함
```

예를 들어 다음과 같은 untracked 파일과 폴더가 있다고 해보겠습니다.

```bash
git status -sb
```

예시:

```bash
?? temp.txt
?? test-output/
```

먼저 삭제될 대상을 미리 확인합니다.

```bash
git clean -n
```

예시:

```bash
Would remove temp.txt
```

디렉토리까지 포함해서 미리 확인하려면 다음처럼 사용할 수 있습니다.

```bash
git clean -fdn
```

예시:

```bash
Would remove temp.txt
Would remove test-output/
```

삭제해도 되는 것이 확실하다면 다음 명령어를 실행합니다.

```bash
git clean -fd
```

그러면 추적되지 않는 파일과 디렉토리가 실제로 삭제됩니다.

### `git clean -fd` 사용 시 주의점

`git clean -fd`는 매우 조심해서 사용해야 합니다.

이 명령어는 Git이 추적하지 않는 파일을 삭제합니다.

그런데 Git이 추적하지 않는 파일은 아직 커밋되지 않은 새 파일일 수도 있습니다.

예를 들어 새로 만든 `new-feature.js` 파일을 아직 `git add`하지 않았다면, Git 입장에서는 untracked file입니다.

```bash
?? new-feature.js
```

이 상태에서 `git clean -fd`를 실행하면 이 파일도 삭제될 수 있습니다.

따라서 실제 삭제 전에는 반드시 미리보기 명령어를 먼저 실행하는 것이 좋습니다.

```bash
git clean -n
```

디렉토리까지 확인하고 싶다면 다음처럼 실행합니다.

```bash
git clean -fdn
```

삭제 대상이 정말 필요 없는 파일인지 확인한 후에만 실행합니다.

```bash
git clean -fd
```

---

## 7. `git rm`과 `git clean` 차이

`git rm`과 `git clean`은 둘 다 파일 삭제와 관련된 명령어입니다.

하지만 대상이 다릅니다.

| 명령어                      | 대상                 | 의미                    |
| ------------------------ | ------------------ | --------------------- |
| `git rm <file>`          | Git이 추적 중인 파일      | 파일 삭제 + 삭제 내역 스테이징    |
| `git rm --cached <file>` | Git이 추적 중인 파일      | 실제 파일은 남기고 Git 추적만 해제 |
| `git clean -n`           | Git이 추적하지 않는 파일    | 삭제될 untracked 파일 미리보기 |
| `git clean -fd`          | Git이 추적하지 않는 파일/폴더 | untracked 파일/폴더 실제 삭제 |

간단히 정리하면 다음과 같습니다.

```text
tracked file 정리
→ git rm, git rm --cached, git mv

untracked file 정리
→ git clean
```

즉, Git이 이미 관리하는 파일을 삭제하거나 이동할 때는 `git rm`, `git mv`를 사용합니다.

반면 Git이 아직 관리하지 않는 파일을 정리할 때는 `git clean`을 사용합니다.

---

## 8. 자주 쓰는 흐름

Git이 추적 중인 파일을 삭제하고 커밋할 때:

```bash
git status -sb
git rm old.txt
git commit -m "Remove old file"
```

파일은 남기고 Git 추적만 해제할 때:

```bash
git rm --cached .env
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Stop tracking env file"
```

파일 이름을 변경하고 커밋할 때:

```bash
git mv old-name.txt new-name.txt
git commit -m "Rename file"
```

추적되지 않는 파일을 삭제하기 전에 확인할 때:

```bash
git clean -n
```

추적되지 않는 파일과 폴더를 실제로 삭제할 때:

```bash
git clean -fd
```

더 안전한 흐름은 다음과 같습니다.

```bash
git status -sb
git clean -fdn
git clean -fd
```

---

## 9. 명령어별 정리

| 명령어                            | 의미                              |
| ------------------------------ | ------------------------------- |
| `git rm <file>`                | Git이 추적 중인 파일을 삭제하고 삭제 내역을 스테이징 |
| `git rm --cached <file>`       | 실제 파일은 남기고 Git 추적 대상에서만 제거      |
| `git mv <old-name> <new-name>` | Git이 추적 중인 파일 이름 변경 또는 이동       |
| `git clean -n`                 | 삭제될 untracked 파일 미리보기           |
| `git clean -fd`                | untracked 파일과 디렉토리 실제 삭제        |

```text
git rm <file>
→ 파일을 삭제하고 Git에도 삭제 내역을 기록한다.

git rm --cached <file>
→ 파일은 남기고 Git 추적만 해제한다.

git mv <old-name> <new-name>
→ 파일 이름 변경 또는 이동을 Git에 기록한다.

git clean -n
→ 삭제될 untracked 파일을 미리 확인한다.

git clean -fd
→ untracked 파일과 폴더를 실제로 삭제한다.
```

---

## 10. 자주 헷갈리는 상황

### `git rm --cached`는 파일을 삭제할까?

아닙니다.

`git rm --cached <file>`은 실제 파일은 삭제하지 않습니다.

Git 추적 대상에서만 제거합니다.

```bash
git rm --cached .env
```

이 명령어를 실행하면 `.env` 파일은 내 폴더에 남아 있지만, Git은 더 이상 해당 파일을 추적하지 않습니다.

### `.gitignore`에 추가하면 이미 추적 중인 파일도 자동으로 빠질까?

아닙니다.

이미 Git이 추적 중인 파일은 `.gitignore`에 추가해도 자동으로 추적이 해제되지 않습니다.

이럴 때는 `git rm --cached`를 함께 사용해야 합니다.

```bash
git rm --cached .env
```

그 후 `.gitignore`에 추가합니다.

```text
.env
```

그리고 변경 사항을 커밋합니다.

```bash
git add .gitignore
git commit -m "Stop tracking env file"
```

### `git clean -fd`는 커밋된 파일도 삭제할까?

아닙니다.

`git clean -fd`는 Git이 추적하지 않는 파일과 디렉토리를 삭제합니다.

이미 Git이 추적 중인 파일은 `git clean -fd`의 대상이 아닙니다.

하지만 아직 `git add`하지 않은 새 파일은 untracked 상태이므로 삭제될 수 있습니다.

그래서 실행 전에는 반드시 미리보기 명령어를 사용하는 것이 좋습니다.

```bash
git clean -fdn
```

### `git clean -n`과 `git clean -fdn`은 뭐가 다를까?

`git clean -n`은 삭제될 untracked 파일을 미리 보여줍니다.

하지만 디렉토리까지 포함해서 확인하려면 `-d` 옵션이 필요합니다.

```bash
git clean -n
```

```bash
git clean -fdn
```

실제 삭제 전에는 `git clean -fdn`으로 확인하고, 정말 삭제해도 될 때 `git clean -fd`를 실행하는 것이 안전합니다.

---

## 마무리 정리

Git에서 파일을 삭제하거나 이동할 때는 해당 파일이 Git의 추적 대상인지 먼저 생각해야 합니다.

Git이 이미 추적 중인 파일을 삭제하려면 `git rm <file>`을 사용합니다.

파일은 남겨두고 Git 추적만 해제하려면 `git rm --cached <file>`을 사용합니다.

파일 이름을 변경하거나 위치를 이동하려면 `git mv <old-name> <new-name>`을 사용할 수 있습니다.

반면 Git이 추적하지 않는 파일을 정리할 때는 `git clean`을 사용합니다.

`git clean -n`은 삭제될 파일을 미리 보여주고, `git clean -fd`는 untracked 파일과 디렉토리를 실제로 삭제합니다.

한 문장으로 정리하면 다음과 같습니다.

> `git rm`과 `git mv`는 Git이 추적 중인 파일을 삭제하거나 이동할 때 사용하고, `git clean`은 Git이 추적하지 않는 파일을 정리할 때 사용하는 명령어이다.
