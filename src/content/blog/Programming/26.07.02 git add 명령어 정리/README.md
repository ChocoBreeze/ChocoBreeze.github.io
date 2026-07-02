---
title: "git add 명령어 정리"
slug: "git-add-command-guide"
description: "git add <file>, git add ., git add -A의 차이와 스테이징 영역의 개념을 정리합니다."
pubDate: "2026-07-02T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

`git add`는 Git에서 **변경된 파일을 스테이징 영역에 올리는 명령어**입니다.

Git은 파일을 수정했다고 해서 바로 커밋에 포함하지 않습니다.
커밋에 포함할 파일을 먼저 선택해야 하는데, 이때 사용하는 명령어가 `git add`입니다.

가장 기본적인 사용법은 다음과 같습니다.

```bash
git add <file>
```

예를 들어 `README.md` 파일을 커밋에 포함하고 싶다면 다음처럼 입력합니다.

```bash
git add README.md
```

---

## 1. 스테이징이란?

`git add`를 이해하려면 먼저 **스테이징 영역**을 알아야 합니다.

Git에서는 작업 내용이 바로 커밋으로 저장되지 않고, 보통 다음 흐름을 거칩니다.

```text
작업 디렉토리 → 스테이징 영역 → 커밋
```

각 영역은 다음과 같이 이해할 수 있습니다.

```text
작업 디렉토리: 실제로 파일을 수정하는 공간
스테이징 영역: 다음 커밋에 포함할 변경 사항을 올려두는 공간
커밋: Git 저장소에 확정된 기록
```

즉, 파일을 수정한 뒤 바로 `git commit`을 하는 것이 아니라, 먼저 `git add`로 커밋할 내용을 선택합니다.

```bash
git add README.md
git commit -m "Update README"
```

이 흐름에서 `git add README.md`는 `README.md` 파일의 변경 내용을 다음 커밋에 포함하겠다는 의미입니다.

---

## 2. `git add <file>`

```bash
git add <file>
```

`git add <file>`은 **특정 파일 하나를 스테이징하는 명령어**입니다.

예를 들어 다음과 같이 파일들이 수정되어 있다고 해보겠습니다.

```bash
git status -sb
```

```bash
 M README.md
 M app.js
?? memo.txt
```

이 상태에서 `README.md`만 커밋에 포함하고 싶다면 다음처럼 입력합니다.

```bash
git add README.md
```

그 후 상태를 다시 확인하면 다음과 비슷하게 보일 수 있습니다.

```bash
M  README.md
 M app.js
?? memo.txt
```

여기서 중요한 점은 `README.md` 앞의 `M` 위치입니다.

```text
M  README.md
```

왼쪽 칸의 `M`은 해당 파일이 스테이징되었다는 뜻입니다.

반면:

```text
 M app.js
```

오른쪽 칸의 `M`은 파일이 수정되었지만 아직 스테이징되지 않았다는 뜻입니다.

즉, `git add README.md`를 실행하면 `README.md`만 커밋 준비 상태가 되고, 다른 파일들은 그대로 남아 있습니다.

`git add <file>`은 다음 상황에서 유용합니다.

```text
여러 파일 중 특정 파일만 커밋하고 싶을 때
작업 내용을 기능별로 나누어 커밋하고 싶을 때
실수로 관련 없는 파일까지 커밋하지 않도록 조심하고 싶을 때
```

예를 들어 `README.md` 수정과 `app.js` 수정이 서로 다른 작업이라면 한 번에 커밋하지 않고 나누는 것이 좋습니다.

```bash
git add README.md
git commit -m "Update README"

git add app.js
git commit -m "Fix app logic"
```

이렇게 하면 커밋 기록이 더 명확해집니다.

---

## 3. `git add .`

```bash
git add .
```

`git add .`은 **현재 디렉토리 기준으로 변경된 파일들을 한 번에 스테이징하는 명령어**입니다.

여기서 `.`은 현재 디렉토리를 의미합니다. 즉, 현재 위치한 폴더와 그 하위 폴더에 있는 변경 사항을 스테이징합니다.

다음과 같은 상태가 있다고 해보겠습니다.

```bash
git status -sb
```

```bash
 M README.md
 M src/app.js
?? src/login.js
```

이 상태에서 다음 명령어를 실행합니다.

```bash
git add .
```

그 후 상태를 확인하면 다음과 비슷하게 바뀝니다.

```bash
M  README.md
M  src/app.js
A  src/login.js
```

의미는 다음과 같습니다.

```text
README.md 수정 사항이 스테이징됨
src/app.js 수정 사항이 스테이징됨
src/login.js 새 파일이 스테이징됨
```

즉, `git add .`은 여러 파일을 한 번에 커밋 준비 상태로 만들 때 편리합니다.

다만 `git add .`은 원하지 않는 파일까지 스테이징될 수 있습니다. 예를 들어 `test.log`, `.env` 같은 파일도 함께 스테이징될 수 있습니다. 특히 `.env` 파일에는 API 키, 비밀번호, 토큰 같은 민감한 정보가 들어갈 수 있으므로 조심해야 합니다.

그래서 `git add .`을 사용하기 전에는 먼저 상태를 확인하는 것이 좋습니다.

```bash
git status -sb
```

그리고 스테이징한 뒤에는 실제 커밋에 들어갈 내용을 다시 확인하는 습관이 좋습니다.

```bash
git diff --staged
```

---

## 4. `git add -A`

```bash
git add -A
```

`git add -A`는 **저장소 전체의 변경 사항을 모두 스테이징하는 명령어**입니다. 여기서 `-A`는 all의 의미로 이해하면 됩니다.

`git add -A`는 다음 변경 사항을 모두 포함합니다.

```text
수정된 파일
새로 추가된 파일
삭제된 파일
```

다음과 같은 상태가 있다고 해보겠습니다.

```bash
git status -sb
```

```bash
 M README.md
?? memo.txt
 D old-file.txt
```

각 표시의 의미는 다음과 같습니다.

```text
M  → 수정된 파일
?? → 새로 추가되었지만 아직 Git이 추적하지 않는 파일
D  → 삭제된 파일
```

이 상태에서 다음 명령어를 실행하면:

```bash
git add -A
```

수정, 추가, 삭제가 모두 스테이징됩니다.

```bash
M  README.md
A  memo.txt
D  old-file.txt
```

즉, `git add -A`는 작업 디렉토리의 변경 사항을 전체적으로 커밋에 포함하고 싶을 때 사용합니다.

---

## 5. `git add .`과 `git add -A`의 차이

요즘 Git에서는 프로젝트 루트에서 사용할 경우 `git add .`과 `git add -A`가 비슷하게 동작하는 경우가 많습니다. 하지만 개념적으로는 차이가 있습니다.

| 명령어 | 기준 | 포함하는 변경 |
| --- | --- | --- |
| `git add .` | 현재 디렉토리 기준 | 현재 디렉토리 아래의 변경 사항 |
| `git add -A` | 저장소 전체 기준 | 저장소 전체의 수정, 추가, 삭제 사항 |

중요한 차이는 **현재 어느 디렉토리에서 명령어를 실행하느냐**입니다.

예를 들어 프로젝트 구조가 다음과 같다고 해보겠습니다.

```text
project/
  README.md
  src/
    app.js
```

현재 위치가 `project/src`라면 `git add .`은 `src` 폴더 아래의 변경 사항만 스테이징합니다. 반면 `git add -A`는 저장소 전체의 변경 사항을 기준으로 스테이징합니다.

따라서 저장소 전체 변경 사항을 확실히 모두 반영하고 싶다면 `git add -A`가 더 명확합니다.

삭제된 파일도 Git 입장에서는 하나의 변경 사항이기 때문에, 커밋에 포함하려면 스테이징이 필요합니다. `git add -A`를 사용하면 삭제된 파일까지 확실히 스테이징됩니다.

---

## 6. 명령어별 비교

`git add` 관련 명령어를 정리하면 다음과 같습니다.

| 명령어 | 의미 | 사용하기 좋은 상황 |
| --- | --- | --- |
| `git add <file>` | 특정 파일만 스테이징 | 원하는 파일만 골라서 커밋하고 싶을 때 |
| `git add .` | 현재 디렉토리 기준 변경 사항 스테이징 | 현재 위치 아래의 변경 사항을 한 번에 올릴 때 |
| `git add -A` | 저장소 전체 변경 사항 스테이징 | 수정, 추가, 삭제를 모두 반영하고 싶을 때 |

간단히 정리하면 다음과 같습니다.

```text
git add <file> → 특정 파일만 add
git add .      → 현재 디렉토리 아래 변경 사항 add
git add -A     → 저장소 전체 변경 사항 add
```

---

## 7. 자주 쓰는 흐름

커밋하기 전 가장 기본적인 흐름은 다음과 같습니다.

```bash
git status -sb
git diff
git add <file>
git diff --staged
git commit -m "커밋 메시지"
```

여러 파일을 한 번에 커밋하려면 다음처럼 사용할 수 있습니다.

```bash
git status -sb
git diff
git add .
git diff --staged
git commit -m "커밋 메시지"
```

저장소 전체의 수정, 추가, 삭제를 모두 반영하려면 다음 흐름도 사용할 수 있습니다.

```bash
git status -sb
git diff
git add -A
git diff --staged
git commit -m "커밋 메시지"
```

중요한 점은 `git add` 후 바로 커밋하지 않고, 가능하면 `git diff --staged`로 실제 커밋에 들어갈 내용을 확인하는 것입니다.

---

## 8. 자주 헷갈리는 상황

### `git add`는 커밋이 아니다

`git add`를 실행했다고 해서 변경 사항이 저장소 기록에 확정되는 것은 아닙니다.

```bash
git add README.md
```

이 명령어는 단지 `README.md`를 다음 커밋에 포함할 준비를 하는 것입니다. 실제로 기록을 남기려면 `git commit`을 해야 합니다.

```bash
git commit -m "Update README"
```

즉, `git add`는 커밋 전 준비 단계입니다.

### `git add .`을 했는데 원하지 않는 파일이 올라간 경우

`git add .`을 실행한 뒤 원하지 않는 파일이 스테이징되었다면, 다음 명령어로 스테이징을 취소할 수 있습니다.

```bash
git restore --staged <file>
```

예를 들어 `.env` 파일을 실수로 스테이징했다면 다음처럼 취소합니다.

```bash
git restore --staged .env
```

파일 내용은 그대로 유지되고, 스테이징만 취소됩니다.

### 새 파일이 계속 `??`로 보이는 경우

새 파일을 만들면 `git status`에서 다음처럼 보입니다.

```bash
?? memo.txt
```

`??`는 Git이 아직 추적하지 않는 파일이라는 뜻입니다. 이 파일을 커밋에 포함하려면 다음처럼 `git add`를 해야 합니다.

```bash
git add memo.txt
```

반대로 Git에 포함하고 싶지 않은 파일이라면 `.gitignore`에 추가하는 것이 좋습니다.

```gitignore
memo.txt
.env
*.log
```

---

## 마무리 정리

`git add`는 변경된 파일을 스테이징 영역에 올리는 명령어입니다.

`git add <file>`은 특정 파일만 스테이징할 때 사용합니다.

`git add .`은 현재 디렉토리 기준으로 변경 사항을 한 번에 스테이징할 때 사용합니다.

`git add -A`는 저장소 전체의 수정, 추가, 삭제 사항을 모두 스테이징할 때 사용합니다.

한 문장으로 정리하면 다음과 같습니다.

> `git add`는 커밋에 포함할 변경 사항을 선택하는 명령어이며, `<file>`은 특정 파일만, `.`은 현재 디렉토리 기준 변경 사항을, `-A`는 저장소 전체 변경 사항을 스테이징할 때 사용한다.
