---
title: "git status 명령어 정리"
slug: "git-status-command-guide"
description: "git status와 git status -sb로 Git 저장소의 현재 상태를 확인하는 방법을 정리합니다."
pubDate: "2026-06-17T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

`git status`는 현재 Git 저장소의 상태를 확인하는 명령어입니다.

Git을 사용할 때 가장 자주 쓰는 명령어 중 하나이며, 보통 작업을 시작하기 전이나 커밋하기 전에 현재 상태를 확인할 때 사용합니다.

```bash
git status
```

이 명령어를 실행하면 다음과 같은 정보를 확인할 수 있습니다.

```text
현재 어떤 브랜치에 있는지
수정된 파일이 있는지
스테이징된 파일이 있는지
아직 Git이 추적하지 않는 새 파일이 있는지
커밋할 내용이 있는지
원격 브랜치와 비교했을 때 앞서 있거나 뒤처져 있는지
```

즉, `git status`는 현재 Git 작업 상황을 전체적으로 보여주는 명령어라고 볼 수 있습니다.

## 1. `git status` 기본 사용법

가장 기본적인 사용법은 다음과 같습니다.

```bash
git status
```

예를 들어 파일을 수정한 뒤 `git status`를 실행하면 다음과 비슷한 결과가 나올 수 있습니다.

```bash
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  modified:   README.md

Untracked files:
  memo.txt

no changes added to commit
```

이 결과는 다음과 같이 이해할 수 있습니다.

```text
현재 브랜치는 main이다.
원격 브랜치 origin/main과 비교했을 때 최신 상태이다.
README.md 파일이 수정되었지만 아직 스테이징되지는 않았다.
memo.txt 파일은 새로 생긴 파일이며 아직 Git이 추적하지 않는다.
아직 커밋에 포함할 변경 사항은 없다.
```

여기서 중요한 표현은 크게 세 가지입니다.

## 2. `Changes not staged for commit`

```text
Changes not staged for commit
```

이 문구는 <strong>파일이 수정되었지만 아직 커밋 준비 영역에 올라가지 않았다는 뜻</strong>입니다.

예를 들어 다음처럼 표시될 수 있습니다.

```bash
Changes not staged for commit:
  modified:   README.md
```

이 경우 `README.md` 파일은 수정되었지만, 아직 `git add`를 하지 않은 상태입니다.

커밋에 포함하려면 다음 명령어를 실행해야 합니다.

```bash
git add README.md
```

또는 현재 디렉토리의 변경 파일을 한 번에 추가하려면 다음처럼 사용할 수 있습니다.

```bash
git add .
```

## 3. `Changes to be committed`

```text
Changes to be committed
```

이 문구는 <strong>커밋에 포함될 준비가 된 변경 사항</strong>을 의미합니다.

예를 들어 다음처럼 표시됩니다.

```bash
Changes to be committed:
  modified:   README.md
```

이 상태는 `README.md` 파일이 이미 `git add`를 통해 스테이징되었다는 뜻입니다.

이제 다음 명령어로 커밋할 수 있습니다.

```bash
git commit -m "Update README"
```

## 4. `Untracked files`

```text
Untracked files
```

이 문구는 <strong>Git이 아직 추적하지 않는 새 파일</strong>이 있다는 뜻입니다.

예를 들어 다음처럼 표시될 수 있습니다.

```bash
Untracked files:
  memo.txt
```

이 경우 `memo.txt`는 폴더 안에 존재하지만, 아직 Git 관리 대상에 포함되지 않은 파일입니다.

이 파일을 Git이 관리하도록 하려면 다음 명령어를 실행합니다.

```bash
git add memo.txt
```

반대로 Git이 관리하지 않아도 되는 파일이라면 `.gitignore`에 추가할 수 있습니다.

예를 들어 로그 파일이나 임시 파일은 보통 Git에 올리지 않습니다.

```gitignore
*.log
.env
node_modules/
```

## 5. `git status`를 언제 사용하면 좋을까?

`git status`는 다음 상황에서 자주 사용합니다.

```text
작업을 시작하기 전 현재 브랜치를 확인할 때
파일을 수정한 뒤 어떤 파일이 변경되었는지 확인할 때
git add 하기 전에 변경 상태를 확인할 때
git commit 하기 전에 커밋될 파일을 확인할 때
git pull 또는 git push 전에 원격 브랜치와의 관계를 확인할 때
```

특히 커밋하기 전에는 습관적으로 다음 흐름을 사용하는 것이 좋습니다.

```bash
git status
git diff
git add .
git status
git commit -m "커밋 메시지"
```

이렇게 하면 원하지 않는 파일이 커밋에 포함되는 실수를 줄일 수 있습니다.

## 6. `git status -sb`

`git status`는 자세한 정보를 보여주기 때문에 처음 배울 때는 좋지만, 매번 보기에는 출력이 조금 길 수 있습니다.

그래서 실무에서는 상태를 짧게 확인하기 위해 다음 명령어도 많이 사용합니다.

```bash
git status -sb
```

여기서 옵션의 의미는 다음과 같습니다.

```text
-s = short
-b = branch
```

즉, `git status -sb`는 <strong>브랜치 정보를 포함해서 상태를 짧은 형식으로 보여주는 명령어</strong>입니다.

## 7. `git status -sb` 예시

예를 들어 다음과 같은 결과가 나올 수 있습니다.

```bash
## main...origin/main
 M README.md
?? memo.txt
```

이 결과는 다음과 같이 해석할 수 있습니다.

```text
현재 브랜치는 main이다.
main 브랜치는 origin/main을 추적하고 있다.
README.md 파일은 수정되었다.
memo.txt 파일은 아직 Git이 추적하지 않는 새 파일이다.
```

## 8. `git status -sb`에서 자주 보이는 표시

### `M`

```bash
 M README.md
```

`M`은 modified의 약자로, 파일이 수정되었다는 뜻입니다.

앞쪽 위치에 따라 의미가 조금 달라질 수 있습니다.

```bash
 M README.md
```

이 경우는 파일이 수정되었지만 아직 스테이징되지 않은 상태입니다.

```bash
M  README.md
```

이 경우는 수정된 파일이 스테이징된 상태입니다.

즉, `M`의 위치가 중요합니다.

```text
왼쪽 칸 = 스테이징 영역 상태
오른쪽 칸 = 작업 디렉토리 상태
```

### `??`

```bash
?? memo.txt
```

`??`는 Git이 아직 추적하지 않는 새 파일이라는 뜻입니다.

이 파일을 커밋에 포함하려면 다음처럼 추가해야 합니다.

```bash
git add memo.txt
```

### `A`

```bash
A  memo.txt
```

`A`는 added의 약자로, 새 파일이 스테이징되었다는 뜻입니다.

즉, 새 파일이 `git add`를 통해 커밋 준비 상태가 된 것입니다.

### `D`

```bash
 D old-file.txt
```

`D`는 deleted의 약자로, 파일이 삭제되었다는 뜻입니다.

이 삭제 내용도 커밋에 반영하려면 `git add`를 해야 합니다.

```bash
git add old-file.txt
```

또는 삭제된 파일을 포함해 전체 변경 사항을 스테이징하려면 다음을 사용할 수 있습니다.

```bash
git add -A
```

## 9. 원격 브랜치보다 앞서 있거나 뒤처진 상태

`git status -sb`를 사용하면 원격 브랜치와의 차이도 간단히 볼 수 있습니다.

예를 들어 다음처럼 나올 수 있습니다.

```bash
## main...origin/main [behind 2]
```

이 의미는 현재 로컬 `main` 브랜치가 원격의 `origin/main`보다 <strong>2커밋 뒤처져 있다</strong>는 뜻입니다.

즉, 원격 저장소에는 내 로컬에 없는 커밋이 2개 있습니다.

이 경우 원격 변경 사항을 가져오려면 보통 다음 명령어를 사용합니다.

```bash
git pull
```

또는 먼저 안전하게 확인하고 싶다면 다음처럼 할 수 있습니다.

```bash
git fetch origin
git status -sb
```

반대로 다음처럼 나올 수도 있습니다.

```bash
## main...origin/main [ahead 1]
```

이 경우는 로컬 `main` 브랜치에 원격 저장소에는 아직 없는 커밋이 1개 있다는 뜻입니다.

즉, 아직 `push`하지 않은 커밋이 있습니다.

이때는 다음 명령어로 원격 저장소에 올릴 수 있습니다.

```bash
git push
```

둘 다 동시에 표시될 수도 있습니다.

```bash
## main...origin/main [ahead 1, behind 2]
```

이 경우는 다음 뜻입니다.

```text
내 로컬에는 원격에 없는 커밋이 1개 있다.
원격에는 내 로컬에 없는 커밋이 2개 있다.
```

즉, 로컬과 원격 브랜치가 서로 다른 방향으로 진행된 상태입니다.

이런 경우에는 바로 무작정 `push`하기보다, 먼저 원격 변경 사항을 가져와서 병합하거나 리베이스하는 과정이 필요할 수 있습니다.

## 10. `git status`와 `git status -sb` 차이

두 명령어의 차이는 다음과 같이 정리할 수 있습니다.

| 명령어 | 특징 | 사용하기 좋은 상황 |
| --- | --- | --- |
| `git status` | 자세한 상태 출력 | Git을 처음 배우거나 상태를 자세히 보고 싶을 때 |
| `git status -sb` | 짧은 상태 출력 | 현재 상태를 빠르게 확인하고 싶을 때 |

처음 Git을 배울 때는 `git status`를 통해 문구를 정확히 이해하는 것이 좋습니다.

익숙해진 뒤에는 `git status -sb`를 사용하면 현재 상태를 더 빠르게 확인할 수 있습니다.

## 11. 자주 쓰는 흐름

작업 중 상태를 빠르게 확인할 때는 다음을 사용할 수 있습니다.

```bash
git status -sb
```

변경 내용을 자세히 확인하고 커밋하려면 다음 흐름이 좋습니다.

```bash
git status
git diff
git add .
git status
git diff --staged
git commit -m "커밋 메시지"
```

원격 브랜치와의 차이를 확인하고 싶을 때는 다음 흐름도 자주 사용합니다.

```bash
git fetch origin
git status -sb
```

## 마무리 정리

`git status`는 현재 Git 저장소의 상태를 확인하는 가장 기본적인 명령어입니다.

수정된 파일, 스테이징된 파일, 새로 추가된 파일, 현재 브랜치 상태 등을 확인할 수 있습니다.

`git status -sb`는 같은 정보를 더 짧은 형식으로 보여주는 명령어입니다.

처음에는 `git status`로 자세한 출력에 익숙해지고, 이후에는 `git status -sb`로 빠르게 상태를 확인하는 방식이 좋습니다.

한 문장으로 정리하면 다음과 같습니다.

> `git status`는 현재 Git 작업 상태를 확인하는 명령어이고, `git status -sb`는 그 상태를 브랜치 정보와 함께 짧게 보여주는 실전형 명령어이다.
