---
title: "Git 태그 관리하기: git tag 정리"
slug: "git-tag-command-guide"
description: "git tag, git tag -a, git push origin --tags, git tag -d로 태그를 생성하고 관리하는 방법을 정리합니다."
pubDate: "2026-07-05T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

`git tag`는 Git에서 **특정 커밋에 이름표를 붙일 때 사용하는 명령어**입니다.

보통 프로젝트에서 특정 버전을 표시할 때 태그를 많이 사용합니다.

예를 들어 다음과 같은 버전명을 커밋에 붙일 수 있습니다.

```bash
v1.0.0
v1.1.0
v2.0.0
```

커밋 해시는 길고 외우기 어렵지만, 태그를 붙여두면 특정 시점을 더 쉽게 찾을 수 있습니다.

이번 글에서는 다음 명령어를 기준으로 Git 태그를 정리합니다.

```bash
git tag
git tag <tag-name>
git tag -a <tag-name> -m "message"
git push origin <tag-name>
git push origin --tags
git tag -d <tag-name>
```

---

## 1. Git 태그란?

Git 태그는 특정 커밋을 가리키는 이름입니다.

커밋은 보통 다음처럼 긴 해시값으로 구분됩니다.

```text
a1b2c3d4e5f67890abcdef1234567890abcdef12
```

하지만 이런 해시는 사람이 기억하기 어렵습니다.

그래서 특정 커밋에 다음과 같은 이름을 붙일 수 있습니다.

```text
v1.0.0
```

이렇게 태그를 붙이면 나중에 해당 버전의 커밋을 쉽게 찾을 수 있습니다.

예를 들어 프로젝트의 첫 번째 정식 배포 시점에 `v1.0.0` 태그를 붙일 수 있습니다.

```bash
git tag v1.0.0
```

즉, 태그는 특정 커밋을 표시해두는 이름표라고 볼 수 있습니다.

---

## 2. `git tag`

```bash
git tag
```

`git tag`는 현재 로컬 저장소에 있는 태그 목록을 확인하는 명령어입니다.

예를 들어 다음 명령어를 실행하면:

```bash
git tag
```

다음과 같은 결과가 나올 수 있습니다.

```bash
v1.0.0
v1.1.0
v2.0.0
```

이 결과는 현재 로컬 저장소에 `v1.0.0`, `v1.1.0`, `v2.0.0` 태그가 있다는 뜻입니다.

`git tag`는 다음 상황에서 사용합니다.

```text
현재 저장소에 어떤 태그가 있는지 확인할 때
배포 버전 목록을 확인할 때
특정 버전 태그가 이미 있는지 확인할 때
원격에 올리기 전에 로컬 태그를 확인할 때
```

예를 들어 새 태그를 만들기 전에 같은 이름의 태그가 이미 있는지 확인할 수 있습니다.

```bash
git tag
```

만약 `v1.0.0`이 이미 있다면 같은 이름으로 다시 태그를 만들 수 없습니다.

---

## 3. `git tag <tag-name>`

```bash
git tag <tag-name>
```

`git tag <tag-name>`은 현재 커밋에 간단한 태그를 생성하는 명령어입니다.

예를 들어 현재 커밋에 `v1.0.0` 태그를 붙이고 싶다면 다음처럼 입력합니다.

```bash
git tag v1.0.0
```

이 명령어를 실행하면 현재 `HEAD`, 즉 현재 브랜치의 최신 커밋에 `v1.0.0` 태그가 붙습니다.

```text
현재 커밋에 v1.0.0이라는 이름표를 붙인다.
```

태그가 생성되었는지 확인하려면 다음 명령어를 사용합니다.

```bash
git tag
```

출력 예시:

```bash
v1.0.0
```

### 태그 이름은 어떻게 지으면 좋을까?

태그는 보통 버전명을 기준으로 짓습니다.

예를 들어 다음과 같은 형식을 많이 사용합니다.

```bash
v1.0.0
v1.1.0
v2.0.0
```

여기서 `v`는 version을 의미합니다.

그리고 숫자는 보통 다음과 같은 의미로 사용됩니다.

```text
v1.0.0
│ │ │
│ │ └─ patch 버전
│ └─── minor 버전
└───── major 버전
```

예를 들어:

```text
v1.0.0 → 첫 정식 배포
v1.0.1 → 작은 버그 수정
v1.1.0 → 기능 추가
v2.0.0 → 큰 변경 사항 포함
```

물론 Git 태그 이름은 꼭 이 형식을 따라야 하는 것은 아닙니다.

하지만 버전 관리를 위해서는 `v1.0.0` 같은 형식이 읽기 쉽고 관리하기 좋습니다.

---

## 4. `git tag -a <tag-name> -m "message"`

```bash
git tag -a <tag-name> -m "message"
```

`git tag -a <tag-name> -m "message"`는 메시지가 포함된 태그를 생성하는 명령어입니다.

여기서 `-a`는 annotated tag를 만든다는 의미입니다.

`annotated`는 주석이 달린, 설명이 포함된 정도로 이해하면 됩니다.

예를 들어 다음처럼 사용할 수 있습니다.

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
```

이 명령어는 현재 커밋에 `v1.0.0` 태그를 붙이고, `"Release version 1.0.0"`이라는 메시지도 함께 저장합니다.

### 일반 태그와 주석 태그 차이

Git 태그는 크게 두 가지 방식으로 만들 수 있습니다.

```bash
git tag v1.0.0
```

이 방식은 간단한 태그입니다. 보통 lightweight tag라고 부릅니다.

반면 다음 방식은:

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
```

메시지가 포함된 주석 태그입니다. 보통 annotated tag라고 부릅니다.

차이는 다음과 같습니다.

| 명령어                                  | 종류              | 특징                       |
| ------------------------------------ | --------------- | ------------------------ |
| `git tag <tag-name>`                 | lightweight tag | 단순히 특정 커밋을 가리키는 태그       |
| `git tag -a <tag-name> -m "message"` | annotated tag   | 태그 작성자, 날짜, 메시지 같은 정보 포함 |

간단한 개인 작업이나 임시 표시에는 lightweight tag를 사용할 수 있습니다.

하지만 배포 버전처럼 의미 있는 태그라면 annotated tag를 사용하는 것이 더 좋습니다.

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
```

### 특정 커밋에 태그를 붙이고 싶다면?

위에서 설명한 명령어들은 기본적으로 현재 커밋에 태그를 붙입니다.

즉, 현재 `HEAD`에 태그를 생성합니다.

태그를 만들기 전에 현재 위치한 커밋이 맞는지 확인하는 습관이 좋습니다.

```bash
git status -sb
git log --oneline
```

---

## 5. `git push origin <tag-name>`

```bash
git push origin <tag-name>
```

`git push origin <tag-name>`은 로컬에 만든 특정 태그 하나를 원격 저장소에 올리는 명령어입니다.

중요한 점은 태그는 일반 커밋 push와 별도로 원격에 올려야 한다는 것입니다.

예를 들어 로컬에서 다음 태그를 만들었다고 해보겠습니다.

```bash
git tag v1.0.0
```

이 태그는 처음에는 로컬 저장소에만 있습니다.

GitHub 같은 원격 저장소에 태그를 올리려면 다음 명령어를 실행해야 합니다.

```bash
git push origin v1.0.0
```

즉, 다음처럼 이해하면 됩니다.

```text
git tag v1.0.0
→ 로컬에 태그 생성

git push origin v1.0.0
→ 원격 저장소에 태그 업로드
```

---

## 6. `git push origin --tags`

```bash
git push origin --tags
```

`git push origin --tags`는 로컬에 있는 태그들을 원격 저장소에 한 번에 올리는 명령어입니다.

예를 들어 로컬에 다음 태그들이 있다고 해보겠습니다.

```bash
git tag
```

```bash
v1.0.0
v1.1.0
v2.0.0
```

이 태그들을 원격 저장소에 한 번에 올리고 싶다면 다음 명령어를 실행합니다.

```bash
git push origin --tags
```

그러면 로컬에 있는 태그들이 `origin` 원격 저장소로 push됩니다.

### `git push origin <tag-name>`과 `git push origin --tags` 차이

두 명령어는 모두 태그를 원격 저장소에 올릴 때 사용하지만, 범위가 다릅니다.

| 명령어                          | 의미                   |
| ---------------------------- | -------------------- |
| `git push origin <tag-name>` | 특정 태그 하나만 원격에 올림     |
| `git push origin --tags`     | 로컬의 태그들을 원격에 한 번에 올림 |

예를 들어 `v1.0.0` 하나만 올리고 싶다면 다음처럼 사용합니다.

```bash
git push origin v1.0.0
```

반면 로컬에 있는 여러 태그를 한 번에 올리고 싶다면 다음처럼 사용합니다.

```bash
git push origin --tags
```

보통은 필요한 태그만 명확하게 올리는 것이 좋습니다.

배포 태그 하나를 올릴 때는 특정 태그를 지정하는 방식이 더 안전합니다.

```bash
git push origin v1.0.0
```

---

## 7. `git tag -d <tag-name>`

```bash
git tag -d <tag-name>
```

`git tag -d <tag-name>`은 로컬 저장소에 있는 태그를 삭제하는 명령어입니다.

여기서 `-d`는 delete의 의미입니다.

예를 들어 로컬의 `v1.0.0` 태그를 삭제하고 싶다면 다음처럼 입력합니다.

```bash
git tag -d v1.0.0
```

이 명령어는 로컬 저장소에서 `v1.0.0` 태그를 삭제합니다.

삭제 후 태그 목록을 확인합니다.

```bash
git tag
```

목록에서 `v1.0.0`이 사라졌다면 로컬 태그가 삭제된 것입니다.

### `git tag -d` 사용 시 주의점

`git tag -d <tag-name>`은 로컬 태그를 삭제합니다.

즉, 내 컴퓨터의 Git 저장소에서 태그를 지우는 명령어입니다.

이미 원격 저장소에 올라간 태그가 있다면, 로컬에서 `git tag -d`를 실행해도 원격 저장소의 태그까지 같이 삭제되는 것은 아닙니다.

```text
git tag -d <tag-name>
→ 로컬 태그 삭제
→ 원격 태그 삭제는 아님
```

---

## 8. 자주 쓰는 흐름

현재 태그 목록을 확인합니다.

```bash
git tag
```

현재 커밋에 간단한 태그를 만듭니다.

```bash
git tag v1.0.0
```

또는 메시지가 포함된 주석 태그를 만듭니다.

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
```

태그가 생성되었는지 확인합니다.

```bash
git tag
```

특정 태그를 원격 저장소에 올립니다.

```bash
git push origin v1.0.0
```

로컬 태그를 삭제합니다.

```bash
git tag -d v1.0.0
```

여러 태그를 한 번에 원격 저장소에 올리고 싶다면 다음처럼 사용할 수 있습니다.

```bash
git push origin --tags
```

---

## 9. 명령어별 정리

| 명령어                                  | 의미                      |
| ------------------------------------ | ----------------------- |
| `git tag`                            | 로컬 태그 목록 확인             |
| `git tag <tag-name>`                 | 현재 커밋에 간단한 태그 생성        |
| `git tag -a <tag-name> -m "message"` | 메시지가 포함된 주석 태그 생성       |
| `git push origin <tag-name>`         | 특정 태그 하나를 원격 저장소에 올림    |
| `git push origin --tags`             | 로컬 태그들을 원격 저장소에 한 번에 올림 |
| `git tag -d <tag-name>`              | 로컬 태그 삭제                |

```text
git tag
→ 태그 목록을 확인한다.

git tag <tag-name>
→ 현재 커밋에 간단한 태그를 만든다.

git tag -a <tag-name> -m "message"
→ 메시지가 포함된 태그를 만든다.

git push origin <tag-name>
→ 특정 태그를 원격 저장소에 올린다.

git push origin --tags
→ 로컬 태그들을 원격 저장소에 한 번에 올린다.

git tag -d <tag-name>
→ 로컬 태그를 삭제한다.
```

---

## 10. 자주 헷갈리는 상황

### 태그를 만들면 자동으로 원격 저장소에 올라갈까?

아닙니다.

다음 명령어로 태그를 만들면:

```bash
git tag v1.0.0
```

태그는 로컬 저장소에만 생성됩니다.

원격 저장소에 올리려면 별도로 push해야 합니다.

```bash
git push origin v1.0.0
```

### `git push origin --tags`는 항상 써도 될까?

사용할 수는 있지만, 주의하는 것이 좋습니다.

`git push origin --tags`는 로컬에 있는 태그들을 한 번에 원격으로 올립니다.

원하지 않는 태그까지 올라갈 수 있으므로, 보통은 필요한 태그를 직접 지정해서 올리는 방식이 더 명확합니다.

```bash
git push origin v1.0.0
```

### `git tag -d <tag-name>`은 원격 태그도 삭제할까?

아닙니다.

`git tag -d <tag-name>`은 로컬 태그를 삭제합니다.

원격 저장소에 이미 올라간 태그는 이 명령어만으로 삭제되지 않습니다.

---

## 마무리 정리

`git tag`는 특정 커밋에 이름표를 붙이는 명령어입니다.

보통 `v1.0.0`, `v1.1.0`처럼 버전 표시를 할 때 사용합니다.

`git tag`는 태그 목록을 확인하고, `git tag <tag-name>`은 현재 커밋에 간단한 태그를 생성합니다.

`git tag -a <tag-name> -m "message"`는 메시지가 포함된 주석 태그를 생성합니다.

태그를 원격 저장소에 올릴 때는 `git push origin <tag-name>`을 사용하고, 여러 태그를 한 번에 올릴 때는 `git push origin --tags`를 사용할 수 있습니다.

로컬 태그를 삭제하려면 `git tag -d <tag-name>`을 사용합니다.

한 문장으로 정리하면 다음과 같습니다.

> `git tag`는 특정 커밋에 버전 같은 이름표를 붙이는 명령어이며, 태그를 원격 저장소에 공유하려면 `git push origin <tag-name>`으로 별도로 올려야 한다.
