# 27. 시리즈 허브

## 현재 동작

- 스키마에는 `series`, `seriesSlug`, `seriesOrder`가 있고, `src/lib/series.mjs`가 `sortSeriesPosts()`·`getSeriesPosts()`·`buildSeriesNavigation()`을 제공합니다.
- 글 상세(`src/pages/blog/[...slug].astro`, `src/layouts/BlogPost.astro`)는 시리즈 내 이동과 학습 경로(`src/lib/learningPath.mjs`)를 사용합니다.
- 2026-10-16 기준 `seriesSlug`를 가진 글은 26편(5%)이고 시리즈는 `git-commands` 하나뿐입니다.
- 시리즈 목록 페이지는 손으로 작성한 `src/pages/programming/git-commands.astro` 하나이며, 시리즈가 늘어나도 자동으로 생기지 않습니다.
- 시리즈 전체를 탐색할 수 있는 진입점(`/series/`)은 없습니다.

## 목표

1. 이미 스키마와 유틸리티에 있는 시리즈 메타데이터를 독자에게 처음으로 노출합니다.
2. 시리즈를 추가할 때 페이지를 손으로 만들지 않아도 되게 합니다.
3. 여러 편으로 이어지는 글의 읽는 순서와 현재 위치를 분명히 보여줍니다.

## 범위

- `/series/` 인덱스: 시리즈 목록, 글 수, 최신 발행일, 대표 카테고리
- `/series/<seriesSlug>/`: `seriesOrder` 기준 정렬 목록과 각 글의 발행일·설명
- 글 상세의 시리즈 진행 표시 보강(현재 N번째 / 전체 M편)
- 기존 `src/pages/programming/git-commands.astro`의 처리 방침 결정
- 사이드바 또는 푸터에서의 진입점 추가

## 데이터 정책

- `getPublishedPosts()`만 사용해 초안을 제외합니다.
- 시리즈 식별자는 `seriesSlug`이고 표시 이름은 `series`입니다. 두 값이 불일치하는 경우는 콘텐츠 검사에서 다룹니다.
- `seriesOrder`가 없는 글은 발행일 순으로 뒤에 배치합니다.
- 폴더 구조로 시리즈를 추론하지 않습니다. 메타데이터만 신뢰합니다.

## 변경 후보

- `src/pages/series/index.astro`, `src/pages/series/[series].astro`(신규)
- `src/lib/series.mjs` — 시리즈 목록 집계 함수 추가
- `src/layouts/BlogPost.astro` — 진행 표시
- `src/components/BlogSidebar.astro` 또는 `src/components/Footer.astro` — 진입점
- `scripts/test/series.test.mjs` — 집계 함수 테스트

## 구현 단계

1. [미착수] 발행 글에서 시리즈 목록을 집계하는 순수 함수와 단위 테스트를 추가합니다.
2. [미착수] `/series/` 인덱스를 추가하고 기존 카테고리 목록 레이아웃을 재사용합니다.
3. [미착수] `/series/<seriesSlug>/` 상세를 추가합니다.
4. [미착수] 글 상세의 시리즈 진행 표시를 보강합니다.
5. [미착수] `git-commands` 전용 페이지를 자동 생성 페이지로 대체하고, 기존 경로는 26번 계획의 리다이렉트 방식으로 유지합니다.
6. [미착수] 후속 작업으로 ETF·Market Brief·Problem Solving의 연작 글에 `seriesSlug`를 부여할 대상을 선정합니다. 메타데이터 백필은 UI 구현과 별도 커밋으로 분리합니다.

## 테스트 설계

- 시리즈가 없는 글만 있을 때 빈 목록을 안전하게 처리하는지 확인
- `seriesOrder` 누락·중복·0 값 정렬 확인
- 같은 `seriesSlug`에 서로 다른 `series` 표시 이름이 섞인 경우의 처리 확인
- 초안이 시리즈 목록과 글 수에 포함되지 않는지 확인
- 시리즈 1편뿐인 경우의 표시 확인

## 검증

- `npm test`
- `npm run check`
- `npm run build`
- `npm run format:check`

## 범위 제외

- 시리즈 자동 추론
- 시리즈 구독·알림
- 학습 경로 그래프의 무제한 확장(16번 계획에서 제외된 범위)
