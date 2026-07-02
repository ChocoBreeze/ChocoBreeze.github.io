---
title: "git remote 명령어 정리"
slug: "git-remote-command-guide"
description: "git remote, git remote -v, git remote add/set-url/remove로 원격 저장소를 확인하고 관리하는 방법을 정리합니다."
pubDate: "2026-07-03T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

`git remote`는 Git에서 **원격 저장소 정보를 확인하거나 관리할 때 사용하는 명령어**입니다.

Git 프로젝트는 보통 내 컴퓨터에 있는 **로컬 저장소**와 GitHub, GitLab 같은 서버에 있는 **원격 저장소**를 함께 사용합니다.

```text
로컬 저장소 → 내 컴퓨터에 있는 Git 저장소
원격 저장소 → GitHub, GitLab 등에 있는 Git 저장소
```

예를 들어 내 컴퓨터에서 작업한 커밋을 GitHub에 올릴 때는 원격 저장소가 필요합니다.

이때 로컬 저장소가 어떤 원격 저장소와 연결되어 있는지 확인하거나, 새 원격 저장소를 연결하거나, 기존 원격 저장소 주소를 수정할 때 `git remote` 명령어를 사용합니다.

이번 글에서는 다음 명령어를 정리합니다.

```bash
git remote
git remote -v
git remote add origin <url>
git remote set-url origin <url>
git remote remove origin
```

---

## 1. 원격 저장소란?

원격 저장소는 GitHub, GitLab, Bitbucket 같은 외부 서버에 있는 저장소입니다.

내 컴퓨터에 있는 Git 저장소는 로컬 저장소이고, GitHub에 있는 저장소는 원격 저장소라고 볼 수 있습니다.

예를 들어 다음과 같은 구조입니다.

```text
내 컴퓨터의 프로젝트 폴더
→ 로컬 저장소

GitHub의 repository
→ 원격 저장소
```

로컬 저장소에서 커밋을 만든 뒤 원격 저장소에 올릴 때는 보통 다음 명령어를 사용합니다.

```bash
git push
```

반대로 원격 저장소의 변경 사항을 로컬로 가져올 때는 다음 명령어를 사용합니다.

```bash
git pull
```

또는 원격 정보를 가져오기만 할 때는 다음 명령어를 사용합니다.

```bash
git fetch
```

이런 명령어들이 제대로 동작하려면 로컬 저장소가 원격 저장소와 연결되어 있어야 합니다.

그 연결 정보를 관리하는 명령어가 `git remote`입니다.

---

## 2. `git remote`

```bash
git remote
```

`git remote`는 현재 로컬 저장소에 등록된 원격 저장소 이름을 보여줍니다.

예를 들어 다음 명령어를 실행하면:

```bash
git remote
```

다음과 같은 결과가 나올 수 있습니다.

```bash
origin
```

여기서 `origin`은 원격 저장소의 이름입니다.

즉, 이 로컬 저장소에는 `origin`이라는 이름의 원격 저장소가 등록되어 있다는 뜻입니다.

### `origin`이란?

`origin`은 Git에서 원격 저장소에 붙는 기본 이름입니다.

예를 들어 GitHub 저장소를 clone하면 보통 원격 저장소 이름이 자동으로 `origin`으로 설정됩니다.

```bash
git clone <repository-url>
```

이렇게 clone한 프로젝트에서 다음 명령어를 실행하면:

```bash
git remote
```

보통 다음처럼 출력됩니다.

```bash
origin
```

여기서 `origin`은 특별한 서버 이름이라기보다는, 원격 저장소 주소에 붙인 별칭입니다.

```text
origin = 원격 저장소 주소에 붙인 기본 별칭
```

그래서 다음 명령어는:

```bash
git push origin main
```

`origin`이라는 원격 저장소의 `main` 브랜치로 push한다는 의미입니다.

---

## 3. `git remote -v`

```bash
git remote -v
```

`git remote -v`는 등록된 원격 저장소 이름과 주소를 함께 보여줍니다.

여기서 `-v`는 verbose의 의미입니다. `verbose`는 자세히 보여준다는 뜻입니다.

예를 들어 다음 명령어를 실행하면:

```bash
git remote -v
```

다음과 같은 결과가 나올 수 있습니다.

```bash
origin  https://github.com/user/project.git (fetch)
origin  https://github.com/user/project.git (push)
```

이 결과는 `origin`이라는 원격 저장소가 다음 주소와 연결되어 있다는 뜻입니다.

```text
https://github.com/user/project.git
```

그리고 `(fetch)`, `(push)`가 각각 표시됩니다.

```text
fetch → 원격 저장소에서 가져올 때 사용하는 주소
push  → 원격 저장소로 올릴 때 사용하는 주소
```

보통은 fetch 주소와 push 주소가 같습니다.

### `git remote`와 `git remote -v` 차이

| 명령어 | 보여주는 내용 |
| --- | --- |
| `git remote` | 원격 저장소 이름만 표시 |
| `git remote -v` | 원격 저장소 이름과 URL까지 표시 |

원격 저장소가 등록되어 있는지만 확인하려면 `git remote`를 사용하고, 어떤 URL에 연결되어 있는지까지 확인하려면 `git remote -v`를 사용합니다.

실제로는 `git remote -v`를 더 자주 사용합니다.

---

## 4. `git remote add origin <url>`

```bash
git remote add origin <url>
```

`git remote add origin <url>`은 현재 로컬 저장소에 원격 저장소를 추가하는 명령어입니다.

예를 들어 로컬에서 먼저 프로젝트를 만들고, 나중에 GitHub 저장소를 연결해야 할 때 사용할 수 있습니다.

```bash
git remote add origin https://github.com/user/project.git
```

이 명령어의 의미는 다음과 같습니다.

```text
origin이라는 이름으로 https://github.com/user/project.git 원격 저장소를 등록한다.
```

즉, 로컬 저장소와 GitHub 저장소를 연결하는 작업입니다.

`git remote add origin <url>`은 보통 다음 상황에서 사용합니다.

```text
로컬에서 먼저 git init으로 저장소를 만든 경우
GitHub에 빈 repository를 새로 만든 경우
기존 로컬 프로젝트를 GitHub와 연결하려는 경우
```

예를 들어 다음과 같은 흐름입니다.

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/user/project.git
git push -u origin main
```

### 이미 origin이 있다면?

이미 `origin`이 등록되어 있는데 다시 추가하려고 하면 에러가 납니다.

```text
error: remote origin already exists.
```

이 경우 먼저 현재 원격 저장소를 확인합니다.

```bash
git remote -v
```

기존 원격 저장소 주소를 바꾸고 싶다면 `add`가 아니라 `set-url`을 사용해야 합니다.

```bash
git remote set-url origin <new-url>
```

---

## 5. `git remote set-url origin <url>`

```bash
git remote set-url origin <url>
```

`git remote set-url origin <url>`은 기존에 등록된 원격 저장소의 URL을 변경하는 명령어입니다.

예를 들어 기존 원격 저장소 주소가 잘못되어 있거나, HTTPS 주소에서 SSH 주소로 바꾸고 싶을 때 사용할 수 있습니다.

```bash
git remote set-url origin https://github.com/user/new-project.git
```

변경 후에는 다음 명령어로 확인할 수 있습니다.

```bash
git remote -v
```

`git remote set-url origin <url>`은 다음 상황에서 자주 사용합니다.

```text
원격 저장소 URL을 잘못 등록했을 때
GitHub repository 이름이 바뀌었을 때
원격 저장소를 다른 repository로 바꾸고 싶을 때
HTTPS 주소를 SSH 주소로 변경하고 싶을 때
회사 GitLab 주소가 변경되었을 때
```

예를 들어 HTTPS 주소로 등록된 원격 저장소를 SSH 주소로 바꾸고 싶다면 다음처럼 사용할 수 있습니다.

```bash
git remote set-url origin git@github.com:user/project.git
```

---

## 6. `git remote remove origin`

```bash
git remote remove origin
```

`git remote remove origin`은 등록된 원격 저장소 정보를 삭제하는 명령어입니다.

이 명령어는 원격 저장소 자체를 삭제하는 것이 아닙니다.

즉, GitHub에 있는 repository가 삭제되는 것이 아니라, 내 로컬 저장소에서 `origin` 연결 정보만 제거됩니다.

```text
git remote remove origin
→ 로컬 저장소의 원격 연결 정보 삭제

GitHub repository 삭제
→ 아님
```

이 명령어는 다음 상황에서 사용할 수 있습니다.

```text
잘못 연결한 원격 저장소를 제거하고 싶을 때
기존 origin을 삭제하고 새 원격 저장소를 등록하고 싶을 때
더 이상 원격 저장소와 연결하지 않을 때
프로젝트를 복사한 뒤 기존 원격 연결을 끊고 싶을 때
```

예를 들어 기존 `origin`을 제거한 뒤 새 원격 저장소를 등록하려면 다음처럼 할 수 있습니다.

```bash
git remote remove origin
git remote add origin https://github.com/user/new-project.git
```

단순히 주소만 바꾸려는 목적이라면 `set-url`을 사용하는 것이 더 간단합니다.

```bash
git remote set-url origin https://github.com/user/new-project.git
```

### `remove`와 `set-url` 중 무엇을 쓰면 좋을까?

| 상황 | 추천 명령어 |
| --- | --- |
| 원격 저장소 URL만 변경 | `git remote set-url origin <url>` |
| 원격 연결을 삭제 | `git remote remove origin` |
| 삭제 후 새로 등록 | `git remote remove origin` → `git remote add origin <url>` |

대부분의 경우 단순 주소 변경이라면 `set-url`이 더 깔끔합니다.

---

## 7. 자주 쓰는 흐름

현재 원격 저장소 연결을 확인합니다.

```bash
git remote -v
```

원격 저장소가 없다면 새로 추가합니다.

```bash
git remote add origin <url>
```

추가 후 다시 확인합니다.

```bash
git remote -v
```

원격 저장소 주소가 잘못되었다면 수정합니다.

```bash
git remote set-url origin <url>
```

원격 연결을 제거하고 싶다면 삭제합니다.

```bash
git remote remove origin
```

---

## 8. 명령어별 정리

| 명령어 | 의미 |
| --- | --- |
| `git remote` | 등록된 원격 저장소 이름 확인 |
| `git remote -v` | 원격 저장소 이름과 URL 확인 |
| `git remote add origin <url>` | `origin`이라는 이름으로 원격 저장소 추가 |
| `git remote set-url origin <url>` | `origin` 원격 저장소의 URL 변경 |
| `git remote remove origin` | `origin` 원격 저장소 연결 제거 |

```text
git remote
→ 원격 저장소 이름 확인

git remote -v
→ 원격 저장소 이름과 주소 확인

git remote add origin <url>
→ 원격 저장소 새로 연결

git remote set-url origin <url>
→ 원격 저장소 주소 변경

git remote remove origin
→ 원격 저장소 연결 제거
```

---

## 9. 자주 헷갈리는 상황

### `origin`은 꼭 GitHub를 의미하는가?

아닙니다.

`origin`은 원격 저장소의 기본 이름일 뿐입니다.

원격 저장소가 GitHub일 수도 있고, GitLab일 수도 있고, 회사 내부 Git 서버일 수도 있습니다.

```text
origin = 원격 저장소에 붙인 이름
```

다만 GitHub에서 clone한 프로젝트는 보통 자동으로 원격 이름이 `origin`으로 설정되기 때문에, `origin`이 GitHub처럼 느껴질 수 있습니다.

### `git remote remove origin`을 하면 GitHub repository가 삭제되는가?

아닙니다.

`git remote remove origin`은 내 로컬 저장소에 저장된 원격 연결 정보만 삭제합니다.

GitHub에 있는 repository 자체는 삭제되지 않습니다.

```text
로컬에서 origin 연결만 끊는다.
원격 서버의 repository는 그대로 남아 있다.
```

### `remote origin already exists` 에러가 나오는 경우

이미 `origin`이라는 원격 저장소가 등록되어 있다는 뜻입니다.

먼저 확인합니다.

```bash
git remote -v
```

주소만 바꾸면 된다면 다음 명령어를 사용합니다.

```bash
git remote set-url origin <url>
```

기존 연결을 삭제하고 다시 추가하고 싶다면 다음처럼 할 수 있습니다.

```bash
git remote remove origin
git remote add origin <url>
```

---

## 마무리 정리

`git remote`는 로컬 저장소와 원격 저장소의 연결 정보를 확인하고 관리하는 명령어입니다.

`git remote`는 원격 저장소 이름만 보여주고, `git remote -v`는 원격 저장소 이름과 URL까지 보여줍니다.

새 원격 저장소를 연결할 때는 `git remote add origin <url>`을 사용합니다.

기존 원격 저장소 주소를 바꿀 때는 `git remote set-url origin <url>`을 사용합니다.

원격 저장소 연결을 제거할 때는 `git remote remove origin`을 사용합니다.

한 문장으로 정리하면 다음과 같습니다.

> `git remote`는 로컬 저장소가 어떤 원격 저장소와 연결되어 있는지 확인하고 관리하는 명령어이며, 원격 저장소를 추가할 때는 `add`, 주소를 변경할 때는 `set-url`, 연결을 제거할 때는 `remove`를 사용한다.
