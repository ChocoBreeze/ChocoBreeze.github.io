---
title: "git commit 명령어 정리"
slug: "git-commit-command-guide"
description: "git commit, git commit -m, git commit --amend의 차이와 좋은 커밋 메시지 작성법을 정리합니다."
pubDate: "2026-07-02T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

`git commit`은 Git에서 **스테이징된 변경 사항을 저장소의 기록으로 남기는 명령어**입니다.

Git은 파일을 수정했다고 해서 자동으로 기록을 남기지 않습니다.
먼저 `git add`로 커밋에 포함할 변경 사항을 스테이징하고, 그다음 `git commit`으로 하나의 커밋을 만듭니다.

기본 흐름은 다음과 같습니다.

```bash
git add <file>
git commit
```

또는 커밋 메시지를 함께 작성하려면 다음처럼 사용할 수 있습니다.

```bash
git commit -m "message"
```

---

## 1. 커밋이란?

커밋은 Git에서 **작업 내용을 저장한 하나의 기록 단위**입니다.

예를 들어 로그인 기능을 추가했다면 다음과 같은 커밋을 만들 수 있습니다.

```bash
git commit -m "Add login feature"
```

README를 수정했다면 다음과 같은 커밋을 만들 수 있습니다.

```bash
git commit -m "Update README"
```

커밋에는 보통 다음 정보가 포함됩니다.

```text
커밋 해시
작성자
작성 날짜
커밋 메시지
변경된 파일 내용
```

즉, 커밋은 단순히 파일을 저장하는 것이 아니라, "언제, 누가, 어떤 이유로, 무엇을 변경했는지"를 남기는 기록입니다.

---

## 2. `git commit`

```bash
git commit
```

`git commit`은 스테이징된 변경 사항을 커밋으로 저장하는 명령어입니다.

단, 메시지를 옵션으로 바로 적지 않고 `git commit`만 실행하면 기본 편집기가 열립니다.

예를 들어 다음과 같은 흐름입니다.

```bash
git add README.md
git commit
```

그러면 Vim, Nano, VS Code 같은 Git 기본 편집기가 열리고, 그 안에서 커밋 메시지를 작성할 수 있습니다.

커밋 메시지를 작성하고 저장하면 커밋이 생성됩니다.

---

## 3. `git commit`은 스테이징된 내용만 저장한다

중요한 점은 `git commit`은 **스테이징된 변경 사항만 커밋한다**는 것입니다.

예를 들어 다음과 같은 상태가 있다고 해보겠습니다.

```bash
M  README.md
 M app.js
```

이 상태의 의미는 다음과 같습니다.

```text
README.md → 스테이징됨
app.js    → 수정되었지만 스테이징되지 않음
```

이 상태에서 다음 명령어를 실행하면:

```bash
git commit -m "Update README"
```

커밋에는 `README.md`의 변경 사항만 포함됩니다.

`app.js`의 변경 사항은 아직 작업 디렉토리에 남아 있고, 커밋에는 들어가지 않습니다.

즉, 커밋에 포함할 내용은 `git add`로 먼저 선택해야 합니다.

---

## 4. `git commit -m "message"`

```bash
git commit -m "message"
```

`git commit -m "message"`는 커밋 메시지를 명령어에서 바로 작성하는 방식입니다. 여기서 `-m`은 message의 의미입니다.

예를 들어 다음처럼 사용할 수 있습니다.

```bash
git commit -m "Update README"
```

이 명령어는 스테이징된 변경 사항을 커밋하면서, 커밋 메시지를 `"Update README"`로 저장합니다.

실무나 개인 프로젝트에서는 간단한 커밋을 만들 때 이 방식을 자주 사용합니다.

---

## 5. 커밋 메시지는 왜 중요할까?

커밋 메시지는 나중에 작업 기록을 이해하기 위한 설명입니다.

예를 들어 다음 두 커밋 메시지를 비교해보겠습니다.

```bash
git commit -m "수정"
git commit -m "Fix login validation error"
```

첫 번째 메시지는 무엇을 수정했는지 알기 어렵습니다. 반면 두 번째 메시지는 로그인 검증 오류를 수정했다는 내용을 바로 알 수 있습니다.

커밋 메시지는 나중에 `git log`로 기록을 볼 때 특히 중요합니다.

```bash
git log --oneline
```

예시:

```bash
a1b2c3d Fix login validation error
d4e5f6g Add user profile page
h7i8j9k Update README
```

커밋 메시지가 명확하면 프로젝트의 변경 흐름을 훨씬 쉽게 이해할 수 있습니다.

좋은 커밋 메시지는 대체로 다음 특징을 가집니다.

```text
무엇을 했는지 알 수 있다.
너무 추상적이지 않다.
나중에 로그를 봐도 의미가 이해된다.
```

반대로 다음과 같은 메시지는 피하는 것이 좋습니다.

```bash
git commit -m "수정"
git commit -m "작업"
git commit -m "test"
git commit -m "asdf"
```

---

## 6. 커밋 전 추천 흐름

커밋하기 전에는 다음 흐름을 사용하는 것이 좋습니다.

```bash
git status -sb
git diff
git add <file>
git diff --staged
git commit -m "커밋 메시지"
```

각 명령어의 의미는 다음과 같습니다.

```text
git status -sb    → 어떤 파일이 변경되었는지 확인
git diff          → 아직 스테이징하지 않은 변경 내용 확인
git add <file>    → 커밋할 파일을 스테이징
git diff --staged → 실제 커밋에 들어갈 내용 확인
git commit        → 커밋 생성
```

특히 `git diff --staged`는 커밋 전에 꼭 확인하는 습관을 들이면 좋습니다. `git commit`은 스테이징된 내용을 기록으로 남기기 때문에, 커밋 전에 "이번 커밋에 무엇이 들어가는지" 확인하는 것이 중요합니다.

---

## 7. `git commit --amend`

```bash
git commit --amend
```

`git commit --amend`는 **마지막 커밋을 수정하는 명령어**입니다. 여기서 `amend`는 "수정하다", "보완하다"라는 의미입니다.

이 명령어는 주로 다음 상황에서 사용합니다.

```text
마지막 커밋 메시지를 수정하고 싶을 때
마지막 커밋에 파일을 빠뜨렸을 때
마지막 커밋 내용을 조금 보완하고 싶을 때
```

즉, 새 커밋을 하나 더 만드는 것이 아니라, 마지막 커밋을 다시 작성하는 명령어라고 볼 수 있습니다.

### 마지막 커밋 메시지 수정하기

마지막 커밋 메시지만 수정하고 싶다면 다음 명령어를 사용할 수 있습니다.

```bash
git commit --amend
```

이 명령어를 실행하면 편집기가 열리고, 마지막 커밋 메시지를 수정할 수 있습니다.

예를 들어 마지막 커밋 메시지를 실수로 다음처럼 작성했다고 해보겠습니다.

```bash
git commit -m "Fix logn bug"
```

`login`을 `logn`으로 잘못 적었습니다. 이때 다음 명령어를 실행합니다.

```bash
git commit --amend
```

편집기에서 메시지를 수정한 뒤 저장하면 마지막 커밋 메시지가 변경됩니다.

또는 메시지를 명령어에서 바로 수정할 수도 있습니다.

```bash
git commit --amend -m "Fix login bug"
```

### 마지막 커밋에 빠뜨린 파일 추가하기

`git commit --amend`는 빠뜨린 파일을 마지막 커밋에 추가할 때도 사용할 수 있습니다.

예를 들어 다음처럼 커밋을 만들었다고 해보겠습니다.

```bash
git add app.js
git commit -m "Add login logic"
```

그런데 커밋하고 보니 `login.test.js` 파일을 같이 넣어야 했는데 빠뜨렸습니다. 아직 원격 저장소에 push하지 않았다면 마지막 커밋에 포함시킬 수 있습니다.

```bash
git add login.test.js
git commit --amend
```

메시지를 그대로 유지하고 싶다면 다음처럼 사용할 수도 있습니다.

```bash
git commit --amend --no-edit
```

`--no-edit`은 기존 커밋 메시지를 수정하지 않고 그대로 사용하겠다는 의미입니다.

---

## 8. `git commit --amend` 사용 시 주의점

`git commit --amend`는 마지막 커밋을 수정하는 명령어입니다.

그런데 Git에서 커밋을 수정하면 기존 커밋이 그대로 바뀌는 것이 아니라, **새로운 커밋으로 다시 만들어집니다.** 즉, 커밋 해시가 바뀝니다.

예를 들어 기존 커밋이 다음과 같았다고 해보겠습니다.

```bash
a1b2c3d Add login logic
```

`git commit --amend`를 실행하면 커밋 내용이나 메시지가 수정되면서 커밋 해시가 달라질 수 있습니다.

```bash
h7i8j9k Add login logic
```

이 점이 중요한 이유는, 이미 원격 저장소에 push한 커밋을 amend하면 로컬과 원격의 커밋 기록이 달라질 수 있기 때문입니다.

따라서 `git commit --amend`는 보통 **아직 push하지 않은 마지막 커밋을 수정할 때** 사용하는 것이 안전합니다.

```text
아직 push하지 않은 마지막 커밋 → amend 사용 가능
이미 push한 커밋               → amend 사용 주의
공유 브랜치의 커밋              → 가능하면 amend 대신 새 커밋으로 수정
```

---

## 9. 명령어별 비교

| 명령어 | 의미 | 사용하기 좋은 상황 |
| --- | --- | --- |
| `git commit` | 편집기를 열어 커밋 메시지를 작성하고 커밋 | 긴 메시지를 작성하거나 본문까지 작성하고 싶을 때 |
| `git commit -m "message"` | 메시지를 바로 입력해 커밋 | 간단한 커밋 메시지를 작성할 때 |
| `git commit --amend` | 마지막 커밋 수정 | 마지막 커밋 메시지 수정 또는 빠뜨린 파일 추가 |

```text
git commit
→ 스테이징된 내용을 커밋하고, 메시지는 편집기에서 작성

git commit -m "message"
→ 스테이징된 내용을 메시지와 함께 바로 커밋

git commit --amend
→ 마지막 커밋을 수정
```

---

## 10. 자주 쓰는 흐름

일반적인 커밋 흐름은 다음과 같습니다.

```bash
git status -sb
git diff
git add .
git diff --staged
git commit -m "커밋 메시지"
```

마지막 커밋 메시지를 수정하고 싶을 때는 다음처럼 사용합니다.

```bash
git commit --amend -m "새 커밋 메시지"
```

마지막 커밋에 빠뜨린 파일을 추가하고 싶다면 다음 흐름을 사용할 수 있습니다.

```bash
git add 빠뜨린파일
git commit --amend --no-edit
```

---

## 11. 자주 헷갈리는 상황

### `git commit`을 했는데 변경 내용이 없다고 나오는 경우

`git commit`은 스테이징된 내용만 커밋합니다. 파일을 수정했더라도 `git add`를 하지 않았다면 커밋할 내용이 없다고 나올 수 있습니다.

```text
no changes added to commit
```

이 경우 먼저 `git status`로 상태를 확인하고, 필요한 파일을 `git add` 해야 합니다.

```bash
git status -sb
git add app.js
git commit -m "Update app"
```

### 커밋 메시지를 잘못 적은 경우

마지막 커밋 메시지를 잘못 적었다면 다음 명령어로 수정할 수 있습니다.

```bash
git commit --amend -m "올바른 커밋 메시지"
```

다만 이미 push한 커밋이라면 주의해야 합니다.

### 파일을 빼먹고 커밋한 경우

마지막 커밋에 파일을 빠뜨렸다면 다음처럼 보완할 수 있습니다.

```bash
git add 빠뜨린파일
git commit --amend --no-edit
```

이 명령어는 빠뜨린 파일을 마지막 커밋에 추가하면서, 기존 커밋 메시지는 그대로 유지합니다.

---

## 마무리 정리

`git commit`은 스테이징된 변경 사항을 Git 저장소의 기록으로 남기는 명령어입니다.

`git commit`만 실행하면 편집기가 열리고, 그 안에서 커밋 메시지를 작성할 수 있습니다.

`git commit -m "message"`는 커밋 메시지를 명령어에서 바로 작성하는 방식입니다.

`git commit --amend`는 마지막 커밋을 수정할 때 사용합니다.

한 문장으로 정리하면 다음과 같습니다.

> `git commit`은 스테이징된 변경 사항을 하나의 기록으로 저장하는 명령어이며, `-m` 옵션은 커밋 메시지를 바로 작성할 때, `--amend`는 마지막 커밋을 수정할 때 사용한다.
