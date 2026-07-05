---
title: "Git 파일 되돌리기: git restore 정리"
slug: "git-restore-command-guide"
description: "git restore <file>, git restore ., git restore --source로 파일 변경 내용을 되돌리는 방법을 정리합니다."
pubDate: "2026-07-05T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

`git restore`는 Git에서 **파일의 변경 내용을 되돌릴 때 사용하는 명령어**입니다.

작업하다 보면 파일을 수정했지만, 다시 이전 상태로 되돌리고 싶은 경우가 있습니다.

예를 들어 `README.md`를 수정했는데 수정 내용이 마음에 들지 않거나, 실수로 잘못 변경한 경우가 있을 수 있습니다.

이때 사용할 수 있는 명령어가 `git restore`입니다.

이번 글에서는 다음 명령어를 정리합니다.

```bash
git restore <file>
git restore .
git restore --source=<commit-hash> <file>
```

---

## 1. `git restore`는 무엇을 되돌릴까?

`git restore`는 기본적으로 **작업 디렉토리의 파일 변경 내용을 되돌리는 명령어**입니다.

Git에서는 보통 다음 흐름으로 작업합니다.

```text
작업 디렉토리 → 스테이징 영역 → 커밋
```

여기서 작업 디렉토리는 실제로 파일을 수정하는 공간입니다.

예를 들어 `README.md` 파일을 수정하면, Git은 이 파일을 "수정됨" 상태로 인식합니다.

```bash
git status -sb
```

```bash
 M README.md
```

이 상태에서 `git restore README.md`를 실행하면, `README.md`의 수정 내용이 마지막 커밋 상태로 되돌아갑니다.

즉, `git restore`는 커밋 기록을 바꾸는 명령어가 아니라, **아직 커밋하지 않은 파일 변경 내용을 되돌리는 명령어**입니다.

---

## 2. `git restore <file>`

```bash
git restore <file>
```

`git restore <file>`은 **특정 파일의 수정 내용을 마지막 커밋 상태로 되돌리는 명령어**입니다.

예를 들어 `README.md` 파일을 수정했다고 해보겠습니다.

```bash
git status -sb
```

```bash
 M README.md
```

이 상태에서 다음 명령어를 실행합니다.

```bash
git restore README.md
```

그러면 `README.md` 파일의 수정 내용이 사라지고, 마지막 커밋 상태로 돌아갑니다.

다시 상태를 확인하면 다음처럼 깨끗한 상태가 될 수 있습니다.

```bash
git status -sb
```

```bash
## main...origin/main
```

즉, `git restore README.md`는 다음 의미입니다.

```text
README.md 파일의 아직 커밋하지 않은 수정 내용을 버리고,
마지막 커밋 상태로 되돌린다.
```

### `git restore <file>` 사용 시 주의점

`git restore <file>`은 파일 수정 내용을 되돌리는 명령어입니다.

따라서 아직 커밋하지 않은 변경 내용이 사라질 수 있습니다.

예를 들어 `README.md`에 다음 문장을 추가했다고 해보겠습니다.

```text
Add git restore explanation
```

이 상태에서 다음 명령어를 실행하면:

```bash
git restore README.md
```

방금 추가한 문장은 사라집니다.

즉, `git restore <file>`은 "스테이징 취소"가 아니라 **파일 수정 내용 자체를 되돌리는 명령어**입니다.

스테이징만 취소하고 파일 수정 내용은 남기고 싶다면 다음 명령어를 사용해야 합니다.

```bash
git restore --staged README.md
```

두 명령어의 차이는 다음과 같습니다.

| 명령어                           | 의미            | 파일 수정 내용 |
| ----------------------------- | ------------- | -------- |
| `git restore <file>`          | 파일 수정 내용 되돌리기 | 사라질 수 있음 |
| `git restore --staged <file>` | 스테이징만 취소하기    | 유지됨      |

따라서 파일 내용을 정말 되돌려도 되는지 확인한 뒤 사용하는 것이 좋습니다.

### `git restore <file>`은 언제 사용할까?

`git restore <file>`은 다음과 같은 상황에서 사용할 수 있습니다.

```text
파일을 잘못 수정해서 마지막 커밋 상태로 되돌리고 싶을 때
실험적으로 수정한 내용을 버리고 싶을 때
특정 파일만 원래 상태로 되돌리고 싶을 때
커밋하지 않은 변경 사항을 제거하고 싶을 때
```

예를 들어 `app.js`는 유지하고, `README.md` 수정 내용만 버리고 싶다면 다음처럼 사용할 수 있습니다.

```bash
git restore README.md
```

이 경우 `README.md`만 되돌아가고, 다른 파일의 수정 내용은 그대로 남아 있습니다.

---

## 3. `git restore .`

```bash
git restore .
```

`git restore .`은 **현재 디렉토리 아래의 수정 내용을 모두 되돌리는 명령어**입니다.

여기서 `.`은 현재 디렉토리를 의미합니다.

예를 들어 다음과 같이 여러 파일이 수정되어 있다고 해보겠습니다.

```bash
git status -sb
```

```bash
 M README.md
 M src/app.js
 M src/login.js
```

이 상태에서 다음 명령어를 실행하면:

```bash
git restore .
```

현재 디렉토리와 그 하위 디렉토리에 있는 수정 내용이 모두 마지막 커밋 상태로 되돌아갑니다.

즉, 위 예시에서는 `README.md`, `src/app.js`, `src/login.js`의 수정 내용이 모두 사라질 수 있습니다.

### `git restore .` 사용 시 주의점

`git restore .`은 여러 파일의 수정 내용을 한 번에 되돌리기 때문에 매우 조심해야 합니다.

특히 다음과 같은 상태에서:

```bash
 M README.md
 M app.js
 M test.js
```

다음 명령어를 실행하면:

```bash
git restore .
```

세 파일의 수정 내용이 모두 사라질 수 있습니다.

따라서 `git restore .`을 실행하기 전에는 반드시 현재 변경 상태를 확인하는 것이 좋습니다.

```bash
git status -sb
```

또는 어떤 내용이 바뀌었는지 먼저 확인할 수 있습니다.

```bash
git diff
```

만약 변경 내용을 나중에 다시 사용할 가능성이 있다면, 바로 restore하지 말고 커밋하거나 stash를 사용하는 것이 더 안전합니다.

```bash
git stash
```

### `git restore <file>`과 `git restore .` 차이

두 명령어의 차이는 되돌리는 범위입니다.

| 명령어                  | 의미                       | 범위               |
| -------------------- | ------------------------ | ---------------- |
| `git restore <file>` | 특정 파일의 수정 내용 되돌리기        | 지정한 파일           |
| `git restore .`      | 현재 디렉토리 아래 수정 내용 모두 되돌리기 | 현재 디렉토리와 하위 디렉토리 |

간단히 정리하면 다음과 같습니다.

```text
git restore README.md
→ README.md 파일만 되돌림

git restore .
→ 현재 디렉토리 아래의 수정 내용을 모두 되돌림
```

처음에는 `git restore .`보다 `git restore <file>`을 사용하는 것이 더 안전합니다.

되돌릴 파일을 명확히 지정할 수 있기 때문입니다.

---

## 4. `git restore --source=<commit-hash> <file>`

```bash
git restore --source=<commit-hash> <file>
```

`git restore --source=<commit-hash> <file>`은 **특정 커밋 시점의 파일 상태를 가져오는 명령어**입니다.

기본 `git restore <file>`은 마지막 커밋, 즉 현재 `HEAD` 기준으로 파일을 되돌립니다.

반면 `--source=<commit-hash>`를 사용하면 원하는 커밋을 기준으로 파일을 되돌릴 수 있습니다.

예를 들어 특정 커밋 `a1b2c3d` 시점의 `README.md` 파일 상태로 되돌리고 싶다면 다음처럼 입력합니다.

```bash
git restore --source=a1b2c3d README.md
```

이 명령어의 의미는 다음과 같습니다.

```text
a1b2c3d 커밋 시점의 README.md 파일 상태를 현재 작업 디렉토리로 가져온다.
```

### 커밋 해시는 어디서 확인할까?

특정 커밋 시점의 파일을 가져오려면 먼저 커밋 해시를 알아야 합니다.

커밋 해시는 보통 `git log --oneline`으로 확인합니다.

```bash
git log --oneline
```

예시:

```bash
a1b2c3d Update README
d4e5f6g Add login feature
h7i8j9k Initial commit
```

여기서 왼쪽에 있는 `a1b2c3d`, `d4e5f6g`, `h7i8j9k`가 커밋 해시입니다.

예를 들어 `d4e5f6g` 시점의 `README.md`를 가져오고 싶다면 다음처럼 사용할 수 있습니다.

```bash
git restore --source=d4e5f6g README.md
```

### `--source`는 언제 사용할까?

`git restore --source=<commit-hash> <file>`은 다음 상황에서 유용합니다.

```text
특정 파일만 과거 커밋 상태로 되돌리고 싶을 때
예전 버전의 파일 내용을 다시 가져오고 싶을 때
전체 프로젝트를 되돌리지 않고 파일 하나만 복구하고 싶을 때
특정 커밋에서 파일이 어떻게 되어 있었는지 기준으로 현재 파일을 바꾸고 싶을 때
```

예를 들어 프로젝트 전체를 과거로 되돌리고 싶은 것이 아니라, `config.yml` 파일만 예전 커밋 상태로 되돌리고 싶다면 다음처럼 사용할 수 있습니다.

```bash
git restore --source=a1b2c3d config.yml
```

이 명령어는 전체 브랜치를 과거로 이동시키지 않고, `config.yml` 파일만 해당 커밋 시점의 상태로 가져옵니다.

### `git restore --source`는 커밋 기록을 바꾸지 않는다

중요한 점은 `git restore --source=<commit-hash> <file>`이 커밋 기록 자체를 바꾸는 명령어는 아니라는 것입니다.

이 명령어는 특정 커밋 시점의 파일 내용을 현재 작업 디렉토리로 가져옵니다.

즉, 실행 후에는 해당 파일이 수정된 상태로 보일 수 있습니다.

예를 들어 다음 명령어를 실행했다고 해보겠습니다.

```bash
git restore --source=a1b2c3d README.md
```

그 후 상태를 확인하면 다음처럼 보일 수 있습니다.

```bash
git status -sb
```

```bash
 M README.md
```

이는 `README.md` 파일이 현재 브랜치의 최신 커밋 상태와 달라졌다는 뜻입니다.

이 변경 사항을 실제 기록으로 남기고 싶다면 다시 커밋해야 합니다.

```bash
git add README.md
git commit -m "Restore README from previous version"
```

즉, `--source`는 특정 커밋의 파일 상태를 가져오는 것이고, 그 결과를 저장소 기록으로 확정하려면 별도의 커밋이 필요합니다.

### `git restore --source`와 `git checkout` 예전 방식

예전에는 특정 커밋의 파일을 가져올 때 다음과 같은 명령어를 많이 사용했습니다.

```bash
git checkout <commit-hash> -- <file>
```

예를 들어:

```bash
git checkout a1b2c3d -- README.md
```

이 명령어는 다음 명령어와 비슷한 목적을 가집니다.

```bash
git restore --source=a1b2c3d README.md
```

최근에는 역할이 더 명확한 `git restore`를 사용하는 것이 이해하기 쉽습니다.

```text
예전 방식
→ git checkout <commit-hash> -- <file>

요즘 방식
→ git restore --source=<commit-hash> <file>
```

`checkout`은 브랜치 이동과 파일 복구를 모두 담당했던 명령어라 헷갈릴 수 있습니다.

반면 `restore`는 이름 그대로 파일 복구 목적이 더 분명합니다.

---

## 5. 자주 쓰는 흐름

특정 파일의 수정 내용을 되돌리고 싶을 때:

```bash
git status -sb
git diff README.md
git restore README.md
```

현재 디렉토리 아래 수정 내용을 모두 되돌리고 싶을 때:

```bash
git status -sb
git diff
git restore .
```

특정 커밋 시점의 파일을 가져오고 싶을 때:

```bash
git log --oneline
git restore --source=<commit-hash> <file>
git status -sb
```

그 변경을 커밋으로 남기고 싶다면:

```bash
git add <file>
git commit -m "Restore file from previous commit"
```

---

## 6. 명령어별 정리

| 명령어                                         | 의미                               |
| ------------------------------------------- | -------------------------------- |
| `git restore <file>`                        | 특정 파일의 수정 내용을 마지막 커밋 상태로 되돌림     |
| `git restore .`                             | 현재 디렉토리 아래의 수정 내용을 모두 되돌림        |
| `git restore --source=<commit-hash> <file>` | 특정 커밋 시점의 파일 상태를 현재 작업 디렉토리로 가져옴 |

```text
git restore <file>
→ 파일 하나를 마지막 커밋 상태로 되돌린다.

git restore .
→ 현재 디렉토리 아래 수정 내용을 모두 되돌린다.

git restore --source=<commit-hash> <file>
→ 특정 커밋 시점의 파일 상태를 가져온다.
```

---

## 7. 자주 헷갈리는 상황

### `git restore <file>`은 스테이징 취소가 아니다

다음 명령어는 파일 수정 내용을 되돌립니다.

```bash
git restore README.md
```

반면 스테이징만 취소하려면 다음 명령어를 사용해야 합니다.

```bash
git restore --staged README.md
```

즉, 두 명령어는 다릅니다.

```text
git restore README.md
→ 파일 수정 내용 되돌리기

git restore --staged README.md
→ git add만 취소하기
```

### `git restore .`은 조심해서 사용해야 한다

`git restore .`은 현재 디렉토리 아래의 수정 내용을 모두 되돌립니다.

따라서 여러 파일을 수정한 상태에서 실행하면 작업 내용이 한 번에 사라질 수 있습니다.

실행 전에는 다음 명령어로 반드시 확인하는 것이 좋습니다.

```bash
git status -sb
git diff
```

되돌릴지 확실하지 않다면 `stash`를 사용할 수도 있습니다.

```bash
git stash
```

### 특정 커밋의 파일을 가져온 뒤에는 커밋이 필요할 수 있다

다음 명령어를 실행하면:

```bash
git restore --source=a1b2c3d README.md
```

`README.md`가 특정 커밋 시점의 상태로 바뀝니다.

하지만 이 변경은 아직 작업 디렉토리에만 있는 상태입니다.

이 상태를 기록으로 남기려면 다시 커밋해야 합니다.

```bash
git add README.md
git commit -m "Restore README from a1b2c3d"
```

---

## 마무리 정리

`git restore`는 파일의 변경 내용을 되돌릴 때 사용하는 명령어입니다.

`git restore <file>`은 특정 파일의 수정 내용을 마지막 커밋 상태로 되돌립니다.

`git restore .`은 현재 디렉토리 아래의 수정 내용을 모두 되돌립니다.

`git restore --source=<commit-hash> <file>`은 특정 커밋 시점의 파일 상태를 현재 작업 디렉토리로 가져옵니다.

다만 `git restore <file>`과 `git restore .`은 아직 커밋하지 않은 수정 내용을 사라지게 할 수 있으므로 사용 전에 `git status -sb`와 `git diff`로 변경 내용을 확인하는 것이 좋습니다.

한 문장으로 정리하면 다음과 같습니다.

> `git restore`는 파일 상태를 되돌리는 명령어이며, 특정 파일만 되돌릴 때는 `git restore <file>`, 현재 디렉토리 전체를 되돌릴 때는 `git restore .`, 특정 커밋 시점의 파일을 가져올 때는 `git restore --source=<commit-hash> <file>`을 사용한다.
