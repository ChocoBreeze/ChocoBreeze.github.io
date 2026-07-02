---
title: "git diff 명령어 정리"
slug: "git-diff-command-guide"
description: "git diff, git diff --staged, git diff --cached, git diff HEAD의 차이와 사용 시점을 정리합니다."
pubDate: "2026-07-02T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

`git diff`는 Git에서 **파일의 변경 내용을 비교해서 보여주는 명령어**입니다.

`git status`가 "어떤 파일이 변경되었는지"를 알려준다면, `git diff`는 "그 파일 안에서 정확히 어떤 내용이 바뀌었는지"를 보여줍니다.

예를 들어 `README.md` 파일을 수정한 뒤 `git status`를 실행하면 다음처럼 수정된 파일 목록을 볼 수 있습니다.

```bash
git status
```

```bash
Changes not staged for commit:
  modified:   README.md
```

하지만 이 상태에서는 `README.md`의 어느 줄이 어떻게 바뀌었는지까지는 알 수 없습니다.

이때 사용하는 명령어가 `git diff`입니다.

```bash
git diff
```

즉, `git diff`는 커밋하기 전에 변경 내용을 확인하는 데 매우 중요한 명령어입니다.

---

## 1. `git diff`

```bash
git diff
```

`git diff`는 **아직 스테이징하지 않은 변경 내용**을 보여줍니다.

다시 말해, 파일은 수정했지만 아직 `git add`를 하지 않은 상태의 변경 내용을 확인할 때 사용합니다.

예를 들어 `README.md`를 수정한 뒤 아직 `git add`를 하지 않았다면 다음 명령어로 변경 내용을 볼 수 있습니다.

```bash
git diff
```

예시 출력은 다음과 비슷합니다.

```diff
diff --git a/README.md b/README.md
index e69de29..4b825dc 100644
--- a/README.md
+++ b/README.md
@@ -1,3 +1,4 @@
 # Git Practice

 Git command summary
+Add git diff explanation
```

여기서 중요한 부분은 다음입니다.

```diff
--- a/README.md
+++ b/README.md
```

`---`는 변경 전 파일을 의미하고, `+++`는 변경 후 파일을 의미합니다.

그리고 다음 부분은 실제 변경된 줄을 보여줍니다.

```diff
+Add git diff explanation
```

앞에 `+`가 붙은 줄은 새로 추가된 줄입니다.

반대로 `-`가 붙은 줄은 삭제된 줄입니다.

```diff
-old text
+new text
```

이 경우 `old text`가 삭제되고, `new text`가 추가되었다는 뜻입니다.

---

## 2. `git diff`는 언제 사용할까?

`git diff`는 주로 `git add`를 하기 전에 사용합니다.

즉, "내가 방금 수정한 내용이 정확히 무엇인지" 확인할 때 사용합니다.

자주 쓰는 흐름은 다음과 같습니다.

```bash
git status
git diff
git add .
```

이렇게 하면 변경된 파일 목록을 먼저 확인하고, 그다음 실제 변경 내용을 확인한 뒤, 문제가 없을 때 스테이징할 수 있습니다.

특히 여러 파일을 수정했을 때는 바로 `git add .`를 하기보다 `git diff`로 변경 내용을 먼저 확인하는 것이 좋습니다.

---

## 3. `git diff --staged`

```bash
git diff --staged
```

`git diff --staged`는 **스테이징된 변경 내용**을 보여줍니다.

즉, `git add`를 한 뒤에 "이번 커밋에 실제로 들어갈 내용"을 확인할 때 사용합니다.

예를 들어 다음과 같은 흐름이 있다고 해보겠습니다.

```bash
git add README.md
git diff --staged
```

이 경우 `git diff --staged`는 `README.md`에서 스테이징된 변경 내용을 보여줍니다.

중요한 점은, `git diff`와 `git diff --staged`가 보여주는 범위가 다르다는 것입니다.

```bash
git diff
```

는 아직 스테이징하지 않은 변경 내용을 보여주고,

```bash
git diff --staged
```

는 이미 스테이징된 변경 내용을 보여줍니다.

`git diff --staged`는 커밋하기 직전에 사용하면 좋습니다. 커밋은 스테이징된 내용만 포함하기 때문에, `git commit`을 실행하기 전에 확인하면 이번 커밋에 어떤 변경 사항이 들어가는지 정확히 알 수 있습니다.

추천 흐름은 다음과 같습니다.

```bash
git status
git diff
git add .
git diff --staged
git commit -m "Update README"
```

이 흐름을 사용하면 커밋 전에 두 번 확인할 수 있습니다.

```text
git diff          → 아직 add 하지 않은 수정 내용 확인
git diff --staged → commit에 들어갈 내용 확인
```

---

## 4. `git diff --cached`

```bash
git diff --cached
```

`git diff --cached`는 `git diff --staged`와 같은 의미입니다.

즉, 둘 다 **스테이징된 변경 내용**을 보여줍니다.

```bash
git diff --staged
git diff --cached
```

위 두 명령어는 같은 역할을 합니다. 둘 중 어느 것을 써도 됩니다.

다만 의미를 처음 이해할 때는 `--staged`가 더 직관적입니다. `staged`라는 단어가 "스테이징된 내용"이라는 뜻을 바로 보여주기 때문입니다.

반면 `--cached`는 Git 내부의 index, 즉 스테이징 영역을 가리키는 표현입니다.

```text
git diff --staged = git diff --cached
```

둘 다 커밋에 들어갈 예정인 변경 내용을 확인하는 명령어입니다.

개인적으로는 `git diff --staged`를 먼저 익히는 것이 좋습니다. 이름이 더 이해하기 쉽기 때문입니다.

---

## 5. `git diff HEAD`

```bash
git diff HEAD
```

`git diff HEAD`는 **마지막 커밋과 현재 작업 상태 전체를 비교하는 명령어**입니다.

여기서 `HEAD`는 현재 브랜치의 최신 커밋을 가리킵니다.

즉, `git diff HEAD`는 마지막 커밋 이후로 변경된 내용을 스테이징 여부와 상관없이 모두 보여줍니다.

```text
git diff HEAD = 마지막 커밋과 현재 상태 전체 비교
```

여기서 "현재 상태 전체"에는 다음이 포함됩니다.

```text
아직 스테이징하지 않은 변경 내용
이미 스테이징한 변경 내용
```

즉, `git diff`와 `git diff --staged`를 합쳐서 보는 느낌에 가깝습니다.

예를 들어 다음과 같은 상황이 있다고 해보겠습니다.

```text
README.md는 수정 후 git add 완료
memo.txt는 수정했지만 아직 git add 하지 않음
```

이때 명령어별로 보이는 내용은 다릅니다.

```bash
git diff
```

아직 스테이징하지 않은 `memo.txt`의 변경 내용만 보여줍니다.

```bash
git diff --staged
```

이미 스테이징된 `README.md`의 변경 내용만 보여줍니다.

```bash
git diff HEAD
```

스테이징 여부와 상관없이 `README.md`와 `memo.txt`의 변경 내용을 모두 보여줍니다.

즉, `git diff HEAD`는 마지막 커밋 이후 전체 변경 내용을 보고 싶을 때 유용합니다.

### `HEAD`란 무엇인가?

`HEAD`는 Git에서 **현재 내가 기준으로 삼고 있는 커밋**을 의미합니다. 보통은 현재 브랜치의 최신 커밋을 가리킵니다.

```text
main 브랜치의 최신 커밋 = HEAD
```

그래서 다음 명령어는 "현재 브랜치의 최신 커밋과 지금 작업 중인 상태를 비교한다"는 의미가 됩니다.

```bash
git diff HEAD
```

---

## 6. 명령어별 비교

`git diff` 관련 명령어는 처음에는 헷갈릴 수 있습니다. 가장 중요한 기준은 **스테이징 여부**입니다.

| 명령어 | 보여주는 내용 | 사용 시점 |
| --- | --- | --- |
| `git diff` | 아직 스테이징하지 않은 변경 내용 | `git add` 하기 전 |
| `git diff --staged` | 스테이징된 변경 내용 | `git commit` 하기 전 |
| `git diff --cached` | `git diff --staged`와 동일 | `git commit` 하기 전 |
| `git diff HEAD` | 마지막 커밋 이후 전체 변경 내용 | 전체 변경 사항을 한 번에 보고 싶을 때 |

간단히 정리하면 다음과 같습니다.

```text
git diff          → add 전 변경 내용
git diff --staged → add 후 commit 전 변경 내용
git diff --cached → git diff --staged와 같음
git diff HEAD     → 마지막 커밋 이후 전체 변경 내용
```

---

## 7. 작업 영역, 스테이징 영역, 커밋

`git diff`를 이해하려면 Git의 세 가지 영역을 함께 생각하면 좋습니다.

```text
작업 디렉토리 → 스테이징 영역 → 커밋
```

각 영역의 의미는 다음과 같습니다.

```text
작업 디렉토리: 실제로 파일을 수정하는 공간
스테이징 영역: 다음 커밋에 포함할 변경 사항을 올려두는 공간
커밋: 저장소에 확정된 기록
```

이 구조에서 `git diff` 명령어들은 서로 다른 구간을 비교합니다.

```text
git diff
→ 작업 디렉토리와 스테이징 영역 비교

git diff --staged
→ 스테이징 영역과 마지막 커밋 비교

git diff HEAD
→ 작업 디렉토리 전체와 마지막 커밋 비교
```

조금 더 풀어 쓰면 다음과 같습니다.

```text
git diff는 아직 add 하지 않은 차이를 보여준다.
git diff --staged는 add는 했지만 아직 commit하지 않은 차이를 보여준다.
git diff HEAD는 add 여부와 상관없이 마지막 commit 이후의 전체 차이를 보여준다.
```

---

## 8. 실전에서 자주 쓰는 흐름

가장 추천하는 커밋 전 확인 흐름은 다음과 같습니다.

```bash
git status -sb
git diff
git add .
git diff --staged
git commit -m "커밋 메시지"
```

이 흐름은 다음 의미를 가집니다.

```text
git status -sb    → 어떤 파일이 바뀌었는지 빠르게 확인
git diff          → 아직 스테이징하지 않은 변경 내용 확인
git add .         → 커밋할 변경 사항을 스테이징
git diff --staged → 실제 커밋에 들어갈 내용 확인
git commit        → 커밋 생성
```

조금 더 전체적으로 보고 싶다면 중간에 다음 명령어를 사용할 수도 있습니다.

```bash
git diff HEAD
```

이 명령어는 마지막 커밋 이후의 전체 변경 사항을 보여주기 때문에, 현재까지 작업한 내용을 한 번에 확인하기 좋습니다.

---

## 9. 자주 헷갈리는 상황

### `git add` 했더니 `git diff`에 아무것도 안 나오는 경우

파일을 수정한 뒤 `git add`를 하면, 기본 `git diff`에는 아무것도 나오지 않을 수 있습니다.

```bash
git add README.md
git diff
```

이때 출력이 없다면 변경 내용이 사라진 것이 아닙니다. 이미 스테이징 영역으로 올라갔기 때문에 `git diff`에서 보이지 않는 것입니다.

이 경우에는 다음 명령어로 확인해야 합니다.

```bash
git diff --staged
```

즉, `git diff`는 아직 스테이징하지 않은 변경만 보여준다는 점을 기억하면 됩니다.

### 커밋 전에 전체 변경을 보고 싶은 경우

커밋 전에 스테이징된 내용과 아직 스테이징되지 않은 내용을 모두 보고 싶다면 다음 명령어를 사용할 수 있습니다.

```bash
git diff HEAD
```

이 명령어는 마지막 커밋 이후 전체 변경 내용을 보여줍니다. "내가 이번 작업에서 전체적으로 무엇을 바꿨는지" 확인할 때 유용합니다.

---

## 10. 파일 하나만 비교하기

전체 파일이 아니라 특정 파일의 변경 내용만 보고 싶다면 파일명을 붙이면 됩니다.

```bash
git diff README.md
```

스테이징된 특정 파일의 변경 내용만 보고 싶다면 다음처럼 사용할 수 있습니다.

```bash
git diff --staged README.md
```

마지막 커밋과 특정 파일의 현재 상태를 비교하고 싶다면 다음처럼 사용할 수 있습니다.

```bash
git diff HEAD README.md
```

이렇게 파일명을 붙이면 출력이 너무 길어지는 것을 줄일 수 있습니다.

---

## 마무리 정리

`git diff`는 Git에서 변경 내용을 비교하는 명령어입니다.

`git status`가 어떤 파일이 바뀌었는지를 알려준다면, `git diff`는 파일 안에서 어떤 줄이 추가되거나 삭제되었는지를 보여줍니다.

기본 `git diff`는 아직 스테이징하지 않은 변경 내용을 보여줍니다.

`git diff --staged`는 스테이징된 변경 내용을 보여주며, `git diff --cached`도 같은 의미입니다.

`git diff HEAD`는 마지막 커밋 이후의 전체 변경 내용을 보여줍니다.

한 문장으로 정리하면 다음과 같습니다.

> `git diff`는 변경 내용을 비교하는 명령어이고, `git diff`는 add 전 변경 내용, `git diff --staged`와 `git diff --cached`는 commit에 들어갈 변경 내용, `git diff HEAD`는 마지막 커밋 이후 전체 변경 내용을 확인할 때 사용한다.
