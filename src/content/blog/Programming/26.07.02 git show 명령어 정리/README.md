---
title: "git show 명령어 정리"
slug: "git-show-command-guide"
description: "git show와 git show <commit-hash>로 특정 커밋의 상세 내용을 확인하는 방법을 정리합니다."
pubDate: "2026-07-02T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

`git show`는 Git에서 **특정 커밋의 상세 내용을 확인하는 명령어**입니다.

`git log`가 여러 커밋의 기록을 목록 형태로 보여주는 명령어라면, `git show`는 특정 커밋 하나를 자세히 보여주는 명령어입니다.

가장 기본적인 사용법은 다음과 같습니다.

```bash
git show
```

또는 특정 커밋을 지정해서 볼 수도 있습니다.

```bash
git show <commit-hash>
```

---

## 1. `git show`

```bash
git show
```

`git show`를 커밋 해시 없이 실행하면, 기본적으로 현재 `HEAD`가 가리키는 커밋의 상세 내용을 보여줍니다.

여기서 `HEAD`는 현재 브랜치의 최신 커밋을 의미한다고 이해하면 됩니다.

즉, 다음 명령어는 현재 브랜치의 가장 최근 커밋 내용을 자세히 보여줍니다.

```bash
git show
```

예를 들어 다음과 같은 정보가 출력될 수 있습니다.

```bash
commit a1b2c3d4e5f67890abcdef1234567890abcdef12
Author: ChocoBreeze <example@email.com>
Date:   Tue Jun 16 22:10:30 2026 +0900

    Update README

diff --git a/README.md b/README.md
index e69de29..4b825dc 100644
--- a/README.md
+++ b/README.md
@@ -1,3 +1,4 @@
 # Git Practice

 Git command summary
+Add git show explanation
```

이 출력에는 크게 두 가지 정보가 들어 있습니다.

```text
커밋 정보
해당 커밋에서 실제로 변경된 내용
```

---

## 2. `git show` 출력 읽는 방법

`git show` 출력의 앞부분은 커밋 정보를 보여줍니다.

```bash
commit a1b2c3d4e5f67890abcdef1234567890abcdef12
Author: ChocoBreeze <example@email.com>
Date:   Tue Jun 16 22:10:30 2026 +0900

    Update README
```

각 항목의 의미는 다음과 같습니다.

```text
commit  → 커밋 해시
Author  → 커밋 작성자
Date    → 커밋 날짜
메시지  → 커밋 메시지
```

그 아래에는 해당 커밋에서 변경된 파일 내용이 표시됩니다.

```diff
diff --git a/README.md b/README.md
index e69de29..4b825dc 100644
--- a/README.md
+++ b/README.md
@@ -1,3 +1,4 @@
 # Git Practice

 Git command summary
+Add git show explanation
```

여기서 `+`가 붙은 줄은 새로 추가된 줄입니다.

```diff
+Add git show explanation
```

반대로 `-`가 붙은 줄은 삭제된 줄입니다.

```diff
-old text
+new text
```

이 경우 `old text`가 삭제되고, `new text`가 추가되었다는 의미입니다.

---

## 3. `git show <commit-hash>`

```bash
git show <commit-hash>
```

특정 커밋을 자세히 확인하고 싶다면 커밋 해시를 함께 입력합니다.

예를 들어 커밋 해시가 `a1b2c3d`라면 다음처럼 사용할 수 있습니다.

```bash
git show a1b2c3d
```

이 명령어는 `a1b2c3d` 커밋의 상세 정보를 보여줍니다. 즉, 해당 커밋에서 어떤 파일이 바뀌었고, 어떤 줄이 추가되거나 삭제되었는지 확인할 수 있습니다.

---

## 4. 커밋 해시는 어디서 찾을까?

커밋 해시는 보통 `git log`에서 확인합니다.

```bash
git log --oneline
```

예를 들어 다음과 같은 결과가 있다고 해보겠습니다.

```bash
a1b2c3d Update README
d4e5f6g Add login feature
h7i8j9k Fix typo in docs
```

여기서 왼쪽에 있는 `a1b2c3d`, `d4e5f6g`, `h7i8j9k`가 커밋 해시입니다.

특정 커밋의 내용을 자세히 보고 싶다면 이 해시를 `git show` 뒤에 붙이면 됩니다.

```bash
git show d4e5f6g
```

이 명령어는 `Add login feature` 커밋에서 실제로 어떤 변경이 있었는지 보여줍니다.

---

## 5. `git log`와 `git show`의 차이

`git log`와 `git show`는 둘 다 커밋 기록을 확인할 때 사용하지만, 목적이 다릅니다.

| 명령어 | 역할 | 사용하기 좋은 상황 |
| --- | --- | --- |
| `git log` | 커밋 목록 확인 | 어떤 커밋들이 있었는지 전체 흐름을 보고 싶을 때 |
| `git show` | 특정 커밋 상세 확인 | 특정 커밋 하나에서 무엇이 바뀌었는지 보고 싶을 때 |

예를 들어 커밋 목록을 먼저 확인하려면 다음 명령어를 사용합니다.

```bash
git log --oneline
```

그리고 그중 하나의 커밋을 자세히 보고 싶다면 다음처럼 사용합니다.

```bash
git show <commit-hash>
```

즉, 일반적인 흐름은 다음과 같습니다.

```bash
git log --oneline
git show <commit-hash>
```

---

## 6. `git show`는 언제 사용할까?

`git show`는 다음과 같은 상황에서 유용합니다.

```text
특정 커밋에서 어떤 파일이 수정되었는지 확인할 때
특정 커밋의 실제 코드 변경 내용을 보고 싶을 때
리뷰 중인 커밋 하나를 자세히 확인할 때
되돌릴 커밋이 맞는지 확인할 때
cherry-pick 하기 전에 커밋 내용을 확인할 때
```

예를 들어 특정 커밋을 되돌리기 전에 정말 그 커밋이 맞는지 확인하고 싶다면 다음처럼 사용할 수 있습니다.

```bash
git show a1b2c3d
```

내용을 확인한 뒤, 필요하다면 다음 명령어로 되돌릴 수 있습니다.

```bash
git revert a1b2c3d
```

또는 특정 커밋만 현재 브랜치에 가져오고 싶을 때도 먼저 내용을 확인할 수 있습니다.

```bash
git show a1b2c3d
git cherry-pick a1b2c3d
```

---

## 7. 특정 파일의 변경만 보고 싶을 때

특정 커밋 전체가 아니라, 그 커밋 안에서 특정 파일의 변경 내용만 보고 싶을 수도 있습니다.

이때는 커밋 해시 뒤에 파일명을 붙이면 됩니다.

```bash
git show <commit-hash> -- <file>
```

예를 들어 `a1b2c3d` 커밋에서 `README.md` 파일의 변경 내용만 보고 싶다면 다음처럼 입력합니다.

```bash
git show a1b2c3d -- README.md
```

여기서 `--`는 뒤에 나오는 값이 브랜치 이름이나 옵션이 아니라 파일 경로라는 것을 구분해주는 역할을 합니다.

파일명이 명확한 경우 생략해도 동작하는 경우가 있지만, 혼동을 줄이기 위해 파일 경로 앞에 `--`를 붙이는 것이 좋습니다.

---

## 8. 변경 내용 없이 커밋 정보만 보고 싶을 때

기본 `git show`는 커밋 정보와 변경 내용을 함께 보여줍니다.

하지만 변경 내용은 제외하고 어떤 파일들이 얼마나 바뀌었는지만 보고 싶다면 `--stat` 옵션을 사용할 수 있습니다.

```bash
git show --stat <commit-hash>
```

예시:

```bash
commit a1b2c3d
Author: ChocoBreeze <example@email.com>
Date:   Tue Jun 16 22:10:30 2026 +0900

    Update README

 README.md | 1 +
 1 file changed, 1 insertion(+)
```

이 출력은 실제 코드 diff 전체를 보여주지는 않고, 어떤 파일이 얼마나 변경되었는지 요약해서 보여줍니다.

---

## 9. 특정 커밋의 파일 내용을 확인할 때

`git show`는 커밋 자체뿐만 아니라, 특정 커밋 시점의 파일 내용을 확인할 때도 사용할 수 있습니다.

형식은 다음과 같습니다.

```bash
git show <commit-hash>:<file-path>
```

예를 들어 `a1b2c3d` 커밋 시점의 `README.md` 파일 내용을 보고 싶다면 다음처럼 입력합니다.

```bash
git show a1b2c3d:README.md
```

이 명령어는 해당 커밋에서 `README.md` 파일이 어떤 내용을 가지고 있었는지 출력합니다.

즉, "이 커밋 당시 이 파일 내용이 뭐였지?"를 확인할 때 유용합니다.

---

## 10. 자주 쓰는 흐름

최근 커밋 목록을 짧게 확인합니다.

```bash
git log --oneline
```

확인하고 싶은 커밋 해시를 선택한 뒤 상세 내용을 확인합니다.

```bash
git show a1b2c3d
```

특정 파일만 보고 싶다면 다음처럼 확인합니다.

```bash
git show a1b2c3d -- README.md
```

변경 내용 전체가 아니라 요약만 보고 싶다면 다음처럼 확인합니다.

```bash
git show --stat a1b2c3d
```

---

## 11. `git show`와 `git diff`의 차이

`git show`와 `git diff`도 비슷해 보일 수 있습니다. 둘 다 변경 내용을 보여주기 때문입니다.

하지만 기준이 다릅니다.

| 명령어 | 비교 기준 | 사용 목적 |
| --- | --- | --- |
| `git diff` | 현재 작업 중인 변경 내용 | 아직 커밋하지 않은 변경을 확인 |
| `git show` | 특정 커밋 하나 | 이미 만들어진 커밋의 내용을 확인 |

예를 들어 아직 커밋하지 않은 수정 내용을 확인하고 싶다면 다음을 사용합니다.

```bash
git diff
```

반면 이미 만들어진 특정 커밋의 내용을 확인하고 싶다면 다음을 사용합니다.

```bash
git show <commit-hash>
```

즉, `git diff`는 커밋 전 확인에 가깝고, `git show`는 커밋 후 확인에 가깝습니다.

---

## 마무리 정리

`git show`는 특정 커밋의 상세 내용을 확인하는 명령어입니다.

커밋 해시 없이 `git show`를 실행하면 현재 `HEAD`, 즉 현재 브랜치의 최신 커밋을 보여줍니다.

특정 커밋을 보고 싶다면 다음처럼 커밋 해시를 함께 입력합니다.

```bash
git show <commit-hash>
```

커밋 목록은 보통 `git log --oneline`으로 먼저 확인하고, 자세히 보고 싶은 커밋을 `git show`로 확인하는 흐름을 사용합니다.

한 문장으로 정리하면 다음과 같습니다.

> `git show`는 특정 커밋 하나의 정보와 실제 변경 내용을 자세히 확인하는 명령어이며, `git show <commit-hash>` 형태로 사용하면 원하는 커밋의 상세 내용을 볼 수 있다.
