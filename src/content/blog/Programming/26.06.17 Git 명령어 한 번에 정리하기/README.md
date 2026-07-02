---
title: "알아두면 좋은 Git 명령어 한 번에 정리하기"
slug: "git-commands-guide"
description: "자주 사용하는 Git 명령어를 상태 확인, 변경 내용 확인, 스테이징, 커밋, 브랜치, 원격 저장소, 되돌리기 등으로 나누어 정리합니다."
pubDate: "2026-06-17T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "CLI", "Version Control", "Developer Tools"]
---

Git은 명령어가 많아서 처음에는 어디서부터 익혀야 할지 헷갈리기 쉽다.

하지만 실제로 자주 쓰는 명령어는 어느 정도 정해져 있다. 먼저 상태를 확인하고, 변경 내용을 보고, 필요한 파일을 스테이징한 뒤 커밋한다. 이후 브랜치를 나누거나 원격 저장소와 동기화하면서 작업을 이어간다.

이 글은 Git 명령어를 기능별로 모아둔 목차 글이다. 각 명령어를 빠르게 훑고, 자세히 정리한 글이 있는 경우에는 링크로 연결해두었다.

## 1. 상태 확인

작업을 시작하기 전이나 커밋하기 전에는 현재 저장소 상태를 먼저 확인하는 습관이 좋다.

- [`git status`, `git status -sb` 정리](/blog/git-status-command-guide)
- [`git branch`, `git branch -a`, `git branch -vv` 정리](/blog/git-branch-command-guide)
- [`git log`, `git log --oneline`, `git log --oneline --graph --all` 정리](/blog/git-log-command-guide)

```bash
git status
git status -sb
git branch
git branch -a
git branch -vv
git log
git log --oneline
git log --oneline --graph --all
```

## 2. 변경 내용 확인

파일을 수정한 뒤에는 어떤 내용이 바뀌었는지 확인해야 한다.

- [`git diff`, `git diff --staged`, `git diff --cached`, `git diff HEAD` 정리](/blog/git-diff-command-guide)
- [`git show`, `git show <commit-hash>` 정리](/blog/git-show-command-guide)

```bash
git diff
git diff --staged
git diff --cached
git diff HEAD
git show
git show <commit-hash>
```

## 3. 스테이징

커밋에 포함할 파일을 고르는 단계다.

- [`git add <file>`, `git add .`, `git add -A` 정리](/blog/git-add-command-guide)

```bash
git add <file>
git add .
git add -A
git restore --staged <file>
git reset <file>
```

## 4. 커밋

스테이징된 변경 사항을 하나의 기록으로 저장한다.

```bash
git commit
git commit -m "message"
git commit --amend
```

## 5. 브랜치 생성/이동/삭제

브랜치는 작업 흐름을 나누는 데 사용한다.

```bash
git switch <branch>
git switch -c <new-branch>
git checkout <branch>
git checkout -b <new-branch>
git branch <new-branch>
git branch -d <branch>
git branch -D <branch>
```

## 6. 원격 저장소 확인/연결

로컬 저장소와 GitHub 같은 원격 저장소의 연결 상태를 확인하거나 바꿀 때 사용한다.

```bash
git remote
git remote -v
git remote add origin <url>
git remote set-url origin <url>
git remote remove origin
```

## 7. 원격 저장소 동기화

원격 저장소의 변경 사항을 가져오거나, 로컬 커밋을 원격 저장소로 올릴 때 사용한다.

```bash
git fetch
git fetch origin
git fetch --prune
git pull
git pull origin <branch>
git push
git push origin <branch>
git push -u origin <branch>
```

## 8. 병합 / 리베이스

다른 브랜치의 변경 사항을 현재 브랜치에 합칠 때 사용한다.

```bash
git merge <branch>
git rebase <branch>
git rebase origin/main
git merge --abort
git rebase --abort
git rebase --continue
```

## 9. 작업 내용 되돌리기

수정한 파일을 되돌리거나, 커밋 단위로 작업 상태를 되돌릴 때 사용한다.

```bash
git restore <file>
git restore .
git restore --source=<commit-hash> <file>
git reset HEAD~1
git reset --soft HEAD~1
git reset --mixed HEAD~1
git reset --hard HEAD~1
git revert <commit-hash>
```

`git reset --hard`는 작업 디렉토리의 변경 내용까지 되돌릴 수 있으므로 실행 전에 반드시 현재 상태를 확인해야 한다.

## 10. 임시 저장

아직 커밋하기 애매한 작업 내용을 잠시 치워둘 때 사용한다.

```bash
git stash
git stash list
git stash pop
git stash apply
git stash drop
git stash clear
```

## 11. 태그

릴리스 버전이나 특정 시점을 표시할 때 사용한다.

```bash
git tag
git tag <tag-name>
git tag -a <tag-name> -m "message"
git push origin <tag-name>
git push origin --tags
git tag -d <tag-name>
```

## 12. 원격 브랜치 정리

원격에서 삭제된 브랜치 정보를 로컬에서도 정리하거나, 원격 브랜치를 삭제할 때 사용한다.

```bash
git remote prune origin
git fetch --prune
git branch -r
git push origin --delete <branch>
```

## 13. 파일 추적 / 삭제

Git이 추적하는 파일을 삭제하거나 이름을 바꿀 때 사용한다.

```bash
git rm <file>
git rm --cached <file>
git mv <old-name> <new-name>
git clean -n
git clean -fd
```

`git clean -fd`는 Git이 추적하지 않는 파일과 폴더를 삭제할 수 있으므로, 먼저 `git clean -n`으로 삭제 대상을 확인하는 편이 안전하다.

## 14. 설정 확인 / 변경

Git 사용자 정보나 설정값을 확인하고 변경할 때 사용한다.

```bash
git config --list
git config user.name
git config user.email
git config --global user.name "name"
git config --global user.email "email"
```

## 15. 문제 해결용

커밋 기록을 복구하거나, 특정 변경의 원인을 찾거나, 문제가 생긴 커밋을 추적할 때 사용한다.

```bash
git reflog
git cherry-pick <commit-hash>
git blame <file>
git bisect
git fsck
```

## 추천 학습 순서

처음부터 모든 명령어를 외울 필요는 없다. 자주 쓰는 흐름부터 익히는 편이 좋다.

```text
1. git status
2. git diff
3. git add
4. git commit
5. git branch / git switch
6. git fetch / git pull / git push
7. git log
8. git restore / git reset / git revert
9. git stash
10. git reflog
```

Git은 명령어 하나하나를 따로 외우기보다, 작업 흐름 안에서 익히는 것이 더 오래 남는다.

가장 기본적인 흐름은 다음과 같다.

```bash
git status
git diff
git add .
git status
git commit -m "message"
git push
```

이 흐름에 익숙해진 뒤 브랜치, 원격 저장소, 되돌리기, 임시 저장 명령어를 하나씩 추가해가면 된다.
