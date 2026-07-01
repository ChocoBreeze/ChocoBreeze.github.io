---
title: "git branch 명령어 정리"
slug: "git-branch-command-guide"
description: "git branch, git branch -a, git branch -vv로 브랜치를 확인하고 관리하는 방법을 정리합니다."
pubDate: "2026-06-17T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "Branch", "CLI", "Version Control", "Developer Tools"]
---

`git branch`는 Git에서 <strong>브랜치를 확인하거나 생성, 삭제할 때 사용하는 명령어</strong>입니다.

Git에서 브랜치는 작업 흐름을 나누기 위해 사용합니다. 예를 들어 `main` 브랜치는 안정적인 기본 코드로 두고, 새로운 기능은 `feature/login` 같은 별도 브랜치에서 작업할 수 있습니다.

이렇게 브랜치를 나누면 기존 코드를 바로 건드리지 않고도 새로운 기능 개발, 버그 수정, 테스트 작업을 따로 진행할 수 있습니다.

```bash
git branch
```

가장 기본적인 `git branch` 명령어는 현재 로컬 저장소에 있는 브랜치 목록을 보여줍니다.

## 1. `git branch`

```bash
git branch
```

이 명령어는 <strong>로컬 브랜치 목록</strong>을 확인할 때 사용합니다.

예를 들어 다음과 같은 결과가 나올 수 있습니다.

```bash
  develop
* main
  feature/login
```

여기서 `*` 표시가 붙은 브랜치가 현재 내가 위치한 브랜치입니다.

위 예시에서는 현재 `main` 브랜치에 있는 상태입니다.

```text
* main
```

즉, `git branch`는 "내 로컬 저장소에 어떤 브랜치들이 있고, 지금 나는 어떤 브랜치에 있는가?"를 확인하는 명령어입니다.

## 2. 로컬 브랜치란?

`git branch`를 실행했을 때 보이는 브랜치는 기본적으로 <strong>로컬 브랜치</strong>입니다.

로컬 브랜치는 내 컴퓨터 안에 있는 브랜치입니다.

예를 들어 다음과 같은 브랜치가 있다고 해보겠습니다.

```bash
  main
  develop
  feature/login
```

이 브랜치들은 현재 내 로컬 저장소에서 직접 이동하고 작업할 수 있는 브랜치입니다.

브랜치를 이동할 때는 보통 다음 명령어를 사용합니다.

```bash
git switch 브랜치명
```

예를 들어 `develop` 브랜치로 이동하려면 다음처럼 입력합니다.

```bash
git switch develop
```

## 3. 새 브랜치 만들기

`git branch`는 브랜치 목록을 확인할 때만 쓰는 것이 아니라, 새 브랜치를 만들 때도 사용할 수 있습니다.

```bash
git branch 새브랜치명
```

예를 들어 `feature/login`이라는 브랜치를 만들고 싶다면 다음처럼 입력합니다.

```bash
git branch feature/login
```

다만 이 명령어는 브랜치를 만들기만 하고, 자동으로 그 브랜치로 이동하지는 않습니다.

즉, 다음 명령어를 실행하면:

```bash
git branch feature/login
```

`feature/login` 브랜치는 생성되지만, 현재 브랜치는 그대로입니다.

생성한 브랜치로 이동하려면 추가로 다음 명령어를 실행해야 합니다.

```bash
git switch feature/login
```

그래서 실무에서는 새 브랜치를 만들고 바로 이동할 때 다음 명령어를 더 자주 사용합니다.

```bash
git switch -c feature/login
```

이 명령어는 다음 두 명령어를 합친 것과 비슷합니다.

```bash
git branch feature/login
git switch feature/login
```

## 4. 브랜치 삭제하기

작업이 끝난 브랜치는 삭제할 수 있습니다.

```bash
git branch -d 브랜치명
```

예를 들어 `feature/login` 브랜치를 삭제하려면 다음처럼 입력합니다.

```bash
git branch -d feature/login
```

여기서 `-d`는 delete의 의미입니다.

다만 Git은 아직 병합되지 않은 브랜치를 `-d`로 삭제하려고 하면 경고를 보여줄 수 있습니다. 이는 작업 내용이 사라질 수 있기 때문입니다.

강제로 삭제하려면 대문자 `-D`를 사용할 수 있습니다.

```bash
git branch -D feature/login
```

하지만 `-D`는 병합되지 않은 브랜치도 강제로 삭제하므로 조심해서 사용해야 합니다.

## 5. `git branch -a`

```bash
git branch -a
```

`git branch -a`는 <strong>로컬 브랜치와 원격 브랜치를 모두 보여주는 명령어</strong>입니다.

여기서 `-a`는 all의 의미입니다.

기본 `git branch`는 로컬 브랜치만 보여줍니다.

```bash
git branch
```

예시:

```bash
  develop
* main
  feature/login
```

반면 `git branch -a`를 사용하면 원격 브랜치까지 함께 볼 수 있습니다.

```bash
git branch -a
```

예시:

```bash
  develop
* main
  feature/login
  remotes/origin/HEAD -> origin/main
  remotes/origin/develop
  remotes/origin/main
  remotes/origin/feature/payment
```

여기서 위쪽에 있는 브랜치들은 로컬 브랜치입니다.

```text
develop
main
feature/login
```

아래쪽의 `remotes/origin/...` 형태는 원격 브랜치입니다.

```text
remotes/origin/main
remotes/origin/develop
remotes/origin/feature/payment
```

즉, `git branch -a`는 "내 로컬 브랜치뿐만 아니라, 원격 저장소에 어떤 브랜치가 있는지도 함께 보고 싶을 때" 사용하는 명령어입니다.

## 6. 원격 브랜치란?

원격 브랜치는 GitHub, GitLab 같은 원격 저장소에 있는 브랜치를 의미합니다.

로컬 브랜치가 내 컴퓨터 안에 있는 브랜치라면, 원격 브랜치는 원격 저장소에 있는 브랜치입니다.

예를 들어 다음과 같은 브랜치가 있다고 해보겠습니다.

```text
main
origin/main
```

여기서 `main`은 내 로컬 브랜치입니다.

```text
main
```

반면 `origin/main`은 원격 저장소의 `main` 브랜치를 내 로컬 Git이 기억하고 있는 원격 추적 브랜치입니다.

```text
origin/main
```

즉, `origin/main`은 실제로 원격 저장소의 상태를 나타내는 기준점에 가깝습니다.

## 7. `git branch -a`를 언제 사용할까?

`git branch -a`는 다음 상황에서 유용합니다.

```text
원격 저장소에 어떤 브랜치가 있는지 확인하고 싶을 때
다른 사람이 만든 브랜치가 보이는지 확인하고 싶을 때
로컬에는 없지만 원격에는 있는 브랜치를 찾고 싶을 때
브랜치를 새로 checkout 또는 switch 하기 전에 목록을 확인하고 싶을 때
```

예를 들어 원격 저장소에 `feature/payment` 브랜치가 있는지 확인하고 싶다면 다음 명령어를 사용할 수 있습니다.

```bash
git branch -a
```

출력 결과에 다음과 같은 항목이 보인다면:

```bash
remotes/origin/feature/payment
```

원격 저장소에 `feature/payment` 브랜치가 있다는 뜻입니다.

이 브랜치를 로컬에서 작업하고 싶다면 다음처럼 이동할 수 있습니다.

```bash
git switch feature/payment
```

또는 명시적으로 원격 브랜치를 기준으로 로컬 브랜치를 만들 수도 있습니다.

```bash
git switch -c feature/payment origin/feature/payment
```

## 8. `git branch -vv`

```bash
git branch -vv
```

`git branch -vv`는 <strong>로컬 브랜치가 어떤 원격 브랜치를 추적하고 있는지 자세히 보여주는 명령어</strong>입니다.

여기서 `-v`는 verbose의 의미입니다.

`verbose`는 "자세히 보여준다"는 뜻입니다.

따라서 `git branch -vv`는 브랜치 목록을 조금 더 자세한 정보와 함께 보여줍니다.

## 9. `git branch -vv` 예시

```bash
git branch -vv
```

예시 출력은 다음과 같습니다.

```bash
  develop       a1b2c3d [origin/develop] Add API logic
* main          d4e5f6g [origin/main: behind 2] Update README
  feature/login h7i8j9k [origin/feature/login: ahead 1] Add login form
```

이 결과를 하나씩 보면 다음과 같습니다.

```text
* main
```

현재 위치한 브랜치는 `main`입니다.

```text
d4e5f6g
```

해당 브랜치의 최신 커밋 해시입니다.

```text
[origin/main: behind 2]
```

로컬 `main` 브랜치가 원격의 `origin/main` 브랜치를 추적하고 있으며, 원격보다 2커밋 뒤처져 있다는 뜻입니다.

```text
Update README
```

해당 브랜치의 최신 커밋 메시지입니다.

## 10. `ahead`와 `behind`

`git branch -vv`에서 특히 중요한 표현은 `ahead`와 `behind`입니다.

```bash
[origin/main: behind 2]
```

이 뜻은 로컬 브랜치가 원격 브랜치보다 2커밋 뒤처져 있다는 의미입니다.

즉, 원격에는 있는데 내 로컬에는 아직 없는 커밋이 2개 있습니다.

이 경우 원격 변경 사항을 가져와야 할 수 있습니다.

```bash
git pull
```

또는 먼저 확인만 하고 싶다면 다음처럼 할 수 있습니다.

```bash
git fetch origin
git status -sb
```

반대로 다음처럼 나올 수도 있습니다.

```bash
[origin/feature/login: ahead 1]
```

이 뜻은 로컬 브랜치에 원격에는 아직 없는 커밋이 1개 있다는 의미입니다.

즉, 내가 로컬에서 커밋은 했지만 아직 원격 저장소에 올리지 않은 상태입니다.

이 경우 다음 명령어로 push할 수 있습니다.

```bash
git push
```

둘 다 동시에 나오는 경우도 있습니다.

```bash
[origin/main: ahead 1, behind 2]
```

이 뜻은 다음과 같습니다.

```text
로컬에는 원격에 없는 커밋이 1개 있다.
원격에는 로컬에 없는 커밋이 2개 있다.
```

즉, 로컬과 원격 브랜치가 서로 다른 방향으로 진행된 상태입니다.

이 경우 바로 push하기보다, 먼저 원격 변경 사항을 가져와서 병합하거나 rebase하는 과정이 필요할 수 있습니다.

## 11. 추적 브랜치란?

`git branch -vv`를 이해하려면 추적 브랜치 개념을 알아두면 좋습니다.

로컬 브랜치는 보통 원격 브랜치와 연결되어 있습니다.

예를 들어 로컬 `main` 브랜치는 보통 원격의 `origin/main`을 추적합니다.

```text
main → origin/main
```

이렇게 연결되어 있으면 Git은 현재 로컬 브랜치가 원격 브랜치보다 앞서 있는지, 뒤처져 있는지 알려줄 수 있습니다.

그래서 다음과 같은 정보를 표시할 수 있습니다.

```bash
[origin/main: behind 2]
[origin/main: ahead 1]
```

만약 어떤 브랜치가 원격 브랜치를 추적하고 있지 않다면 `git branch -vv`에서 대괄호 정보가 보이지 않을 수 있습니다.

예를 들어:

```bash
  test-local abc1234 Temporary test
```

이 경우 `test-local` 브랜치는 특정 원격 브랜치와 연결되어 있지 않은 로컬 전용 브랜치일 수 있습니다.

## 12. `git branch`, `git branch -a`, `git branch -vv` 차이

세 명령어는 모두 브랜치 정보를 확인하는 명령어지만, 보여주는 범위가 다릅니다.

| 명령어 | 의미 | 사용하기 좋은 상황 |
| --- | --- | --- |
| `git branch` | 로컬 브랜치 목록 확인 | 내 컴퓨터에 있는 브랜치만 보고 싶을 때 |
| `git branch -a` | 로컬 브랜치와 원격 브랜치 모두 확인 | 원격 저장소의 브랜치까지 함께 보고 싶을 때 |
| `git branch -vv` | 로컬 브랜치의 추적 관계와 ahead/behind 확인 | 각 브랜치가 원격과 어떻게 연결되어 있는지 보고 싶을 때 |

간단히 정리하면 다음과 같습니다.

```text
git branch     → 로컬 브랜치 확인
git branch -a  → 로컬 + 원격 브랜치 확인
git branch -vv → 브랜치별 원격 추적 상태 확인
```

## 13. 자주 쓰는 흐름

브랜치 목록만 간단히 확인하고 싶을 때:

```bash
git branch
```

원격 브랜치까지 전부 확인하고 싶을 때:

```bash
git branch -a
```

내 브랜치들이 원격 브랜치와 어떻게 연결되어 있는지 확인하고 싶을 때:

```bash
git branch -vv
```

원격 저장소의 최신 브랜치 정보를 먼저 가져온 뒤 확인하고 싶다면 다음 흐름이 좋습니다.

```bash
git fetch origin
git branch -a
git branch -vv
```

`git fetch origin`을 먼저 실행하면 원격 저장소의 최신 브랜치 정보가 내 로컬 Git에 반영됩니다.

그 후 `git branch -a`나 `git branch -vv`를 실행하면 더 최신 기준으로 브랜치 상태를 확인할 수 있습니다.

## 마무리 정리

`git branch`는 Git에서 브랜치를 확인하고 관리하는 기본 명령어입니다.

기본형인 `git branch`는 로컬 브랜치 목록을 보여줍니다.

`git branch -a`는 로컬 브랜치뿐만 아니라 원격 브랜치까지 함께 보여줍니다.

`git branch -vv`는 각 로컬 브랜치가 어떤 원격 브랜치를 추적하고 있는지, 그리고 원격보다 앞서 있거나 뒤처져 있는지 확인할 수 있게 해줍니다.

한 문장으로 정리하면 다음과 같습니다.

> `git branch`는 브랜치 목록과 상태를 확인하는 명령어이고, `-a` 옵션은 원격 브랜치까지 함께 보여주며, `-vv` 옵션은 각 브랜치의 원격 추적 관계와 ahead/behind 상태를 자세히 보여준다.
