# 2. git pre-commit 훅 버전 관리

## 배경

- 현재 pre-commit 훅은 `.git/hooks/pre-commit`에 직접 설치되어 있다.
  - 스테이징된 `.md`/`.mdx` 파일이 있으면 `node scripts/check-content.mjs --staged-file-list=<tmp>`를 실행한다.
- `.git/hooks/`는 git이 추적하지 않으므로 **clone하거나 다른 기기에서 작업하면 훅이 사라진다.**

## 목표

훅 스크립트를 저장소 안에서 버전 관리하고, 별도 수동 설치 없이 활성화되도록 한다.

## 설계 선택

`core.hooksPath` 방식을 사용한다 (심볼릭 링크·복사 스크립트보다 단순하고 Windows에서도 동작).

- 훅 파일 위치: `scripts/hooks/pre-commit` (현재 `.git/hooks/pre-commit` 내용 그대로 이동)
- 활성화: `git config core.hooksPath scripts/hooks`
- 자동화: `package.json`에 `"prepare": "git config core.hooksPath scripts/hooks"` 스크립트 추가
  - `npm install` 시 자동 실행되므로 clone 후 별도 절차가 없다.
  - CI(`npm ci`)에서도 실행되지만 무해하다 (git config만 설정).

## 변경 대상

1. **신규** `scripts/hooks/pre-commit` — 기존 `.git/hooks/pre-commit` 내용 복사. shebang(`#!/bin/sh`) 유지.
2. `package.json` — `scripts`에 `"prepare"` 추가.
3. `AGENTS.md` 또는 `CLAUDE.md` — 훅 위치가 `scripts/hooks/`로 바뀌었음을 반영.

## 구현 단계

1. `scripts/hooks/` 폴더 생성, `.git/hooks/pre-commit` 내용을 `scripts/hooks/pre-commit`으로 복사.
2. 실행 권한 부여: `git update-index --chmod=+x scripts/hooks/pre-commit` (Windows에서는 git index 플래그로 처리해야 함).
3. `package.json`에 `prepare` 스크립트 추가.
4. `git config core.hooksPath scripts/hooks` 실행으로 즉시 전환.
5. 기존 `.git/hooks/pre-commit`은 남아 있어도 무시되지만, 혼동 방지를 위해 삭제.
6. 문서(CLAUDE.md의 pre-commit 언급) 업데이트.

## 검증

1. `git config core.hooksPath` 출력이 `scripts/hooks`인지 확인.
2. markdown 파일을 일부러 깨뜨려 스테이징 → `git commit` 이 훅에서 실패하는지 확인 → 원복.
3. 정상 markdown 커밋이 통과하는지 확인.

## 리스크 / 참고

- `core.hooksPath` 설정 시 `.git/hooks/`의 다른 훅(현재 없음)은 모두 무시된다. 향후 훅 추가는 `scripts/hooks/`에만 한다.
- Git Bash가 없는 환경에서는 sh 스크립트 훅이 실패할 수 있으나, 이 저장소는 Windows + Git Bash 환경이 확인되어 있어 문제 없다.
