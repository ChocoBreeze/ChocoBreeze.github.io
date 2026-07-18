# 10. 문서 간 카테고리 목록 동기화

## 배경

카테고리 목록이 여러 문서에 중복 나열되어 있고 서로 어긋나 있다:

- `src/data/blogCategories.ts` (코드, 진실의 원천): ETF, Economics, Semiconductor, Computer Science, Programming, Problem_Solving, Reports, Market Brief — 8개.
- `README.md`: **Economics 누락** (7개). Main Routes 목록에도 `/economics` 누락.
- `AGENTS.md`: **Economics 누락** (7개). Routing Notes의 카테고리 페이지 목록에도 `/economics` 누락.
- `CLAUDE.md`: 최신화 완료 (2026-07-18).

새 카테고리를 추가할 때마다 문서 3곳을 고쳐야 하는 구조 자체가 원인이다.

## 목표

문서에서는 카테고리를 나열하지 않고 코드 참조로 위임하여, 어긋남이 재발하지 않게 한다.

## 변경 대상

1. `README.md`
   - `## Categories` 섹션: 목록 나열 대신 "전체 카테고리 정의는 `src/data/blogCategories.ts`의 `BLOG_CATEGORIES` 참조" 한 줄로 교체 (현재 대표 예시는 2~3개만 남겨도 됨).
   - `## Main Routes`: `/economics` 추가하거나, 카테고리 라우트 부분을 "카테고리별 라우트는 `blogCategories.ts`의 `href` 참조"로 위임.
2. `AGENTS.md`
   - `## Category Conventions`의 목록 → 코드 참조로 교체.
   - `## Routing Notes`의 카테고리 페이지 목록 → 동일하게 위임 (또는 `/economics` 추가).
3. (선택) `scripts/check-content.mjs` 또는 별도 스크립트에 "문서에 나열된 카테고리가 코드와 일치하는지" 검사 추가 — 위임 방식으로 바꾸면 불필요하므로 **비권장**.

## 구현 단계

1. README.md, AGENTS.md에서 카테고리/라우트 나열 부분을 코드 참조 문구로 교체.
2. 남길 정보 판단 기준: **코드에서 파생 가능한 것(목록, 라우트)은 위임**, 코드에 없는 규칙(예: "카테고리 페이지 노출 조건", ETF 분류 가이드 링크)은 유지.
3. 두 문서의 다른 정보(frontmatter 규칙 등)도 이 기회에 CLAUDE.md와 모순 없는지 훑기.

## 검증

- 문서 변경뿐이므로 빌드 검증 불필요. `grep -rn "Economics\|/economics" README.md AGENTS.md`로 교체 누락 확인.

## 리스크 / 참고

- 없음. 문서만 수정하는 소규모 작업이며 단독 커밋으로 처리한다.
