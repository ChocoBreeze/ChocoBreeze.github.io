# 18. 카테고리 탐색과 Problem Solving 확장

## 현재 동작

- 공통 카테고리 목록은 최신순·오래된 순 정렬과 30개 단위 더 보기를 제공합니다.
- ETF 페이지는 연도·태그 필터를 파일럿으로 제공하며 선택값을 `year`·`tag` URL 파라미터에 보존합니다.
- Problem Solving 페이지는 Easy·Medium·Hard 집계와 공통 상태 기반 난이도 필터, 상위 8개 토픽 집계를 제공합니다.
- 토픽 표시는 현재 정보 제공용이며 필터로 동작하지 않습니다.
- 필터·정렬·더 보기 로직은 공통 레이아웃에서 관리하고, Problem Solving의 난이도 카드는 공통 상태를 사용합니다.

## 목표

- 글이 많은 카테고리에서 연도·태그·주제 등으로 탐색할 수 있게 합니다.
- Problem Solving은 기존 대시보드를 폐기하지 않고 복합 필터와 플랫폼·문제 번호 탐색으로 확장합니다.

## 권장 상태 모델

- 공통: `year`, `tag`
- Problem Solving: `difficulty`, `topic`, `platform`
- 정렬: 기존 `sort`
- 필터 상태는 URLSearchParams에 저장하고 새로고침·뒤로 가기에서 복원합니다.
- 더 보기는 전체 카드가 아니라 현재 필터와 일치하는 카드 수를 기준으로 계산합니다.

## 변경 후보

- `src/layouts/BlogListLayout.astro`
- `src/components/BlogPostCard.astro`
- `src/pages/problem-solving/index.astro`
- `src/content.config.ts` — `platform`, `problemNumber`를 명시할 경우
- 신규 `src/lib/listFilters.*` — 상태·필터 로직 공통화 시
- `scripts/new-post.mjs`, `templates/post.md`

## 구현 단계

1. [완료] 카드가 노출할 필터 데이터와 URL 파라미터 이름을 확정했습니다(`year`, `tag`).
2. [완료] 공통 정렬·더 보기·필터가 하나의 상태에서 동작하도록 로직을 정리했습니다.
3. [완료] ETF에 연도·태그 필터를 파일럿 적용했습니다.
4. [완료] Problem Solving의 기존 난이도 필터를 공통 상태 모델에 연결했습니다.
5. 토픽 칩을 실제 필터로 확장합니다.
6. `platform`·`problemNumber`는 제목 파싱보다 선택 frontmatter를 우선하고 신규 글부터 적용합니다.
7. 파일럿 후 다른 카테고리로 확장합니다. ETF와 Market Brief의 특수 필터는 각각 19·20번 계획에서 다룹니다.

## 테스트 설계

- 필터 없음, 단일 필터, 복합 필터, 결과 없음 상태
- 필터 후 더 보기와 정렬을 변경했을 때 표시 개수와 순서
- URL 직접 진입, 새로고침, 뒤로·앞으로 가기
- 알 수 없는 쿼리 값이 안전하게 무시되는지 확인
- JS 비활성 환경에서 전체 글과 링크가 여전히 접근 가능한지 확인
- 기존 난이도 집계와 토픽 수가 실제 글 데이터와 일치하는지 확인
- `npm run check`, `npm run build`, `npm run format:check`

## 리스크

- 필터 UI를 모든 카테고리에 동시에 추가하면 빈 옵션이 많아질 수 있습니다.
- 기존 83개 Problem Solving 글의 플랫폼·문제 번호 백필은 UI 변경과 별도 콘텐츠 커밋으로 분리합니다.
