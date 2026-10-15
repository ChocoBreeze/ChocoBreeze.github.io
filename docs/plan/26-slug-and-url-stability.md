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

1. [완료] `getDerivedRouteIssues()`가 중복 세그먼트, 비ASCII 세그먼트, `readme`/`index` 파일명 세그먼트를 경고로 분류합니다. Astro의 슬러그화가 대문자를 이미 소문자로 바꾸므로 대문자 검사는 넣지 않았습니다. 전체 실행에서는 `DERIVED ROUTES <n> warning(s)` 한 줄로 묶고 `--report-derived-routes`로 전체 목록을 봅니다. pre-commit 훅은 커밋 대상 글의 항목만 출력합니다.
2. [완료] `src/data/postRedirects.mjs`가 매핑 단일 출처이고, `astro.config.mjs`의 `redirects`와 사이트맵 `filter`가 이 값을 함께 사용합니다. 전용 라우트를 만들지 않고 Astro의 정적 리다이렉트를 사용합니다. 빈 매핑 상태에서 빌드가 정상인지 먼저 확인했습니다.
3. [완료] 중복 세그먼트 41편과 `readme` 세그먼트 15편, 합계 56편에 `slug`를 백필하고 이전 경로 56개를 매핑에 추가했습니다. 백필 전에 56개 경로를 가리키는 내부 링크가 없음을 확인했습니다(0건).
4. [미착수] 남은 대상은 비ASCII 세그먼트 92편입니다. 한글 slug는 현재도 동작하므로 기계적 변환 대상이 아니고, 영문 slug 명명은 글마다 사람이 정해야 합니다. 명명 방침을 정한 뒤 카테고리 단위로 나눠 백필합니다.
5. [완료] `check:build-artifacts`가 매핑별로 리다이렉트 페이지 생성, 대상 경로 일치, `robots noindex`, canonical, 대상 페이지 존재를 검사하고, 자체 매핑의 자기참조·중복 출발·연쇄도 검사합니다. Astro가 리다이렉트 페이지에 `Redirecting to: ...` 제목을 쓰므로 사이트 제목 규칙에서는 제외합니다.
6. [미착수] 4단계가 끝난 뒤 판단합니다. 현재는 경고 92건이 남아 있어 승격하면 빌드가 막힙니다.

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

### 2026-10-16 구현 결과

- 경로 파생 경고 148건을 확인했습니다. 내역: 중복 세그먼트 41건, 비ASCII 92건, `readme` 15건(한 글이 여러 항목에 걸릴 수 있음). 전체 506편 중 명시적 `slug` 보유는 116편이었습니다.
- 56편 백필 후 경고는 92건으로 줄었고, 전체 경고 기준선은 7건을 유지했습니다.
- `npm test` 276개 통과(리다이렉트 매핑·빌드 검사 테스트 24개 추가)
- `npm run build` 성공, 생성 페이지 902개. 리다이렉트 페이지 56개가 추가되어 HTML 산출물은 903개에서 958개가 되었습니다.
- `npm run check:build-artifacts` 통과(게시글 506편, 초안 0편, 링크 7,934개). 이전 경로는 사이트맵에 포함되지 않음을 확인했습니다.
- `npm run test:e2e` 8개 통과, `npm run format:check` 통과
- 확인 예: `/blog/semiconductor/readme/`는 canonical·noindex·meta refresh를 가진 리다이렉트 페이지가 되고, 본문은 `/blog/semiconductor/`에서 제공됩니다.

## 범위 제외

- 리다이렉트 없는 URL 변경
- 카테고리 경로 체계 재편
- 외부 유입 경로 추적(방문 통계는 23번 계획의 조건부 항목)
