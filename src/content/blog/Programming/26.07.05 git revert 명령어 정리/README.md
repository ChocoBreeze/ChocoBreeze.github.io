---
title: "Git 커밋 되돌리기: git revert 정리"
slug: "git-revert-command-guide"
description: "git revert로 특정 커밋의 변경 사항을 안전하게 되돌리는 방법과 git reset과의 차이를 정리합니다."
pubDate: "2026-07-05T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

`git revert`는 Git에서 **특정 커밋의 변경 사항을 되돌리는 새 커밋을 만드는 명령어**입니다.

작업하다 보면 이미 만든 커밋을 취소해야 하는 경우가 있습니다.

예를 들어 다음과 같은 상황이 있을 수 있습니다.

```text
잘못된 기능을 추가한 커밋을 되돌리고 싶을 때
버그를 만든 커밋을 취소하고 싶을 때
이미 원격 저장소에 push한 커밋을 안전하게 되돌리고 싶을 때
협업 중인 브랜치의 기록을 지우지 않고 수정하고 싶을 때
```

이때 사용할 수 있는 명령어가 `git revert`입니다.

기본 사용법은 다음과 같습니다.

```bash
git revert <commit-hash>
```

---

## 1. `git revert`는 무엇을 하는 명령어인가?

`git revert`는 특정 커밋을 삭제하는 명령어가 아닙니다.

대신, 해당 커밋에서 변경한 내용을 반대로 적용하는 **새 커밋**을 만듭니다.

예를 들어 커밋 기록이 다음과 같다고 해보겠습니다.

```text
A --- B --- C
          ↑
         HEAD
```

여기서 `B` 커밋의 변경 사항을 되돌리고 싶다면 다음처럼 실행할 수 있습니다.

```bash
git revert <B의 커밋 해시>
```

그러면 기존 `B` 커밋이 사라지는 것이 아니라, `B`의 변경 사항을 취소하는 새 커밋 `D`가 만들어집니다.

```text
A --- B --- C --- D
```

여기서 `D`는 "B에서 변경한 내용을 되돌리는 커밋"입니다.

즉, `git revert`는 기존 기록을 유지하면서 변경 사항을 되돌리는 방식입니다.

---

## 2. 커밋 해시는 어디서 찾을까?

`git revert`를 사용하려면 되돌릴 커밋의 해시를 알아야 합니다.

커밋 해시는 보통 `git log --oneline`으로 확인합니다.

```bash
git log --oneline
```

예시:

```bash
a1b2c3d Fix login validation
d4e5f6g Add payment feature
h7i8j9k Update README
```

여기서 왼쪽에 있는 `a1b2c3d`, `d4e5f6g`, `h7i8j9k`가 커밋 해시입니다.

예를 들어 `Add payment feature` 커밋을 되돌리고 싶다면 다음처럼 입력합니다.

```bash
git revert d4e5f6g
```

이 명령어는 `d4e5f6g` 커밋의 변경 사항을 되돌리는 새 커밋을 만듭니다.

---

## 3. `git revert <commit-hash>`

```bash
git revert <commit-hash>
```

`git revert <commit-hash>`는 지정한 커밋의 변경 사항을 취소하는 새 커밋을 생성합니다.

예를 들어 다음과 같은 커밋 기록이 있다고 해보겠습니다.

```bash
git log --oneline
```

```bash
a1b2c3d Fix login validation
d4e5f6g Add payment feature
h7i8j9k Update README
```

여기서 `d4e5f6g` 커밋을 되돌리고 싶다면 다음 명령어를 실행합니다.

```bash
git revert d4e5f6g
```

그러면 Git은 `d4e5f6g` 커밋에서 추가된 내용은 제거하고, 제거된 내용은 다시 추가하는 방식으로 반대 변경을 적용합니다.

그리고 그 결과를 새로운 커밋으로 저장합니다.

보통 커밋 메시지는 다음과 비슷하게 자동으로 만들어집니다.

```text
Revert "Add payment feature"
```

편집기가 열리면 메시지를 확인하고 저장하면 됩니다.

### `git revert`는 언제 사용할까?

`git revert`는 다음 상황에서 자주 사용합니다.

```text
이미 원격 저장소에 push한 커밋을 되돌릴 때
협업 중인 브랜치에서 안전하게 변경 사항을 취소하고 싶을 때
커밋 기록을 지우지 않고 되돌린 이유를 남기고 싶을 때
특정 기능 추가 커밋을 취소하고 싶을 때
```

특히 이미 원격 저장소에 push한 커밋은 `reset`보다 `revert`로 되돌리는 것이 안전한 경우가 많습니다.

`reset`은 커밋 기록 자체를 이전으로 이동시키지만, `revert`는 기존 기록을 남겨둔 채 되돌리는 새 커밋을 만들기 때문입니다.

---

## 4. `reset`과 `revert`의 차이

`git reset`과 `git revert`는 둘 다 커밋을 되돌릴 때 사용할 수 있지만, 방식이 다릅니다.

| 명령어          | 방식                      | 기록                  |
| ------------ | ----------------------- | ------------------- |
| `git reset`  | 브랜치의 커밋 위치를 이전으로 이동     | 기존 커밋이 기록에서 빠질 수 있음 |
| `git revert` | 특정 커밋의 변경을 취소하는 새 커밋 생성 | 기존 커밋 기록이 남음        |

예를 들어 커밋 기록이 다음과 같다고 해보겠습니다.

```text
A --- B --- C
```

`git reset HEAD~1`을 사용하면 브랜치가 이전 커밋으로 이동합니다.

```text
A --- B
```

반면 `git revert C`를 사용하면 `C` 커밋은 남아 있고, `C`를 되돌리는 새 커밋 `D`가 생깁니다.

```text
A --- B --- C --- D
```

즉, `reset`은 기록을 되감는 느낌이고, `revert`는 되돌리는 기록을 새로 남기는 느낌입니다.

### 왜 협업에서는 `revert`가 안전할까?

협업 중인 브랜치에서는 여러 사람이 같은 원격 브랜치를 기준으로 작업합니다.

이때 이미 push한 커밋을 `reset`으로 없애고 강제 push하면, 다른 사람의 로컬 기록과 원격 기록이 달라질 수 있습니다.

반면 `revert`는 기존 커밋을 삭제하지 않습니다.

대신 "이 커밋을 되돌렸다"는 새 커밋을 추가합니다.

그래서 다른 사람의 작업 흐름을 크게 깨뜨리지 않고 변경 사항을 되돌릴 수 있습니다.

예를 들어 `main` 브랜치에 이미 올라간 커밋을 되돌려야 한다면 보통 다음처럼 처리할 수 있습니다.

```bash
git revert <commit-hash>
git push
```

이렇게 하면 원격 저장소에도 되돌림 커밋이 추가됩니다.

---

## 5. `git revert` 실행 후 생기는 커밋

예를 들어 다음 커밋을 revert했다고 해보겠습니다.

```bash
git revert d4e5f6g
```

그 후 커밋 로그를 확인하면 다음처럼 보일 수 있습니다.

```bash
git log --oneline
```

```bash
k9l0m1n Revert "Add payment feature"
a1b2c3d Fix login validation
d4e5f6g Add payment feature
h7i8j9k Update README
```

여기서 `d4e5f6g` 커밋은 그대로 남아 있습니다.

대신 그 위에 `k9l0m1n Revert "Add payment feature"`라는 새 커밋이 추가되었습니다.

즉, Git 기록을 보면 "payment feature를 추가했다가 나중에 되돌렸다"는 흐름이 남습니다.

이런 점 때문에 `revert`는 협업에서 안전하고 기록 추적에도 좋습니다.

---

## 6. revert 중 충돌이 날 수도 있다

`git revert`도 충돌이 발생할 수 있습니다.

예를 들어 되돌리려는 커밋 이후에 같은 파일의 같은 부분이 많이 수정되었다면, Git이 자동으로 반대 변경을 적용하지 못할 수 있습니다.

이 경우 Git은 충돌난 파일을 알려줍니다.

```bash
git status
```

예시:

```text
both modified:   src/app.js
```

이때는 파일을 열어서 충돌을 직접 해결해야 합니다.

충돌 표시를 정리한 뒤 파일을 스테이징합니다.

```bash
git add src/app.js
```

그다음 revert를 계속 진행합니다.

```bash
git revert --continue
```

즉, revert 중 충돌이 발생하면 다음 흐름을 사용합니다.

```bash
git status
# 충돌 파일 수정
git add <file>
git revert --continue
```

---

## 7. revert를 취소하고 싶을 때

revert 도중 충돌이 발생했거나, 잘못된 커밋을 revert했다는 것을 알게 되었다면 진행 중인 revert를 취소할 수 있습니다.

```bash
git revert --abort
```

이 명령어는 진행 중인 revert 작업을 중단하고, revert를 시작하기 전 상태로 되돌립니다.

예를 들어 다음 명령어를 실행했다가:

```bash
git revert d4e5f6g
```

충돌이 발생했고 지금은 revert를 진행하고 싶지 않다면 다음처럼 취소할 수 있습니다.

```bash
git revert --abort
```

---

## 8. 바로 커밋하지 않고 revert 변경만 적용하기

기본적으로 `git revert <commit-hash>`는 되돌림 커밋을 만듭니다.

하지만 경우에 따라 바로 커밋하지 않고, 되돌린 변경 사항만 작업 디렉토리에 적용하고 싶을 수 있습니다.

이때는 `--no-commit` 옵션을 사용할 수 있습니다.

```bash
git revert --no-commit <commit-hash>
```

또는 짧게 다음처럼 쓸 수도 있습니다.

```bash
git revert -n <commit-hash>
```

이 명령어는 지정한 커밋의 변경 사항을 되돌리지만, 자동으로 커밋하지는 않습니다.

그래서 여러 커밋을 한 번에 되돌린 뒤 하나의 커밋으로 묶고 싶을 때 사용할 수 있습니다.

예를 들어:

```bash
git revert --no-commit a1b2c3d
git revert --no-commit d4e5f6g
git commit -m "Revert login and payment changes"
```

이렇게 하면 두 커밋의 되돌림 내용을 하나의 커밋으로 만들 수 있습니다.

---

## 9. 자주 쓰는 흐름

되돌릴 커밋을 찾습니다.

```bash
git log --oneline
```

커밋 내용을 확인합니다.

```bash
git show <commit-hash>
```

해당 커밋을 revert합니다.

```bash
git revert <commit-hash>
```

원격 저장소에 반영합니다.

```bash
git push
```

즉, 일반적인 흐름은 다음과 같습니다.

```bash
git log --oneline
git show <commit-hash>
git revert <commit-hash>
git push
```

---

## 10. 명령어 정리

| 명령어                                    | 의미                         |
| -------------------------------------- | -------------------------- |
| `git revert <commit-hash>`             | 특정 커밋의 변경 사항을 되돌리는 새 커밋 생성 |
| `git revert --continue`                | revert 중 충돌 해결 후 계속 진행     |
| `git revert --abort`                   | 진행 중인 revert 취소            |
| `git revert --no-commit <commit-hash>` | 자동 커밋 없이 revert 변경만 적용     |

```text
git revert <commit-hash>
→ 특정 커밋의 변경을 취소하는 새 커밋을 만든다.

git revert --continue
→ revert 충돌을 해결한 뒤 계속 진행한다.

git revert --abort
→ 진행 중인 revert를 취소한다.

git revert --no-commit <commit-hash>
→ revert 내용을 커밋하지 않고 작업 디렉토리에만 적용한다.
```

---

## 11. 자주 헷갈리는 상황

### `git revert`는 커밋을 삭제하는 명령어인가?

아닙니다.

`git revert`는 기존 커밋을 삭제하지 않습니다.

대신 해당 커밋의 변경 사항을 반대로 적용하는 새 커밋을 만듭니다.

```text
기존 커밋 삭제 X
되돌림 커밋 생성 O
```

### 이미 push한 커밋도 revert할 수 있나?

네, 가능합니다.

오히려 이미 원격 저장소에 push한 커밋을 되돌릴 때는 `reset`보다 `revert`가 더 안전한 경우가 많습니다.

```bash
git revert <commit-hash>
git push
```

이렇게 하면 기존 기록을 유지하면서 되돌림 커밋을 원격에 추가할 수 있습니다.

### 최신 커밋이 아닌 예전 커밋도 revert할 수 있나?

네, 가능합니다.

`git revert <commit-hash>`는 최신 커밋뿐만 아니라 특정 커밋을 지정해서 되돌릴 수 있습니다.

다만 되돌리려는 커밋 이후에 같은 파일이 많이 변경되었다면 충돌이 발생할 수 있습니다.

이 경우 충돌을 직접 해결한 뒤 다음 명령어로 진행합니다.

```bash
git add <file>
git revert --continue
```

---

## 마무리 정리

`git revert <commit-hash>`는 특정 커밋의 변경 사항을 되돌리는 새 커밋을 만드는 명령어입니다.

기존 커밋 기록을 삭제하지 않기 때문에, 이미 원격 저장소에 push한 커밋이나 협업 중인 브랜치에서 비교적 안전하게 사용할 수 있습니다.

`git reset`이 커밋 기록을 이전으로 이동시키는 방식이라면, `git revert`는 기존 기록을 유지하면서 되돌림 커밋을 추가하는 방식입니다.

따라서 혼자 작업 중이고 아직 push하지 않은 커밋을 정리할 때는 `reset`을 사용할 수 있지만, 이미 공유된 커밋을 되돌릴 때는 `revert`를 사용하는 것이 더 안전합니다.

한 문장으로 정리하면 다음과 같습니다.

> `git revert`는 기존 커밋을 삭제하지 않고, 특정 커밋의 변경 사항을 취소하는 새 커밋을 만들어 안전하게 되돌리는 명령어이다.
