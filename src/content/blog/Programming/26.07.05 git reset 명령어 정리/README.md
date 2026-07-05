---
title: "Git 커밋 취소하기: git reset 정리"
slug: "git-reset-command-guide"
description: "git reset HEAD~1, --soft, --mixed, --hard의 차이와 커밋을 되돌리는 방법을 정리합니다."
pubDate: "2026-07-05T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

`git reset`은 Git에서 **커밋을 이전 상태로 되돌릴 때 사용하는 명령어**입니다.

작업하다 보면 커밋을 만들었지만, 다시 취소하고 싶은 경우가 있습니다.

예를 들어 다음과 같은 상황이 있을 수 있습니다.

```text
커밋 메시지를 잘못 작성한 경우
커밋에 포함하지 말아야 할 파일을 넣은 경우
여러 작업을 하나의 커밋으로 묶어버린 경우
마지막 커밋을 취소하고 다시 정리하고 싶은 경우
```

이때 사용할 수 있는 명령어가 `git reset`입니다.

이번 글에서는 최근 커밋 하나를 취소할 때 자주 사용하는 명령어를 정리합니다.

```bash
git reset HEAD~1
git reset --soft HEAD~1
git reset --mixed HEAD~1
git reset --hard HEAD~1
```

---

## 1. `HEAD~1`이란?

먼저 `HEAD~1`의 의미를 알아야 합니다.

Git에서 `HEAD`는 현재 브랜치가 가리키는 최신 커밋을 의미합니다.

```text
HEAD = 현재 브랜치의 최신 커밋
```

그리고 `HEAD~1`은 `HEAD`보다 한 단계 이전 커밋을 의미합니다.

```text
HEAD~1 = 현재 최신 커밋의 바로 이전 커밋
```

예를 들어 커밋 기록이 다음과 같다고 해보겠습니다.

```text
A --- B --- C
          ↑
         HEAD
```

현재 최신 커밋은 `C`입니다.

이때 `HEAD~1`은 바로 이전 커밋인 `B`를 의미합니다.

```text
A --- B --- C
      ↑     ↑
   HEAD~1  HEAD
```

따라서 다음 명령어는:

```bash
git reset HEAD~1
```

현재 브랜치를 최신 커밋의 바로 이전 커밋으로 되돌린다는 의미입니다.

즉, 최근 커밋 하나를 취소할 때 자주 사용합니다.

---

## 2. `git reset`은 무엇을 되돌릴까?

`git reset`은 단순히 파일만 되돌리는 명령어가 아니라, **현재 브랜치가 가리키는 커밋 위치를 이동시키는 명령어**입니다.

예를 들어 현재 커밋 흐름이 다음과 같다고 해보겠습니다.

```text
A --- B --- C
          ↑
         HEAD
```

여기서 다음 명령어를 실행하면:

```bash
git reset HEAD~1
```

현재 브랜치의 `HEAD`가 `C`에서 `B`로 이동합니다.

```text
A --- B
      ↑
     HEAD
```

즉, 최신 커밋 `C`가 현재 브랜치 기록에서 빠집니다.

하지만 여기서 중요한 점은, `reset` 옵션에 따라 `C` 커밋의 변경 내용을 어떻게 처리할지가 달라진다는 것입니다.

```text
--soft  → 커밋만 취소하고 변경 내용은 스테이징 상태로 유지
--mixed → 커밋만 취소하고 변경 내용은 작업 디렉토리에 유지
--hard  → 커밋도 취소하고 변경 내용도 삭제
```

---

## 3. `git reset --soft HEAD~1`

```bash
git reset --soft HEAD~1
```

`git reset --soft HEAD~1`은 **마지막 커밋만 취소하고, 변경 내용은 스테이징 상태로 유지하는 명령어**입니다.

즉, 커밋은 취소되지만 `git add`까지 된 상태는 그대로 남습니다.

예를 들어 다음 흐름으로 커밋을 만들었다고 해보겠습니다.

```bash
git add README.md
git commit -m "Update README"
```

그런데 커밋을 취소하고 다시 커밋 메시지를 작성하고 싶다면 다음 명령어를 사용할 수 있습니다.

```bash
git reset --soft HEAD~1
```

이후 상태를 확인하면, 변경 내용이 여전히 스테이징된 상태로 남아 있을 수 있습니다.

```bash
git status -sb
```

예시:

```bash
M  README.md
```

여기서 왼쪽 칸의 `M`은 `README.md`가 스테이징된 상태라는 뜻입니다.

즉, `--soft`는 다음과 같이 이해하면 됩니다.

```text
커밋만 취소한다.
변경 내용은 그대로 둔다.
스테이징 상태도 유지한다.
```

### `--soft`는 언제 사용할까?

`git reset --soft HEAD~1`은 다음 상황에서 유용합니다.

```text
마지막 커밋 메시지를 다시 작성하고 싶을 때
마지막 커밋을 취소하고 바로 다시 커밋하고 싶을 때
커밋은 취소하되, 스테이징 상태는 유지하고 싶을 때
여러 커밋을 하나로 다시 정리하고 싶을 때
```

예를 들어 커밋 메시지를 잘못 작성했다면 다음처럼 사용할 수 있습니다.

```bash
git reset --soft HEAD~1
git commit -m "올바른 커밋 메시지"
```

물론 단순히 마지막 커밋 메시지만 수정하려면 `git commit --amend`를 사용할 수도 있습니다.

```bash
git commit --amend -m "올바른 커밋 메시지"
```

하지만 `--soft`는 커밋을 취소한 뒤 다시 커밋을 구성하고 싶을 때 이해하기 좋은 방식입니다.

---

## 4. `git reset --mixed HEAD~1`과 `git reset HEAD~1`

```bash
git reset --mixed HEAD~1
```

`git reset --mixed HEAD~1`은 **마지막 커밋을 취소하고, 변경 내용은 작업 디렉토리에 남겨두는 명령어**입니다.

다만 스테이징 상태는 취소됩니다.

즉, 커밋도 취소되고 `git add`도 취소되지만, 파일 수정 내용은 그대로 남습니다.

```text
커밋 취소
스테이징 취소
파일 수정 내용은 유지
```

`--mixed`는 기본값이기 때문에 다음 두 명령어는 같은 의미입니다.

```bash
git reset HEAD~1
git reset --mixed HEAD~1
```

이 명령어는 마지막 커밋을 취소하고, 해당 커밋의 변경 내용은 작업 디렉토리에 남겨둡니다.

상태를 확인하면 다음처럼 보일 수 있습니다.

```bash
git status -sb
```

예시:

```bash
 M README.md
 M app.js
```

여기서 오른쪽 칸의 `M`은 파일이 수정되었지만 스테이징되지는 않았다는 뜻입니다.

즉, 다시 원하는 파일만 골라서 `git add`하고 커밋할 수 있습니다.

```bash
git add README.md
git commit -m "Update README"

git add app.js
git commit -m "Update app logic"
```

### `--mixed`는 언제 사용할까?

`git reset --mixed HEAD~1` 또는 `git reset HEAD~1`은 다음 상황에서 유용합니다.

```text
마지막 커밋을 취소하고 다시 파일을 골라서 add하고 싶을 때
커밋을 너무 크게 만들어서 여러 커밋으로 나누고 싶을 때
커밋은 취소하되 작업 내용은 잃고 싶지 않을 때
스테이징 상태까지 초기화하고 싶을 때
```

예를 들어 마지막 커밋에 `README.md`, `app.js`, `test.js`가 모두 들어갔는데, 이를 나누고 싶다면 다음 흐름을 사용할 수 있습니다.

```bash
git reset HEAD~1
git add README.md
git commit -m "Update README"
git add app.js
git commit -m "Update app logic"
git add test.js
git commit -m "Add app tests"
```

즉, `--mixed`는 마지막 커밋을 풀어서 다시 정리하고 싶을 때 많이 사용합니다.

---

## 5. `git reset --hard HEAD~1`

```bash
git reset --hard HEAD~1
```

`git reset --hard HEAD~1`은 **마지막 커밋을 취소하고, 해당 커밋의 변경 내용까지 모두 삭제하는 명령어**입니다.

즉, 커밋도 사라지고 파일 수정 내용도 사라질 수 있습니다.

```text
커밋 취소
스테이징 취소
파일 수정 내용 삭제
```

예를 들어 다음과 같은 커밋 흐름이 있다고 해보겠습니다.

```text
A --- B --- C
          ↑
         HEAD
```

이 상태에서 다음 명령어를 실행하면:

```bash
git reset --hard HEAD~1
```

브랜치는 `B` 커밋으로 이동하고, `C` 커밋에서 변경했던 파일 내용도 작업 디렉토리에서 사라집니다.

```text
A --- B
      ↑
     HEAD
```

즉, `--hard`는 매우 강한 되돌리기 방식입니다.

### `--hard`는 언제 사용할까?

`git reset --hard HEAD~1`은 다음 상황에서 사용할 수 있습니다.

```text
마지막 커밋과 그 변경 내용을 모두 버리고 싶을 때
실험용 커밋을 완전히 제거하고 싶을 때
작업 내용을 되돌려도 되는 것이 확실할 때
```

하지만 `--hard`는 작업 내용이 사라질 수 있으므로 매우 조심해야 합니다.

특히 아직 백업하지 않은 변경 내용이 있다면 실행하지 않는 것이 좋습니다.

실행 전에는 반드시 현재 상태와 커밋 기록을 확인하는 습관이 좋습니다.

```bash
git status -sb
git log --oneline
```

되돌릴 내용이 필요한지 애매하다면 `--hard` 대신 `--mixed`나 `--soft`를 먼저 고려하는 것이 안전합니다.

---

## 6. `--soft`, `--mixed`, `--hard` 차이

세 옵션의 차이는 **커밋 취소 후 변경 내용을 어디에 남기는가**입니다.

| 명령어                        | 커밋 취소 | 스테이징 상태 | 파일 수정 내용 |
| -------------------------- | ----: | ------: | -------: |
| `git reset --soft HEAD~1`  |     O |      유지 |       유지 |
| `git reset --mixed HEAD~1` |     O |      취소 |       유지 |
| `git reset HEAD~1`         |     O |      취소 |       유지 |
| `git reset --hard HEAD~1`  |     O |      취소 |       삭제 |

간단히 정리하면 다음과 같습니다.

```text
--soft
→ 커밋만 취소하고, add 상태는 유지

--mixed
→ 커밋과 add를 취소하고, 파일 수정 내용은 유지

--hard
→ 커밋과 add와 파일 수정 내용을 모두 되돌림
```

처음에는 다음 기준으로 기억하면 좋습니다.

```text
변경 내용을 살리고 싶다 → --soft 또는 --mixed
변경 내용을 버려도 된다 → --hard
```

---

## 7. 예시로 비교하기

다음과 같은 커밋을 만들었다고 해보겠습니다.

```bash
git add README.md
git commit -m "Update README"
```

이제 마지막 커밋을 취소하려고 합니다.

### `--soft`를 사용한 경우

```bash
git reset --soft HEAD~1
```

결과:

```text
커밋은 취소됨
README.md 변경 내용은 스테이징된 상태로 남음
바로 다시 commit 가능
```

### `--mixed`를 사용한 경우

```bash
git reset HEAD~1
```

결과:

```text
커밋은 취소됨
README.md 변경 내용은 작업 디렉토리에 남음
다시 git add부터 해야 함
```

### `--hard`를 사용한 경우

```bash
git reset --hard HEAD~1
```

결과:

```text
커밋은 취소됨
README.md 변경 내용도 사라짐
되돌린 작업 내용이 필요했다면 문제가 될 수 있음
```

---

## 8. 이미 push한 커밋에 reset을 사용해도 될까?

가능은 하지만 조심해야 합니다.

`git reset`은 커밋 기록을 이전으로 이동시키는 명령어입니다.

아직 원격 저장소에 push하지 않은 로컬 커밋을 정리할 때는 비교적 안전하게 사용할 수 있습니다.

```text
아직 push하지 않은 커밋 → reset 사용 가능
이미 push한 커밋 → reset 사용 주의
```

이미 push한 커밋을 reset하면 로컬 기록과 원격 기록이 달라질 수 있습니다.

이 상태에서 다시 push하려면 강제 push가 필요할 수 있습니다.

```bash
git push --force-with-lease
```

하지만 협업 중인 브랜치에서 강제 push를 하면 다른 사람의 작업 흐름에 영향을 줄 수 있습니다.

그래서 이미 원격 저장소에 올라간 커밋을 되돌릴 때는 보통 `git revert`가 더 안전합니다.

```bash
git revert <commit-hash>
```

`revert`는 기존 커밋 기록을 지우지 않고, 그 변경을 되돌리는 새 커밋을 만들기 때문입니다.

---

## 9. 자주 쓰는 흐름

마지막 커밋을 취소하고 바로 다시 커밋하고 싶을 때:

```bash
git reset --soft HEAD~1
git commit -m "새 커밋 메시지"
```

마지막 커밋을 취소하고 파일을 다시 골라서 커밋하고 싶을 때:

```bash
git reset HEAD~1
git add <file>
git commit -m "커밋 메시지"
```

마지막 커밋과 변경 내용을 모두 버리고 싶을 때:

```bash
git reset --hard HEAD~1
```

실행 전 상태를 확인하고 싶을 때:

```bash
git status -sb
git log --oneline
```

---

## 10. 명령어별 정리

| 명령어                        | 의미                              |
| -------------------------- | ------------------------------- |
| `git reset HEAD~1`         | 마지막 커밋을 취소하고 변경 내용은 작업 디렉토리에 유지 |
| `git reset --soft HEAD~1`  | 마지막 커밋을 취소하고 변경 내용은 스테이징 상태로 유지 |
| `git reset --mixed HEAD~1` | 마지막 커밋을 취소하고 변경 내용은 작업 디렉토리에 유지 |
| `git reset --hard HEAD~1`  | 마지막 커밋을 취소하고 변경 내용도 삭제          |

```text
git reset --soft HEAD~1
→ 커밋만 취소

git reset HEAD~1
→ 커밋 취소 + 스테이징 취소

git reset --mixed HEAD~1
→ git reset HEAD~1과 같음

git reset --hard HEAD~1
→ 커밋 취소 + 변경 내용 삭제
```

---

## 11. 자주 헷갈리는 상황

### `git reset HEAD~1`과 `git reset --mixed HEAD~1`은 같은가?

일반적으로 같습니다.

`git reset`의 기본 모드는 `--mixed`입니다.

따라서 다음 두 명령어는 같은 의미로 이해하면 됩니다.

```bash
git reset HEAD~1
git reset --mixed HEAD~1
```

둘 다 마지막 커밋을 취소하고, 변경 내용은 작업 디렉토리에 남겨둡니다.

### 커밋만 취소하고 변경 내용은 남기고 싶다면?

스테이징 상태까지 유지하고 싶다면:

```bash
git reset --soft HEAD~1
```

스테이징은 취소하고 파일 수정 내용만 남기고 싶다면:

```bash
git reset HEAD~1
```

### 변경 내용까지 완전히 버리고 싶다면?

```bash
git reset --hard HEAD~1
```

다만 이 명령어는 파일 수정 내용이 사라질 수 있으므로 조심해야 합니다.

확신이 없다면 먼저 다음 명령어로 현재 상태를 확인하는 것이 좋습니다.

```bash
git status -sb
git log --oneline
```

---

## 마무리 정리

`git reset`은 커밋을 이전 상태로 되돌릴 때 사용하는 명령어입니다.

`git reset HEAD~1`은 마지막 커밋을 취소하고, 변경 내용은 작업 디렉토리에 남겨둡니다.

`git reset --soft HEAD~1`은 마지막 커밋만 취소하고, 변경 내용은 스테이징 상태로 유지합니다.

`git reset --mixed HEAD~1`은 `git reset HEAD~1`과 같은 의미로, 마지막 커밋과 스테이징을 취소하지만 파일 수정 내용은 남깁니다.

`git reset --hard HEAD~1`은 마지막 커밋과 변경 내용을 모두 되돌리므로 주의해서 사용해야 합니다.

한 문장으로 정리하면 다음과 같습니다.

> `git reset`은 최근 커밋을 취소할 때 사용하는 명령어이며, `--soft`는 변경 내용을 스테이징 상태로 남기고, `--mixed`는 작업 디렉토리에 남기며, `--hard`는 변경 내용까지 삭제한다.
