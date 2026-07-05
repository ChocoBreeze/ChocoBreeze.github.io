---
title: "Git 버그 발생 커밋 찾기: git bisect 정리"
slug: "git-bisect-command-guide"
description: "git bisect로 버그가 처음 발생한 커밋을 이진 탐색으로 찾는 방법과 git bisect run으로 자동화하는 방법을 정리합니다."
pubDate: "2026-07-06T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

`git bisect`는 Git에서 **문제가 처음 발생한 커밋을 찾을 때 사용하는 명령어**입니다.

프로젝트를 개발하다 보면 어느 순간부터 버그가 생기는 경우가 있습니다.

예를 들어 다음과 같은 상황입니다.

```text
예전에는 정상 동작했는데 지금은 오류가 난다.
어느 커밋부터 테스트가 실패하는지 모르겠다.
최근 커밋이 너무 많아서 하나씩 확인하기 어렵다.
버그를 만든 커밋을 빠르게 찾고 싶다.
```

이때 사용할 수 있는 명령어가 `git bisect`입니다.

`bisect`는 반으로 나눈다는 뜻입니다.

Git은 정상 동작했던 커밋과 문제가 있는 커밋 사이를 반씩 나누어 확인하면서, 버그가 처음 생긴 커밋을 찾아줍니다.

---

## 1. `git bisect`란?

`git bisect`는 Git 커밋 기록을 대상으로 이진 탐색을 수행하는 명령어입니다.

이진 탐색은 범위를 절반씩 줄여가며 원하는 대상을 찾는 방식입니다.

예를 들어 커밋이 다음처럼 있다고 해보겠습니다.

```text
A --- B --- C --- D --- E --- F --- G
```

여기서 `A` 커밋에서는 정상 동작했고, `G` 커밋에서는 버그가 발생한다고 해보겠습니다.

그러면 버그는 `A`와 `G` 사이의 어느 커밋에서 처음 생겼을 가능성이 있습니다.

이때 모든 커밋을 하나씩 확인하면 오래 걸립니다.

하지만 `git bisect`는 중간 커밋을 먼저 확인합니다.

```text
A --- B --- C --- D --- E --- F --- G
              ↑
         중간 커밋 확인
```

만약 `D`에서 문제가 발생한다면, 버그는 `A`와 `D` 사이에서 생긴 것입니다.

반대로 `D`에서 문제가 없다면, 버그는 `D`와 `G` 사이에서 생긴 것입니다.

이렇게 범위를 절반씩 줄여가며 문제 커밋을 찾습니다.

`git bisect`는 다음 상황에서 유용합니다.

```text
버그가 언제부터 생겼는지 모를 때
테스트가 어느 커밋부터 실패하는지 찾고 싶을 때
최근 변경 사항이 많아서 직접 찾기 어려울 때
정상 커밋과 문제 커밋은 알고 있지만, 그 사이의 원인 커밋을 모를 때
```

예를 들어 어제는 정상 동작했는데 오늘은 오류가 난다면, 정상 동작했던 커밋과 현재 커밋을 기준으로 `git bisect`를 사용할 수 있습니다.

```text
정상 동작했던 커밋
→ good

문제가 발생하는 커밋
→ bad
```

`git bisect`는 이 두 기준 사이에서 문제를 만든 커밋을 찾아줍니다.

---

## 2. `git bisect` 기본 흐름

`git bisect`는 보통 다음 흐름으로 사용합니다.

```bash
git bisect start
git bisect bad
git bisect good <good-commit-hash>
# Git이 이동시킨 커밋에서 테스트
git bisect good
# 또는
git bisect bad
# 반복
git bisect reset
```

각 명령어의 의미는 다음과 같습니다.

```text
git bisect start
→ bisect 시작

git bisect bad
→ 현재 커밋은 문제가 있다고 표시

git bisect good <commit-hash>
→ 특정 과거 커밋은 정상이라고 표시

git bisect good
→ 현재 확인 중인 커밋은 정상이라고 표시

git bisect bad
→ 현재 확인 중인 커밋은 문제가 있다고 표시

git bisect reset
→ bisect 종료 후 원래 브랜치 상태로 돌아가기
```

---

## 3. `git bisect start`

```bash
git bisect start
```

`git bisect start`는 bisect를 시작하는 명령어입니다.

이 명령어를 실행하면 Git은 이제부터 문제 커밋을 찾기 위한 탐색 모드로 들어갑니다.

```bash
git bisect start
```

하지만 이 명령어만으로는 Git이 어떤 범위에서 찾아야 하는지 모릅니다.

그래서 이어서 현재 커밋이 문제인지, 그리고 어느 과거 커밋이 정상인지 알려줘야 합니다.

---

## 4. `git bisect bad`

```bash
git bisect bad
```

`git bisect bad`는 현재 커밋이 문제가 있는 상태라고 Git에게 알려주는 명령어입니다.

보통 현재 브랜치의 최신 상태에서 버그가 발생한다면 다음처럼 입력합니다.

```bash
git bisect bad
```

이 명령어는 현재 `HEAD` 커밋을 bad, 즉 문제가 있는 커밋으로 표시합니다.

```text
현재 커밋은 버그가 있다.
```

---

## 5. `git bisect good <commit-hash>`

```bash
git bisect good <commit-hash>
```

`git bisect good <commit-hash>`는 특정 과거 커밋이 정상 동작했다는 것을 Git에게 알려주는 명령어입니다.

예를 들어 `a1b2c3d` 커밋에서는 문제가 없었다면 다음처럼 입력합니다.

```bash
git bisect good a1b2c3d
```

그러면 Git은 다음 정보를 알게 됩니다.

```text
현재 커밋은 문제 있음
a1b2c3d 커밋은 정상
```

이제 Git은 정상 커밋과 문제 커밋 사이에서 중간 커밋으로 이동합니다.

그 후 사용자는 그 커밋에서 테스트를 실행하고, 정상인지 문제인지 알려주면 됩니다.

---

## 6. 실제 사용 예시

예를 들어 현재 최신 커밋에서 로그인 기능이 깨졌다고 해보겠습니다.

먼저 bisect를 시작합니다.

```bash
git bisect start
```

현재 커밋은 문제가 있으므로 bad로 표시합니다.

```bash
git bisect bad
```

그다음 정상 동작했던 과거 커밋을 good으로 표시합니다.

```bash
git bisect good a1b2c3d
```

그러면 Git이 중간 커밋으로 자동 이동합니다.

이제 해당 커밋에서 테스트를 실행합니다.

```bash
npm test
```

또는 직접 앱을 실행해서 문제가 발생하는지 확인합니다.

```bash
npm run dev
```

만약 이 커밋에서 문제가 없다면 다음처럼 입력합니다.

```bash
git bisect good
```

반대로 이 커밋에서도 문제가 발생한다면 다음처럼 입력합니다.

```bash
git bisect bad
```

그러면 Git은 다시 범위를 좁혀 다음 중간 커밋으로 이동합니다.

이 과정을 반복하면 Git이 최종적으로 버그를 처음 만든 커밋을 알려줍니다.

### `good`과 `bad`는 무엇을 기준으로 판단할까?

`git bisect`를 사용할 때 가장 중요한 것은 각 커밋을 확인한 뒤 `good`인지 `bad`인지 정확히 표시하는 것입니다.

기준은 단순합니다.

```text
good
→ 해당 커밋에서는 문제가 발생하지 않음

bad
→ 해당 커밋에서는 문제가 발생함
```

예를 들어 특정 테스트가 실패하는 커밋을 찾고 있다면 다음처럼 판단할 수 있습니다.

```bash
npm test
```

테스트가 성공하면:

```bash
git bisect good
```

테스트가 실패하면:

```bash
git bisect bad
```

즉, `good`과 `bad`는 감으로 찍는 것이 아니라, 같은 기준으로 반복해서 판단해야 합니다.

---

## 7. bisect 결과 확인하기

여러 번 `good`, `bad`를 입력하다 보면 Git이 최종적으로 문제를 처음 만든 커밋을 알려줍니다.

예시 출력은 다음과 비슷할 수 있습니다.

```text
d4e5f6g7 is the first bad commit
commit d4e5f6g7
Author: Kim <kim@example.com>
Date:   Mon Jul 6 10:30:00 2026 +0900

    Add login validation
```

이 결과는 `d4e5f6g7` 커밋이 처음으로 문제가 발생한 커밋이라는 뜻입니다.

이제 해당 커밋의 상세 내용을 확인할 수 있습니다.

```bash
git show d4e5f6g7
```

커밋 내용을 보고 어떤 변경이 문제를 만들었는지 분석하면 됩니다.

---

## 8. `git bisect reset`

```bash
git bisect reset
```

`git bisect reset`은 bisect를 종료하고 원래 작업하던 브랜치 상태로 돌아가는 명령어입니다.

`git bisect`를 진행하는 동안 Git은 여러 커밋 사이를 자동으로 이동합니다.

문제 커밋을 찾은 뒤에는 반드시 bisect 모드를 종료해야 합니다.

```bash
git bisect reset
```

이 명령어를 실행하면 bisect 시작 전 위치로 돌아갑니다.

---

## 9. `git bisect`와 `git blame` 차이

`git bisect`와 `git blame`은 모두 문제 원인을 추적할 때 사용할 수 있습니다.

하지만 보는 관점이 다릅니다.

| 명령어                | 기준       | 목적                     |
| ------------------ | -------- | ---------------------- |
| `git blame <file>` | 파일의 줄 단위 | 특정 줄이 어떤 커밋에서 수정됐는지 확인 |
| `git bisect`       | 커밋 범위    | 문제가 처음 발생한 커밋 찾기       |

예를 들어 특정 코드 줄이 의심된다면 `git blame`을 사용할 수 있습니다.

```bash
git blame src/login.js
```

반면 어느 커밋부터 테스트가 실패하는지 모른다면 `git bisect`가 더 적합합니다.

```bash
git bisect start
```

간단히 말하면 다음과 같습니다.

```text
git blame
→ 이 줄은 누가, 언제 수정했지?

git bisect
→ 버그는 어느 커밋부터 생겼지?
```

---

## 10. 자동 테스트와 함께 사용하기

`git bisect`는 직접 `good`, `bad`를 입력하면서 사용할 수도 있지만, 테스트 명령어와 함께 자동으로 실행할 수도 있습니다.

이때 사용하는 명령어가 다음입니다.

```bash
git bisect run <test-command>
```

예를 들어 테스트 명령어가 `npm test`라면 다음처럼 사용할 수 있습니다.

```bash
git bisect start
git bisect bad
git bisect good <good-commit-hash>
git bisect run npm test
```

그러면 Git은 중간 커밋으로 이동할 때마다 `npm test`를 실행합니다.

테스트가 성공하면 good, 실패하면 bad로 판단하면서 자동으로 문제 커밋을 찾습니다.

예를 들어 Python 프로젝트라면 다음처럼 사용할 수 있습니다.

```bash
git bisect run pytest
```

다만 자동 bisect를 사용하려면 테스트 명령어의 성공/실패 결과가 명확해야 합니다.

```text
테스트 성공 → exit code 0
테스트 실패 → 0이 아닌 exit code
```

---

## 11. 중간 커밋이 확인 불가능할 때

`git bisect`를 하다 보면 중간 커밋이 빌드 자체가 안 되는 경우도 있습니다.

예를 들어 의존성 변경 중간 상태거나, 테스트 환경이 맞지 않아 확인할 수 없는 커밋이 있을 수 있습니다.

이때는 해당 커밋을 건너뛸 수 있습니다.

```bash
git bisect skip
```

`git bisect skip`은 현재 커밋을 good 또는 bad로 판단하지 않고 건너뛰는 명령어입니다.

다만 skip이 많아지면 Git이 문제 커밋을 정확히 좁히기 어려울 수 있습니다.

그래서 가능하면 good/bad를 판단하고, 정말 확인이 불가능한 경우에만 skip을 사용하는 것이 좋습니다.

---

## 12. 자주 쓰는 흐름

수동으로 문제 커밋을 찾을 때:

```bash
git bisect start
git bisect bad
git bisect good <good-commit-hash>

# Git이 이동한 커밋에서 테스트
git bisect good
# 또는
git bisect bad

# 문제 커밋을 찾은 뒤
git bisect reset
```

자동 테스트로 문제 커밋을 찾을 때:

```bash
git bisect start
git bisect bad
git bisect good <good-commit-hash>
git bisect run <test-command>
git bisect reset
```

예시:

```bash
git bisect start
git bisect bad
git bisect good a1b2c3d
git bisect run npm test
git bisect reset
```

문제 커밋을 찾은 뒤 상세 내용을 확인할 때:

```bash
git show <bad-commit-hash>
```

---

## 13. 명령어 정리

| 명령어                             | 의미                      |
| ------------------------------- | ----------------------- |
| `git bisect start`              | bisect 시작               |
| `git bisect bad`                | 현재 커밋을 문제가 있는 커밋으로 표시   |
| `git bisect good <commit-hash>` | 특정 커밋을 정상 커밋으로 표시       |
| `git bisect good`               | 현재 커밋을 정상으로 표시          |
| `git bisect reset`              | bisect 종료 후 원래 상태로 돌아가기 |
| `git bisect run <test-command>` | 테스트 명령어로 자동 bisect 실행   |
| `git bisect skip`               | 현재 커밋 판단을 건너뛰기          |

```text
git bisect start
→ 문제 커밋 찾기를 시작한다.

git bisect bad
→ 현재 커밋은 문제가 있다고 표시한다.

git bisect good <commit-hash>
→ 특정 과거 커밋은 정상이라고 표시한다.

git bisect run <test-command>
→ 테스트를 자동 실행하며 문제 커밋을 찾는다.

git bisect reset
→ bisect를 종료하고 원래 상태로 돌아간다.
```

---

## 14. 자주 헷갈리는 상황

### `git bisect`는 자동으로 버그를 고쳐줄까?

아닙니다.

`git bisect`는 버그를 고치는 명령어가 아니라, 버그가 처음 생긴 커밋을 찾는 명령어입니다.

문제 커밋을 찾은 뒤에는 해당 커밋의 변경 내용을 보고 직접 원인을 분석해야 합니다.

```bash
git show <bad-commit-hash>
```

### `good`과 `bad`는 무엇을 기준으로 판단할까?

기준은 내가 찾고 싶은 문제입니다.

예를 들어 로그인 테스트 실패를 찾는 중이라면:

```text
로그인 테스트 성공 → good
로그인 테스트 실패 → bad
```

중요한 것은 bisect 중에는 같은 기준을 계속 유지해야 한다는 점입니다.

### bisect 중 다른 작업을 해도 될까?

가능하면 bisect가 끝날 때까지 다른 작업은 하지 않는 것이 좋습니다.

`git bisect` 중에는 Git이 여러 커밋으로 자동 이동하기 때문에, 현재 브랜치 상태가 평소와 다를 수 있습니다.

작업이 끝나면 반드시 다음 명령어로 종료합니다.

```bash
git bisect reset
```

### 정상 커밋을 모르면 `git bisect`를 사용할 수 없을까?

정상 커밋을 전혀 모르면 사용하기 어렵습니다.

`git bisect`는 "문제가 있는 커밋"과 "정상인 커밋" 사이를 탐색하는 방식이기 때문입니다.

따라서 최소한 다음 두 가지가 필요합니다.

```text
현재 또는 특정 bad 커밋
과거의 good 커밋
```

정상 커밋을 찾기 어렵다면 릴리즈 태그나 과거 배포 커밋을 기준으로 삼을 수 있습니다.

```bash
git tag
git log --oneline
```

---

## 마무리 정리

`git bisect`는 버그가 처음 발생한 커밋을 찾을 때 사용하는 명령어입니다.

정상 동작했던 커밋을 `good`, 문제가 발생하는 커밋을 `bad`로 표시하면, Git이 그 사이의 커밋들을 이진 탐색으로 확인하면서 문제 커밋을 좁혀줍니다.

수동으로 각 커밋을 테스트하며 `git bisect good` 또는 `git bisect bad`를 입력할 수 있고, 자동 테스트가 있다면 `git bisect run <test-command>`로 더 빠르게 찾을 수도 있습니다.

문제 커밋을 찾은 뒤에는 `git bisect reset`으로 bisect를 종료하고, `git show <bad-commit-hash>`로 해당 커밋의 변경 내용을 확인하면 됩니다.

한 문장으로 정리하면 다음과 같습니다.

> `git bisect`는 정상 커밋과 문제 커밋 사이를 이진 탐색해, 버그가 처음 발생한 커밋을 찾아주는 문제 원인 추적 명령어이다.
