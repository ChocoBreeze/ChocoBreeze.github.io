---
title: "git log 명령어 정리"
slug: "git-log-command-guide"
description: "git log, git log --oneline, git log --graph --all, Git alias로 커밋 기록을 확인하는 방법을 정리합니다."
pubDate: "2026-06-17T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "Git Log", "CLI", "Version Control", "Developer Tools"]
---

`git log`는 Git에서 <strong>커밋 기록을 확인하는 명령어</strong>입니다.

Git은 작업 내용을 커밋 단위로 저장합니다. `git log`를 사용하면 지금까지 어떤 커밋들이 만들어졌는지, 누가 작성했는지, 언제 작성했는지, 어떤 메시지로 커밋했는지 확인할 수 있습니다.

가장 기본적인 사용법은 다음과 같습니다.

```bash
git log
```

## 1. `git log`

```bash
git log
```

`git log`는 현재 브랜치의 커밋 기록을 자세히 보여줍니다.

예를 들어 다음과 같은 결과가 나올 수 있습니다.

```bash
commit a1b2c3d4e5f67890abcdef1234567890abcdef12
Author: ChocoBreeze <example@email.com>
Date:   Tue Jun 16 22:10:30 2026 +0900

    Update README
```

이 출력에는 다음 정보가 포함됩니다.

```text
commit  → 커밋 해시
Author  → 커밋 작성자
Date    → 커밋 날짜
메시지  → 커밋 메시지
```

여기서 `commit` 뒤에 나오는 긴 문자열은 <strong>커밋 해시</strong>입니다.

```text
a1b2c3d4e5f67890abcdef1234567890abcdef12
```

커밋 해시는 각 커밋을 구분하는 고유한 ID라고 볼 수 있습니다.

특정 커밋을 확인하거나 되돌리거나 비교할 때 이 커밋 해시를 사용합니다.

## 2. `git log`를 언제 사용할까?

`git log`는 다음과 같은 상황에서 자주 사용합니다.

```text
이전에 어떤 작업을 했는지 확인할 때
최근 커밋 메시지를 확인할 때
특정 커밋의 해시를 찾을 때
브랜치의 작업 흐름을 확인할 때
되돌릴 커밋을 찾을 때
```

예를 들어 특정 커밋을 되돌리고 싶을 때는 먼저 `git log`로 커밋 해시를 찾고, 이후 `git revert`나 `git reset` 같은 명령어를 사용할 수 있습니다.

```bash
git log
git revert <commit-hash>
```

즉, `git log`는 단순히 기록을 보는 명령어이지만, 다른 Git 명령어를 사용하기 전에 기준이 되는 커밋을 찾는 데도 많이 사용됩니다.

## 3. `git log --oneline`

```bash
git log --oneline
```

`git log --oneline`은 커밋 기록을 <strong>한 줄씩 짧게 보여주는 명령어</strong>입니다.

기본 `git log`는 커밋 하나마다 여러 줄을 사용하기 때문에, 커밋이 많으면 한눈에 보기 어렵습니다.

이럴 때 `--oneline` 옵션을 사용하면 커밋 기록을 간단하게 확인할 수 있습니다.

예시:

```bash
a1b2c3d Update README
d4e5f6g Add login feature
h7i8j9k Fix typo in docs
```

각 줄은 다음과 같이 구성됩니다.

```text
짧은 커밋 해시 + 커밋 메시지
```

예를 들어:

```bash
a1b2c3d Update README
```

여기서 `a1b2c3d`는 커밋 해시의 앞부분이고, `Update README`는 커밋 메시지입니다.

## 4. `git log`와 `git log --oneline` 차이

두 명령어의 차이는 출력 방식입니다.

| 명령어 | 특징 | 사용하기 좋은 상황 |
| --- | --- | --- |
| `git log` | 커밋 정보를 자세히 보여줌 | 작성자, 날짜, 전체 해시까지 자세히 보고 싶을 때 |
| `git log --oneline` | 커밋을 한 줄씩 짧게 보여줌 | 커밋 흐름을 빠르게 훑어보고 싶을 때 |

처음에는 `git log`로 커밋 정보가 어떻게 구성되어 있는지 이해하는 것이 좋습니다.

익숙해진 뒤에는 `git log --oneline`을 더 자주 사용하게 됩니다.

## 5. `git log --oneline --graph --all`

```bash
git log --oneline --graph --all
```

이 명령어는 커밋 기록을 한 줄로 보여주면서, 브랜치 흐름을 그래프 형태로 함께 보여줍니다.

각 옵션의 의미는 다음과 같습니다.

```text
--oneline  → 커밋을 한 줄로 간단히 표시
--graph    → 브랜치와 병합 흐름을 그래프로 표시
--all      → 모든 브랜치의 커밋 기록을 표시
```

예를 들어 다음과 같은 결과가 나올 수 있습니다.

```bash
* a1b2c3d Update README
* d4e5f6g Merge branch 'feature/login'
|\
| * h7i8j9k Add login form
| * l1m2n3o Add login validation
|/
* p4q5r6s Initial commit
```

여기서 `*`, `|`, `\`, `/` 같은 문자는 브랜치의 흐름을 나타냅니다.

```text
*  → 커밋
|  → 커밋 흐름
\  → 브랜치가 갈라짐 또는 합쳐짐
/  → 브랜치가 다시 합쳐짐
```

이 명령어를 사용하면 브랜치가 어디서 갈라졌고, 어디서 병합되었는지 한눈에 볼 수 있습니다.

## 6. `--all` 옵션이 중요한 이유

`git log --oneline --graph`만 사용하면 현재 브랜치를 기준으로 커밋 기록을 보여줍니다.

```bash
git log --oneline --graph
```

하지만 `--all`을 붙이면 현재 브랜치뿐만 아니라 다른 브랜치의 커밋 흐름도 함께 볼 수 있습니다.

```bash
git log --oneline --graph --all
```

그래서 브랜치가 여러 개 있을 때는 `--all`을 붙이는 것이 더 유용합니다.

예를 들어 `main`, `develop`, `feature/login` 브랜치가 각각 어떻게 진행되고 있는지 보고 싶다면 `--all` 옵션을 함께 사용하는 것이 좋습니다.

## 7. Git alias 확인하기

Git에서는 자주 사용하는 긴 명령어를 짧은 별칭으로 등록할 수 있습니다.

이 별칭을 <strong>alias</strong>라고 합니다.

현재 설정된 Git alias를 확인하려면 다음 명령어를 사용할 수 있습니다.

```bash
git config --get-regexp alias
```

이 명령어를 실행하면 현재 설정된 alias 목록이 출력됩니다.

예를 들어 다음과 같은 alias가 설정되어 있을 수 있습니다.

```bash
alias.lg log --graph --abbrev-commit --decorate --format=format:'%C(cyan)%h%C(reset) - %C(#FFBE98)%cd%C(reset) %C(#BE3455)(%ar)%C(reset) %C(bold white)%s%C(reset) %C(#FFFF00)- %an%C(reset)%C(auto)%d%C(reset)' --date=format:'%Y-%m-%d %A %H:%M:%S' --all -n
alias.lgb log --graph --abbrev-commit --decorate --format=format:'%C(cyan)%h%C(reset) - %C(#FFBE98)%cd%C(reset) %C(#BE3455)(%ar)%C(reset) %C(bold white)%s%C(reset) %C(#FFFF00)- %an%C(reset)%C(auto)%d%C(reset)' --date=format:'%Y-%m-%d %A %H:%M:%S' -n 10
```

여기서는 `lg`와 `lgb`라는 alias가 설정되어 있습니다.

즉, 앞으로는 긴 `git log ...` 명령어를 직접 입력하지 않고 다음처럼 짧게 사용할 수 있습니다.

```bash
git lg
git lgb
```

## 8. `git lg`

설정된 alias 중 `lg`는 다음과 같습니다.

```bash
alias.lg log --graph --abbrev-commit --decorate --format=format:'%C(cyan)%h%C(reset) - %C(#FFBE98)%cd%C(reset) %C(#BE3455)(%ar)%C(reset) %C(bold white)%s%C(reset) %C(#FFFF00)- %an%C(reset)%C(auto)%d%C(reset)' --date=format:'%Y-%m-%d %A %H:%M:%S' --all -n
```

이 alias는 실제로 다음 명령어처럼 사용할 수 있습니다.

```bash
git lg
```

다만 이 alias 끝에는 `-n` 옵션이 붙어 있습니다.

```bash
-n
```

`-n`은 출력할 커밋 개수를 제한하는 옵션입니다.

예를 들어 다음처럼 사용할 수 있습니다.

```bash
git lg 10
```

이 명령어는 모든 브랜치의 커밋 기록 중 최근 10개를 보기 좋게 출력합니다.

즉, `git lg 10`은 대략 다음과 같은 의미입니다.

```text
모든 브랜치의 커밋 기록을 그래프 형태로 보여주되, 최근 10개만 보여준다.
```

## 9. `git lg` alias 구성 요소

`git lg` alias에 들어간 주요 옵션을 나눠보면 다음과 같습니다.

```bash
log
```

커밋 기록을 보여줍니다.

```bash
--graph
```

브랜치 흐름을 그래프로 보여줍니다.

```bash
--abbrev-commit
```

커밋 해시를 전체 길이가 아니라 짧은 형태로 보여줍니다.

```bash
--decorate
```

브랜치 이름, 태그 이름, HEAD 위치 같은 참조 정보를 함께 보여줍니다.

```bash
--all
```

현재 브랜치뿐만 아니라 모든 브랜치의 커밋 기록을 보여줍니다.

```bash
-n
```

출력할 커밋 개수를 제한합니다.

예를 들어 `git lg 10`처럼 사용하면 최근 10개의 커밋만 보여줍니다.

## 10. `--format` 옵션

이 alias에서 가장 긴 부분은 `--format` 옵션입니다.

```bash
--format=format:'%C(cyan)%h%C(reset) - %C(#FFBE98)%cd%C(reset) %C(#BE3455)(%ar)%C(reset) %C(bold white)%s%C(reset) %C(#FFFF00)- %an%C(reset)%C(auto)%d%C(reset)'
```

`--format`은 `git log`의 출력 형식을 직접 지정하는 옵션입니다.

여기서는 커밋 정보를 다음 순서로 보여주도록 설정되어 있습니다.

```text
커밋 해시
커밋 날짜
상대 시간
커밋 메시지
작성자
브랜치/태그 정보
```

예를 들어 출력 형태는 대략 다음과 비슷합니다.

```bash
* a1b2c3d - 2026-06-16 Tuesday 22:10:30 (2 hours ago) Update README - ChocoBreeze (HEAD -> main, origin/main)
```

각 포맷 코드는 다음과 같은 의미입니다.

| 코드 | 의미 |
| --- | --- |
| `%h` | 짧은 커밋 해시 |
| `%cd` | 커밋 날짜 |
| `%ar` | 상대 시간 |
| `%s` | 커밋 메시지 |
| `%an` | 작성자 이름 |
| `%d` | 브랜치, 태그, HEAD 같은 참조 정보 |

그리고 `%C(...)`는 색상을 지정하는 코드입니다.

예를 들어:

```text
%C(cyan)       → 청록색
%C(reset)      → 색상 초기화
%C(bold white) → 굵은 흰색
```

즉, 이 alias는 단순히 커밋 기록을 보여주는 것뿐만 아니라, 커밋 해시, 날짜, 메시지, 작성자, 브랜치 정보를 색상과 함께 보기 좋게 출력하도록 만든 설정입니다.

## 11. `--date=format` 옵션

이 alias에는 날짜 형식도 직접 지정되어 있습니다.

```bash
--date=format:'%Y-%m-%d %A %H:%M:%S'
```

이 설정은 날짜를 다음과 같은 형식으로 보여줍니다.

```text
2026-06-16 Tuesday 22:10:30
```

각 코드는 다음 의미입니다.

| 코드 | 의미 |
| --- | --- |
| `%Y` | 연도 |
| `%m` | 월 |
| `%d` | 일 |
| `%A` | 요일 |
| `%H` | 시 |
| `%M` | 분 |
| `%S` | 초 |

즉, 기본 `git log`보다 날짜가 더 보기 좋고 일정한 형식으로 출력됩니다.

## 12. `git lgb`

설정된 alias 중 `lgb`는 다음과 같습니다.

```bash
alias.lgb log --graph --abbrev-commit --decorate --format=format:'%C(cyan)%h%C(reset) - %C(#FFBE98)%cd%C(reset) %C(#BE3455)(%ar)%C(reset) %C(bold white)%s%C(reset) %C(#FFFF00)- %an%C(reset)%C(auto)%d%C(reset)' --date=format:'%Y-%m-%d %A %H:%M:%S' -n 10
```

이 alias는 다음처럼 사용할 수 있습니다.

```bash
git lgb
```

`git lgb`는 현재 브랜치 기준으로 최근 10개의 커밋 기록을 보기 좋게 보여줍니다.

`git lg`와 비슷하지만 차이가 있습니다.

`git lgb`에는 `--all` 옵션이 없습니다.

그래서 모든 브랜치가 아니라, 기본적으로 현재 브랜치를 기준으로 커밋 기록을 보여줍니다.

또한 끝에 `-n 10`이 이미 들어가 있습니다.

```bash
-n 10
```

그래서 별도로 숫자를 붙이지 않아도 최근 10개의 커밋만 출력됩니다.

## 13. `git lg`와 `git lgb` 차이

두 alias는 비슷하지만 사용 목적이 조금 다릅니다.

| 명령어 | 기준 | 출력 개수 | 사용하기 좋은 상황 |
| --- | --- | --- | --- |
| `git lg 10` | 모든 브랜치 | 사용자가 숫자로 지정 | 전체 브랜치 흐름을 보고 싶을 때 |
| `git lgb` | 현재 브랜치 | 최근 10개 고정 | 현재 브랜치의 최근 커밋만 빠르게 보고 싶을 때 |

간단히 정리하면 다음과 같습니다.

```text
git lg 10  → 모든 브랜치의 최근 10개 커밋을 그래프로 보기
git lgb    → 현재 브랜치의 최근 10개 커밋을 그래프로 보기
```

## 14. 기본 명령어와 alias 비교

기본 명령어로 브랜치 그래프를 보려면 다음처럼 입력해야 합니다.

```bash
git log --oneline --graph --all
```

더 자세한 날짜, 작성자, 브랜치 정보까지 예쁘게 보려면 명령어가 훨씬 길어집니다.

그래서 이런 긴 명령어를 매번 입력하지 않도록 alias를 설정해두면 편합니다.

예를 들어 다음처럼 사용할 수 있습니다.

```bash
git lg 10
```

또는:

```bash
git lgb
```

이렇게 하면 긴 `git log` 옵션을 기억하지 않아도, 자주 보는 형태의 커밋 기록을 빠르게 확인할 수 있습니다.

## 15. 자주 쓰는 흐름

커밋 기록을 자세히 보고 싶을 때:

```bash
git log
```

커밋 기록을 짧게 보고 싶을 때:

```bash
git log --oneline
```

브랜치 흐름까지 그래프로 보고 싶을 때:

```bash
git log --oneline --graph --all
```

내가 설정한 alias 목록을 확인하고 싶을 때:

```bash
git config --get-regexp alias
```

모든 브랜치의 커밋 흐름을 보기 좋게 보고 싶을 때:

```bash
git lg 10
```

현재 브랜치의 최근 커밋 10개를 보기 좋게 보고 싶을 때:

```bash
git lgb
```

## 마무리 정리

`git log`는 Git의 커밋 기록을 확인하는 기본 명령어입니다.

`git log --oneline`은 커밋 기록을 한 줄씩 간단하게 보여줍니다.

`git log --oneline --graph --all`은 모든 브랜치의 커밋 흐름을 그래프 형태로 확인할 수 있게 해줍니다.

여기에 alias를 설정해두면 긴 `git log` 명령어를 매번 입력하지 않아도 됩니다.

특히 `git lg 10`은 모든 브랜치의 최근 커밋 흐름을 보기 좋게 확인할 때 유용하고, `git lgb`는 현재 브랜치의 최근 커밋 10개를 빠르게 확인할 때 유용합니다.

한 문장으로 정리하면 다음과 같습니다.

> `git log`는 커밋 기록을 확인하는 명령어이고, `--oneline`, `--graph`, `--all` 옵션을 함께 사용하면 커밋 흐름을 더 간단하고 시각적으로 확인할 수 있으며, alias를 설정하면 자주 쓰는 log 명령어를 훨씬 편하게 사용할 수 있다.
