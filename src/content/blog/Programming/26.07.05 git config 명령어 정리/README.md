---
title: "Git 설정 확인/변경하기: git config 정리"
slug: "git-config-command-guide"
description: "git config --list, git config user.name/email, git config --global로 Git 사용자 설정을 확인하고 변경하는 방법을 정리합니다."
pubDate: "2026-07-05T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

`git config`는 Git의 설정을 확인하거나 변경할 때 사용하는 명령어입니다.

Git을 처음 설치한 뒤에는 보통 사용자 이름과 이메일을 설정해야 합니다.

이 정보는 커밋을 만들 때 작성자 정보로 기록됩니다.

예를 들어 커밋 로그를 보면 다음과 같이 작성자 정보가 표시됩니다.

```text
Author: username <user@example.com>
```

여기서 `username`과 `user@example.com`은 Git 설정에 등록된 사용자 이름과 이메일입니다.

이번 글에서는 다음 명령어를 정리합니다.

```bash
git config --list
git config user.name
git config user.email
git config --global user.name "name"
git config --global user.email "email"
```

---

## 1. `git config`란?

`git config`는 Git 설정을 관리하는 명령어입니다.

Git에는 여러 가지 설정이 있습니다.

예를 들어 다음과 같은 설정이 있습니다.

```text
사용자 이름
사용자 이메일
기본 브랜치 이름
에디터 설정
alias 설정
줄바꿈 설정
```

그중에서 가장 기본적으로 설정하는 항목이 `user.name`과 `user.email`입니다.

```text
user.name
→ 커밋 작성자 이름

user.email
→ 커밋 작성자 이메일
```

이 두 설정은 커밋을 만들 때 작성자 정보로 들어갑니다.

따라서 Git을 처음 사용할 때는 보통 다음 설정을 먼저 확인하거나 등록합니다.

```bash
git config user.name
git config user.email
```

---

## 2. `git config --list`

```bash
git config --list
```

`git config --list`는 현재 적용되는 Git 설정 목록을 확인하는 명령어입니다.

예를 들어 다음 명령어를 실행하면:

```bash
git config --list
```

다음과 같은 설정들이 출력될 수 있습니다.

```text
user.name=honggildong
user.email=hong@example.com
core.editor=code --wait
init.defaultbranch=main
alias.st=status -sb
```

이 결과는 현재 Git에 적용되는 설정 목록입니다.

여기서 `user.name`은 커밋 작성자 이름이고, `user.email`은 커밋 작성자 이메일입니다.

`git config --list`는 다음 상황에서 사용할 수 있습니다.

```text
현재 Git 설정이 어떻게 되어 있는지 확인할 때
사용자 이름과 이메일이 등록되어 있는지 확인할 때
alias 설정을 확인할 때
Git 설정이 예상대로 적용되는지 확인할 때
```

예를 들어 Git 사용자 정보가 제대로 설정되어 있는지 확인하고 싶다면 다음처럼 사용할 수 있습니다.

```bash
git config --list
```

출력 결과에서 다음 항목을 찾으면 됩니다.

```text
user.name=...
user.email=...
```

---

## 3. `git config user.name`

```bash
git config user.name
```

`git config user.name`은 현재 저장소에서 적용되는 Git 사용자 이름을 확인하는 명령어입니다.

예를 들어 다음 명령어를 실행하면:

```bash
git config user.name
```

다음처럼 사용자 이름이 출력될 수 있습니다.

```text
honggildong
```

이 값은 커밋을 만들 때 작성자 이름으로 사용됩니다.

예를 들어 커밋 로그에서 다음처럼 표시될 수 있습니다.

```text
Author: honggildong <hong@example.com>
```

여기서 `honggildong`이 `user.name`입니다.

`git config user.name`은 다음 상황에서 사용합니다.

```text
현재 커밋 작성자 이름이 무엇으로 설정되어 있는지 확인할 때
회사 프로젝트와 개인 프로젝트의 Git 이름 설정을 확인할 때
커밋 작성자 정보가 잘못 들어가기 전에 미리 확인할 때
```

특히 여러 계정을 사용하는 경우에는 커밋 전에 확인하는 습관이 좋습니다.

```bash
git config user.name
```

---

## 4. `git config user.email`

```bash
git config user.email
```

`git config user.email`은 현재 저장소에서 적용되는 Git 사용자 이메일을 확인하는 명령어입니다.

예를 들어 다음 명령어를 실행하면:

```bash
git config user.email
```

다음처럼 이메일이 출력될 수 있습니다.

```text
hong@example.com
```

이 값은 커밋을 만들 때 작성자 이메일로 사용됩니다.

커밋 로그에서는 보통 다음처럼 표시됩니다.

```text
Author: honggildong <hong@example.com>
```

여기서 `hong@example.com`이 `user.email`입니다.

`git config user.email`은 다음 상황에서 사용합니다.

```text
현재 커밋 작성자 이메일을 확인할 때
GitHub 계정 이메일과 맞게 설정되어 있는지 확인할 때
회사 프로젝트에서 회사 이메일이 설정되어 있는지 확인할 때
개인 프로젝트에서 개인 이메일이 설정되어 있는지 확인할 때
```

예를 들어 회사 저장소에서 작업 중이라면 다음 명령어로 이메일을 확인할 수 있습니다.

```bash
git config user.email
```

회사 이메일이 아니라 개인 이메일이 나오면, 현재 저장소 설정을 따로 변경해야 할 수 있습니다.

---

## 5. `git config --global user.name "name"`

```bash
git config --global user.name "name"
```

`git config --global user.name "name"`은 Git 전역 사용자 이름을 설정하는 명령어입니다.

여기서 `--global`은 현재 PC의 Git 전체 기본 설정에 적용한다는 의미입니다.

예를 들어 사용자 이름을 `honggildong`으로 설정하려면 다음처럼 입력합니다.

```bash
git config --global user.name "honggildong"
```

이렇게 설정하면 앞으로 이 PC에서 사용하는 Git 저장소들은 기본적으로 `honggildong`이라는 사용자 이름을 사용합니다.

### `--global`은 무엇을 의미할까?

Git 설정에는 적용 범위가 있습니다.

대표적으로 `global` 설정과 `local` 설정이 있습니다.

```text
global 설정
→ 현재 PC의 사용자 계정 전체에 적용되는 기본 설정

local 설정
→ 현재 Git 저장소에만 적용되는 설정
```

`--global`을 붙이면 전역 설정을 변경합니다.

```bash
git config --global user.name "honggildong"
```

반대로 `--global` 없이 현재 저장소 안에서 설정하면 해당 저장소에만 적용됩니다.

```bash
git config user.name "company-name"
```

즉, `--global`은 기본값을 정하는 느낌이고, local 설정은 특정 저장소에서만 따로 덮어쓰는 느낌입니다.

---

## 6. `git config --global user.email "email"`

```bash
git config --global user.email "email"
```

`git config --global user.email "email"`은 Git 전역 사용자 이메일을 설정하는 명령어입니다.

예를 들어 이메일을 `hong@example.com`으로 설정하려면 다음처럼 입력합니다.

```bash
git config --global user.email "hong@example.com"
```

이렇게 설정하면 앞으로 이 PC에서 사용하는 Git 저장소들은 기본적으로 `hong@example.com`을 커밋 작성자 이메일로 사용합니다.

설정 후에는 다음 명령어로 확인할 수 있습니다.

```bash
git config user.email
```

또는 전체 설정에서 확인할 수도 있습니다.

```bash
git config --list
```

### 사용자 이름과 이메일을 함께 설정하기

Git을 처음 설치한 뒤에는 보통 사용자 이름과 이메일을 함께 설정합니다.

```bash
git config --global user.name "honggildong"
git config --global user.email "hong@example.com"
```

설정 후 확인합니다.

```bash
git config user.name
git config user.email
```

출력 예시:

```text
honggildong
hong@example.com
```

이렇게 설정해두면 이후 커밋을 만들 때 해당 정보가 작성자 정보로 기록됩니다.

---

## 7. local 설정과 global 설정 차이

Git 설정은 적용 범위에 따라 다르게 동작할 수 있습니다.

| 설정 범위  | 명령어 예시                                   | 적용 대상            |
| ------ | ---------------------------------------- | ---------------- |
| global | `git config --global user.email "email"` | 현재 PC의 사용자 계정 전체 |
| local  | `git config user.email "email"`          | 현재 Git 저장소       |

예를 들어 전역 이메일을 개인 이메일로 설정했다고 해보겠습니다.

```bash
git config --global user.email "personal@example.com"
```

이 상태에서 대부분의 개인 프로젝트는 이 이메일을 사용합니다.

그런데 회사 프로젝트에서는 회사 이메일을 사용해야 한다면, 해당 저장소 폴더에서만 다음처럼 설정할 수 있습니다.

```bash
git config user.email "company@example.com"
```

그러면 이 저장소에서는 회사 이메일이 우선 적용됩니다.

```bash
git config user.email
```

출력:

```text
company@example.com
```

즉, local 설정은 global 설정보다 우선 적용됩니다.

### 설정이 어디에 저장될까?

`--global`로 설정한 값은 현재 사용자 계정의 Git 전역 설정 파일에 저장됩니다.

반면 `--global` 없이 저장소 안에서 설정한 값은 해당 저장소의 `.git/config` 파일에 저장됩니다.

```text
global 설정
→ 사용자 전체 Git 설정

local 설정
→ 현재 저장소의 .git/config 설정
```

그래서 같은 PC에서도 저장소마다 다른 이름이나 이메일을 사용할 수 있습니다.

예를 들어 개인 프로젝트와 회사 프로젝트를 구분할 수 있습니다.

```text
개인 프로젝트
→ personal@example.com

회사 프로젝트
→ company@example.com
```

---

## 8. 자주 쓰는 흐름

현재 Git 설정 전체를 확인할 때:

```bash
git config --list
```

현재 적용되는 사용자 이름과 이메일을 확인할 때:

```bash
git config user.name
git config user.email
```

Git 전역 사용자 이름과 이메일을 설정할 때:

```bash
git config --global user.name "honggildong"
git config --global user.email "hong@example.com"
```

회사 프로젝트에서만 이메일을 다르게 설정하고 싶을 때:

```bash
git config user.email "company@example.com"
```

설정 후 확인할 때:

```bash
git config user.name
git config user.email
```

---

## 9. 명령어별 정리

| 명령어                                      | 의미                   |
| ---------------------------------------- | -------------------- |
| `git config --list`                      | 현재 적용되는 Git 설정 목록 확인 |
| `git config user.name`                   | 현재 적용되는 사용자 이름 확인    |
| `git config user.email`                  | 현재 적용되는 사용자 이메일 확인   |
| `git config --global user.name "name"`   | 전역 사용자 이름 설정         |
| `git config --global user.email "email"` | 전역 사용자 이메일 설정        |

```text
git config --list
→ 현재 Git 설정 목록을 확인한다.

git config user.name
→ 현재 적용되는 Git 사용자 이름을 확인한다.

git config user.email
→ 현재 적용되는 Git 사용자 이메일을 확인한다.

git config --global user.name "name"
→ 현재 PC 전체에서 사용할 기본 Git 사용자 이름을 설정한다.

git config --global user.email "email"
→ 현재 PC 전체에서 사용할 기본 Git 사용자 이메일을 설정한다.
```

---

## 10. 자주 헷갈리는 상황

### `git config user.name`과 `git config --global user.name`은 뭐가 다를까?

`git config user.name`은 현재 적용되는 사용자 이름을 확인하는 명령어입니다.

```bash
git config user.name
```

반면 `git config --global user.name "name"`은 전역 사용자 이름을 설정하는 명령어입니다.

```bash
git config --global user.name "honggildong"
```

즉, 앞의 명령어는 확인이고, 뒤의 명령어는 설정입니다.

### `--global`을 붙이면 모든 저장소가 바뀔까?

기본적으로는 현재 PC의 사용자 계정 전체 Git 기본 설정이 바뀝니다.

다만 특정 저장소에 local 설정이 따로 있으면, 그 저장소에서는 local 설정이 우선 적용됩니다.

예를 들어 전역 설정이 다음과 같아도:

```bash
git config --global user.email "personal@example.com"
```

현재 저장소에 다음 설정이 있으면:

```bash
git config user.email "company@example.com"
```

이 저장소에서는 `company@example.com`이 적용됩니다.

### 커밋한 뒤에 user.name이나 user.email을 바꾸면 기존 커밋도 바뀔까?

아닙니다.

`git config`로 사용자 이름이나 이메일을 바꿔도 이미 만들어진 커밋의 작성자 정보가 자동으로 바뀌지는 않습니다.

이 설정은 앞으로 새로 만드는 커밋에 적용됩니다.

```text
기존 커밋 작성자 정보
→ 자동 변경 X

새로 만드는 커밋 작성자 정보
→ 변경된 설정 적용
```

그래서 커밋하기 전에 현재 설정을 확인하는 것이 좋습니다.

```bash
git config user.name
git config user.email
```

### 이메일을 잘못 설정하면 문제가 될까?

커밋 자체는 가능하지만, GitHub 같은 서비스에서 계정과 커밋이 제대로 연결되지 않을 수 있습니다.

예를 들어 GitHub에 등록되지 않은 이메일로 커밋하면, GitHub 화면에서 내 계정의 커밋으로 연결되지 않을 수 있습니다.

따라서 GitHub에서 사용하는 이메일과 Git 설정의 `user.email`이 맞는지 확인하는 것이 좋습니다.

```bash
git config user.email
```

---

## 마무리 정리

`git config`는 Git 설정을 확인하거나 변경할 때 사용하는 명령어입니다.

`git config --list`는 현재 적용되는 Git 설정 목록을 보여줍니다.

`git config user.name`과 `git config user.email`은 현재 적용되는 사용자 이름과 이메일을 확인합니다.

`git config --global user.name "name"`과 `git config --global user.email "email"`은 현재 PC 전체에서 사용할 기본 Git 사용자 정보를 설정합니다.

다만 특정 저장소에서만 다른 사용자 정보를 사용하고 싶다면 `--global` 없이 해당 저장소 안에서 따로 설정할 수 있습니다.

한 문장으로 정리하면 다음과 같습니다.

> `git config`는 Git 설정을 확인하고 변경하는 명령어이며, `user.name`과 `user.email`은 커밋 작성자 정보로 사용된다.
