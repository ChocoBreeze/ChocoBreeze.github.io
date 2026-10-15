# 26. slug와 URL 안정성

## 현재 동작

- 글 URL은 `post.data.slug || post.id`로 결정됩니다. `slug`가 없으면 파일 경로의 각 세그먼트를 슬러그화한 값이 URL이 됩니다.
- `CLAUDE.md`와 `AGENTS.md`는 안정적인 URL을 위해 `slug`를 명시하도록 안내합니다.
- 2026-10-16 측정값은 다음과 같습니다.
  - 전체 506편 중 `slug`를 명시한 글은 116편(23%)이고, 390편은 경로에서 URL이 파생됩니다.
  - 그중 41편은 폴더명과 파일명이 같아 마지막 세그먼트가 중복된 URL이 생성됩니다. 예: `/blog/etf/broad-market/nasdaq-next-gen-100/qqqj/qqqj/`
- `content-rules.mjs`의 `UNSAFE_SLUG_REGEX`는 공백·`?`·`#`·백슬래시가 포함된 `slug` 값만 검사하고, 경로에서 파생되는 URL의 품질은 검사하지 않습니다.
- `scripts/new-post.mjs`는 `--slug`를 생략하면 제목에서 slug를 생성하므로, 새 글은 이미 명시적 slug를 갖습니다.

## 목표

1. 경로에서 파생된 저품질 URL을 더 이상 새로 만들지 않습니다.
2. 기존 글의 URL을 개선하면서, 이미 외부에 노출된 경로를 깨뜨리지 않습니다.
3. 파일을 옮기거나 이름을 바꿔도 URL이 변하지 않는 상태로 수렴합니다.

## 범위

- 중복 세그먼트, 대문자, 비ASCII 경로에서 파생되는 URL 경고
- 카테고리 단위 `slug` 백필
- 이전 경로에서 새 경로로 보내는 정적 리다이렉트 페이지와 그 검증
- 이미 `slug`가 있는 글의 값 변경은 하지 않음

## 리다이렉트 방식

GitHub Pages 정적 배포는 301 응답을 구성할 수 없으므로, 이전 경로에 다음을 담은 최소 HTML 페이지를 생성합니다.

- `<link rel="canonical">`로 새 경로 지정
- `<meta http-equiv="refresh">`와 본문 링크
- `<meta name="robots" content="noindex">`
- 사이트맵과 검색 인덱스, RSS에서 제외

리다이렉트 매핑은 데이터 파일 하나로 관리해 생성·검증·제거가 한곳에서 이뤄지게 합니다.

## 변경 후보

- `scripts/lib/content-rules.mjs`, `scripts/check-content.mjs` — URL 품질 경고
- `src/data/postRedirects.*` — 이전 경로 → 새 경로 매핑(신규)
- `src/pages/blog/[...slug].astro` 또는 전용 리다이렉트 라우트
- `src/lib/searchIndex.ts`, `src/lib/rss.js`, 사이트맵 설정 — 리다이렉트 경로 제외 확인
- `scripts/check-build-artifacts.mjs` — 매핑된 이전 경로가 실제로 생성되는지 검사

## 구현 단계

1. [미착수] 경로 파생 URL의 중복 세그먼트·대문자·비ASCII를 경고로 리포트합니다. 기존 390편이 매번 전부 출력되지 않도록 레거시 경고 정책을 따릅니다.
2. [미착수] 리다이렉트 매핑 데이터와 생성 라우트를 먼저 만들고, 매핑이 비어 있는 상태에서 빌드가 정상인지 확인합니다.
3. [미착수] 중복 세그먼트 41편을 첫 대상으로 `slug`를 백필하고 이전 경로를 매핑에 추가합니다.
4. [미착수] 나머지 글은 카테고리 단위로 나눠 백필하고, 카테고리마다 별도 커밋으로 분리합니다.
5. [미착수] `check:build-artifacts`에 리다이렉트 생성·canonical 검사를 추가합니다.
6. [미착수] 백필이 끝난 카테고리에 대해 경고를 오류로 승격할지 판단합니다.

## 테스트 설계

- 중복 세그먼트·대문자·한글 경로 글이 경고로 분류되는지 확인
- `slug`가 명시된 글은 경고 대상이 아닌지 확인
- 리다이렉트 매핑이 새 경로를 가리키고, 대상 글이 존재하는지 검사
- 리다이렉트 페이지가 사이트맵·RSS·검색 인덱스에 포함되지 않는지 확인
- 매핑에 순환이나 중복 출발 경로가 없는지 확인

## 검증

- `npm test`
- `npm run check:content`
- `npm run check`
- `npm run build` 및 `npm run check:build-artifacts`
- `npm run format:check`

## 범위 제외

- 리다이렉트 없는 URL 변경
- 카테고리 경로 체계 재편
- 외부 유입 경로 추적(방문 통계는 23번 계획의 조건부 항목)
