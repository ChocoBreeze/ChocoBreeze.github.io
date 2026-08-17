# 2. git pre-commit 훅 버전 관리

## 현재 구조

- 전역 `core.hooksPath`가 사용자 공통 hook 디렉터리를 가리킨다.
- 전역 `pre-commit` dispatcher는 현재 저장소의 `scripts/hooks/pre-commit`이 있을 때만 실행한다.
- 이 저장소의 프로젝트 hook은 스테이징된 `.md`/`.mdx` 파일이 있으면
  `node scripts/check-content.mjs --staged-file-list=<tmp>`를 실행한다.
- 전역 `commit-msg` v2는 AI provenance trailer block을 검증하며 metadata를 생성하지 않는다.
- 정확한 runtime 값, 신뢰할 수 있는 coarse 값, 확인 불가 시 `unknown`을 허용하고 모호한 placeholder는 거부한다.

## 목표

프로젝트별 검사 로직은 저장소 안에서 버전 관리하되, hook 진입점은 전역 dispatcher 하나로 통일한다.

## 설계 선택

전역 `core.hooksPath` 방식을 사용한다 (심볼릭 링크·복사 스크립트보다 단순하고 Windows에서도 동작).

- 전역 진입점: `%USERPROFILE%/.config/git/hooks/`
- 프로젝트 검사 hook: `scripts/hooks/pre-commit`
- 저장소별 `core.hooksPath` 설정과 npm `prepare` 스크립트는 사용하지 않는다.

## 변경 대상

1. `scripts/hooks/pre-commit` — 프로젝트별 콘텐츠 검사 로직을 유지한다.
2. 전역 dispatcher — 프로젝트 hook의 존재 여부와 종료 코드를 처리한다.
3. `CLAUDE.md` — 전역 dispatcher 사용을 반영한다.

## 구현 단계

1. 전역 `core.hooksPath`를 확인하고 저장소별 override가 없음을 확인한다.
2. 전역 dispatcher가 프로젝트 hook을 호출하는지 확인한다.
3. 프로젝트 hook의 재귀 호출 방지와 종료 코드 전달을 검증한다.
4. 전역 `commit-msg` validator의 정상/실패 trailer cases를 임시 저장소에서 검증한다.

## 검증

1. 전역/저장소별 `core.hooksPath` 우선순위를 확인한다.
2. 일반 commit과 exact/coarse/unknown AI trailer block을 각각 확인한다.
3. `AI-Model` 또는 `AI-Reasoning` 누락, 중복 AI key, placeholder 값이 거부되는지 확인한다.
4. 프로젝트 hook의 부재·성공·실패·재귀 가드를 확인한다.

## 리스크 / 참고

- 전역 `core.hooksPath`가 우선 진입점이다. 프로젝트별 `core.hooksPath` override를 다시 추가하면 전역 정책과 충돌한다.
- Git Bash가 없는 환경에서는 sh 스크립트 훅이 실패할 수 있으나, 이 저장소는 Windows + Git Bash 환경이 확인되어 있어 문제 없다.
