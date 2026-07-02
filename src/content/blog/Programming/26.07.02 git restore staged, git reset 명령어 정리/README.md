---
title: "Git 스테이징 취소하기: git restore --staged, git reset"
slug: "git-unstage-command-guide"
description: "git restore --staged와 git reset으로 스테이징을 취소하는 방법과 두 명령어의 차이를 정리합니다."
pubDate: "2026-07-02T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

Git에서 `git add`를 실행하면 변경된 파일이 **스테이징 영역**에 올라갑니다.

스테이징 영역은 다음 커밋에 포함될 변경 사항을 준비해두는 공간입니다.

```text
작업 디렉토리 → 스테이징 영역 → 커밋
```

하지만 `git add`를 하다 보면 원하지 않는 파일까지 스테이징하는 경우가 있습니다.

예를 들어 다음처럼 여러 파일을 한 번에 스테이징했다고 해보겠습니다.

```bash
git add .
```

그런데 그중 `README.md`는 이번 커밋에 포함하고 싶지 않을 수 있습니다.

이때 사용하는 명령어가 다음 두 가지입니다.

```bash
git restore --staged <file>
git reset <file>
```

두 명령어 모두 보통 **스테이징된 파일을 스테이징 영역에서 내릴 때** 사용할 수 있습니다.

---

## 1. 스테이징 취소란?

스테이징 취소는 쉽게 말하면 **`git add`를 취소하는 것**입니다.

중요한 점은, 스테이징을 취소한다고 해서 파일의 수정 내용이 사라지는 것은 아니라는 점입니다.

예를 들어 `README.md` 파일을 수정한 뒤 다음 명령어를 실행했다고 해보겠습니다.

```bash
git add README.md
```

이제 `README.md`는 다음 커밋에 포함될 준비가 된 상태입니다.

이 상태에서 스테이징을 취소하면:

```bash
git restore --staged README.md
```

`README.md`는 스테이징 영역에서는 내려가지만, 파일의 수정 내용은 그대로 남아 있습니다.

즉, 다음과 같이 이해하면 됩니다.

```text
스테이징 취소 = 커밋 준비 상태에서만 내리기
파일 수정 내용 삭제 = 아님
```

---

## 2. `git restore --staged <file>`

```bash
git restore --staged <file>
```

`git restore --staged <file>`은 **특정 파일의 스테이징을 취소하는 명령어**입니다.

예를 들어 `README.md` 파일을 스테이징했다고 해보겠습니다.

```bash
git add README.md
```

상태를 확인하면 다음과 비슷하게 보일 수 있습니다.

```bash
git status -sb
```

```bash
M  README.md
```

여기서 왼쪽 칸의 `M`은 `README.md`가 스테이징되었다는 의미입니다.

이제 이 파일을 스테이징 영역에서 내리려면 다음 명령어를 실행합니다.

```bash
git restore --staged README.md
```

다시 상태를 확인하면 다음처럼 바뀝니다.

```bash
 M README.md
```

이번에는 `M`이 오른쪽 칸에 있습니다. 이는 `README.md` 파일의 수정 내용은 남아 있지만, 아직 스테이징되지는 않았다는 뜻입니다.

즉, `git restore --staged README.md`는 다음과 같은 의미입니다.

```text
README.md 파일의 수정 내용은 그대로 두고,
git add만 취소한다.
```

`git restore --staged`는 다음과 같은 상황에서 자주 사용합니다.

```text
git add .을 했는데 원하지 않는 파일까지 올라갔을 때
이번 커밋에서 특정 파일을 제외하고 싶을 때
스테이징한 파일을 다시 수정 후 재검토하고 싶을 때
커밋 단위를 나누고 싶을 때
```

예를 들어 세 파일이 모두 스테이징된 상태에서 `app.js`만 이번 커밋에 포함하고 싶다면 다음처럼 할 수 있습니다.

```bash
git restore --staged README.md
git restore --staged test.js
```

그러면 `app.js`만 스테이징된 상태로 남고, 나머지 파일은 작업 디렉토리에 수정된 상태로 남아 있게 됩니다.

---

## 3. `git reset <file>`

```bash
git reset <file>
```

`git reset <file>`도 특정 파일의 스테이징을 취소할 때 사용할 수 있습니다.

즉, 다음 두 명령어는 일반적인 스테이징 취소 상황에서 비슷한 역할을 합니다.

```bash
git restore --staged README.md
git reset README.md
```

둘 다 `README.md`를 커밋 준비 상태에서 내리지만, 수정된 파일 내용은 그대로 유지합니다.

`git reset <file>`은 예전부터 많이 사용되던 방식입니다. 그래서 오래된 Git 문서, 블로그 글, Stack Overflow 답변 등에서는 아직도 다음 명령어를 자주 볼 수 있습니다.

```bash
git reset HEAD <file>
```

또는:

```bash
git reset <file>
```

최근 Git에서는 역할이 더 명확한 `git restore --staged`가 추가되었습니다. 처음 Git을 배우는 입장에서는 `git restore --staged`가 더 이해하기 쉽습니다.

---

## 4. 두 명령어의 차이

스테이징 취소만 놓고 보면 두 명령어는 비슷하게 사용할 수 있습니다.

| 명령어 | 의미 | 파일 수정 내용 |
| --- | --- | --- |
| `git restore --staged <file>` | 특정 파일의 스테이징 취소 | 유지됨 |
| `git reset <file>` | 특정 파일의 스테이징 취소 | 유지됨 |

다만 차이는 명령어의 성격입니다.

```text
git restore --staged
→ 스테이징 취소 목적이 명확함

git reset
→ 스테이징 취소뿐 아니라 커밋 이동, 작업 내용 초기화 등 다른 역할도 있음
```

`git reset`은 더 강력하고 범위가 넓은 명령어입니다. 예를 들어 다음 명령어들은 모두 `reset`을 사용하지만 의미가 다릅니다.

```bash
git reset README.md
```

특정 파일의 스테이징을 취소합니다.

```bash
git reset HEAD~1
```

최근 커밋 하나를 취소합니다.

```bash
git reset --hard HEAD~1
```

최근 커밋 하나를 취소하고, 작업 내용까지 되돌립니다.

특히 `--hard` 옵션은 작업 내용까지 사라질 수 있으므로 주의해야 합니다.

그래서 처음 배울 때는 스테이징 취소 용도로는 `git restore --staged`를 먼저 익히는 것이 좋습니다.

---

## 5. 예시로 흐름 이해하기

다음과 같은 상태에서 시작해보겠습니다.

```bash
 M README.md
 M app.js
```

두 파일이 수정되었지만 아직 스테이징되지 않은 상태입니다.

이제 두 파일을 모두 스테이징합니다.

```bash
git add .
```

상태를 다시 확인합니다.

```bash
M  README.md
M  app.js
```

두 파일 모두 스테이징되었습니다. 그런데 `README.md`는 이번 커밋에서 제외하고 싶다면 다음처럼 실행합니다.

```bash
git restore --staged README.md
```

결과는 다음과 비슷합니다.

```bash
 M README.md
M  app.js
```

```text
README.md → 수정은 되었지만 스테이징은 안 됨
app.js    → 수정되었고 스테이징됨
```

따라서 이 상태에서 커밋하면 `app.js`의 변경 사항만 커밋에 포함됩니다.

```bash
git commit -m "Update app logic"
```

---

## 6. 전체 스테이징을 취소하고 싶을 때

특정 파일 하나가 아니라, 스테이징된 모든 파일을 내리고 싶다면 다음처럼 사용할 수 있습니다.

```bash
git restore --staged .
```

또는:

```bash
git reset
```

예를 들어 다음 상태에서:

```bash
M  README.md
M  app.js
A  memo.txt
```

`git restore --staged .`을 실행하면 스테이징된 파일들이 모두 내려갑니다.

```bash
 M README.md
 M app.js
?? memo.txt
```

수정 내용은 사라지지 않고, 커밋 준비 상태만 취소됩니다.

---

## 7. `restore --staged`와 `restore`를 구분해야 한다

다음 두 명령어는 의미가 다릅니다.

```bash
git restore --staged README.md
```

```bash
git restore README.md
```

첫 번째 명령어는 스테이징만 취소합니다.

```text
git restore --staged README.md
→ 파일 수정 내용은 유지
→ git add만 취소
```

두 번째 명령어는 파일의 수정 내용을 되돌립니다.

```text
git restore README.md
→ 파일 수정 내용 자체를 되돌림
→ 작업 내용이 사라질 수 있음
```

따라서 단순히 `git add`만 취소하고 싶다면 반드시 `--staged` 옵션을 붙여야 합니다.

```bash
git restore --staged README.md
```

---

## 8. 자주 쓰는 흐름

상태를 확인하고 스테이징한 뒤, 원하지 않는 파일이 있다면 다음 순서로 처리합니다.

```bash
git status -sb
git diff
git add .
git diff --staged
git restore --staged <file>   # 원하지 않는 파일 제외
git diff --staged             # 다시 확인
git commit -m "커밋 메시지"
```

---

## 9. 명령어 정리

| 명령어 | 의미 |
| --- | --- |
| `git restore --staged <file>` | 특정 파일의 스테이징 취소 |
| `git reset <file>` | 특정 파일의 스테이징 취소 |
| `git restore --staged .` | 현재 디렉토리 기준 스테이징 전체 취소 |
| `git reset` | 스테이징 전체 취소 |

```text
git restore --staged <file>
→ 요즘 방식의 명확한 스테이징 취소

git reset <file>
→ 예전부터 많이 사용된 스테이징 취소 방식
```

---

## 마무리 정리

`git restore --staged <file>`과 `git reset <file>`은 모두 스테이징된 파일을 스테이징 영역에서 내릴 때 사용할 수 있습니다.

즉, 둘 다 `git add`를 취소하는 용도로 사용할 수 있습니다.

다만 `git reset`은 역할이 더 넓은 명령어이기 때문에, 처음 Git을 배우는 입장에서는 `git restore --staged <file>`이 더 직관적입니다.

한 문장으로 정리하면 다음과 같습니다.

> `git restore --staged <file>`과 `git reset <file>`은 모두 스테이징을 취소하는 명령어이며, 파일의 수정 내용은 그대로 유지한 채 커밋 준비 상태에서만 내릴 때 사용한다.
