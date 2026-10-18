# 32. 크기 예산과 접근성 스모크 테스트

23번 계획의 `접근성·성능 자동 검사` 후보를 구체화한 문서입니다. 점수 게이트가 아니라 예산과 회귀 감지를 다룹니다.

## 현재 동작

- `npm run check:build-artifacts`는 글 라우트 생성, 내부 링크, 검색 레코드 존재를 검사합니다. 용량은 검사하지 않습니다.
- `npm run report:search-size`는 배포 워크플로에서 검색 인덱스 크기를 출력하지만 임계값은 없습니다.
- 브라우저 테스트는 `e2e/search.spec.mjs` 한 개이며 검색 경로만 다룹니다.
- 2026-10-16 빌드 산출물 구성은 다음과 같습니다.
  - 전체 `dist` 86MB
  - `dist/og` 29MB(글 506편의 자동 생성 OG 카드 506개)
  - `dist/blog` 29MB, `dist/tags` 6.5MB, `dist/images` 7.6MB, `dist/_astro` 4.0MB
  - `search.json` 3.3MB, `code-search.json` 2.4MB, `dist/search` 3.5MB
- 가장 큰 글 HTML은 324,939바이트입니다.

## 목표

1. 산출물 용량이 조용히 늘어나는 것을 CI에서 감지합니다.
2. 키보드 접근과 명도 대비의 명백한 회귀를 자동으로 잡습니다.
3. CI 실행 시간을 과도하게 늘리지 않습니다.

## 범위

- 산출물 크기 예산과 임계값 초과 시 실패 조건
- 접근성 스모크 테스트 2~3개
- 예산 변경 절차
- Lighthouse 점수 기준 게이트는 포함하지 않음

## 예산 설계

- 예산은 절대값으로 두고, 현재 측정값에 여유를 더해 시작합니다. 글이 늘면 자연히 증가하는 항목(`dist/og`, `dist/blog`)은 **글 1편당 평균**으로 관리합니다.
- 고정 자산(`dist/_astro`, 전역 CSS·JS)은 총량으로 관리합니다.
- 검색 인덱스는 `report:search-size` 출력과 같은 값을 사용해 두 곳이 어긋나지 않게 합니다.
- 예산 초과는 실패로 처리하되, 의도된 증가는 같은 커밋에서 예산 값을 올리고 이유를 기록합니다.

## 접근성 스모크 범위

- 글 상세 1건: heading 순서, 본문 landmark, 이미지 alt, TOC 링크 접근
- 검색 페이지: 키보드만으로 입력 → 결과 이동
- 카테고리 목록 1건: 링크 이름과 포커스 표시

자동 검사로 대체할 수 없는 항목(한국어 UI 문구, 다크 모드 가독성, 모바일 읽기 경험)은 기존 리뷰 체크리스트로 남깁니다.

## 변경 후보

- `scripts/check-build-artifacts.mjs` — 예산 검사
- `scripts/lib/`(신규) — 예산 정의와 집계
- `e2e/accessibility.spec.mjs`(신규)
- `.github/workflows/ci.yml`, `.github/workflows/deploy.yml` — 실행 순서 확인
- `scripts/test/build-artifacts.test.mjs`

## 구현 단계

1. [완료] `npm run check:build-artifacts -- --report-budgets`가 그룹별 용량과 한도 대비 사용률을 출력합니다.
2. [완료] `scripts/lib/build-budgets.mjs`가 예산 정의이고 `check:build-artifacts`가 검사합니다. 현재 사용률은 71~86%로 통과합니다.
3. [완료, 방침 변경] `e2e/accessibility.spec.mjs`에 5개를 추가했습니다. axe 대신 DOM 단언으로 작성했습니다. 의존성을 늘리지 않고 CI 시간도 거의 그대로이며, 계획이 적어둔 항목(랜드마크, heading 순서, alt, 키보드 탐색, 링크 이름·포커스 표시)을 그대로 검사합니다.
4. [완료] 브라우저 테스트가 11개 약 16초에서 16개 약 22초가 되었습니다. 옮길 만큼 느린 항목은 없습니다. 오히려 PR에서 돌지 않던 `check:build-artifacts`를 `ci.yml`에 추가해 크기 회귀가 배포가 아니라 PR에서 걸리도록 했습니다.
5. [완료] 초과 시 그룹·라벨·측정값·한도·초과량을 출력하고, per-post 예산은 `한 글당 한도 x 글 수`를 함께 표시합니다.

## 테스트 설계

- 예산 이내·초과 입력에 대한 검사 함수 단위 테스트
- 항목이 누락된 산출물에서 검사가 명확히 실패하는지 확인
- 글 1편당 평균 계산이 글 수 변화에 맞게 동작하는지 확인
- 접근성 스모크가 실제 위반을 잡는지 의도적 위반 픽스처로 확인

## 검증

- `npm test`
- `npm run build` 및 `npm run check:build-artifacts`
- `npm run report:search-size`
- `npm run test:e2e`
- `npm run format:check`

### 2026-10-18 구현 결과

2026-10-18 빌드(글 506편, `dist` 84.8 MiB) 기준 예산과 사용률입니다.

| 그룹 | 현재 | 한도 | 사용률 |
| --- | ---: | ---: | ---: |
| `og` | 27.04 MiB | 70,000 B × 글 수 | 80% |
| `blog` | 26.96 MiB | 70,000 B × 글 수 | 80% |
| `_astro` | 3.99 MiB | 5.25 MiB | 76% |
| `images` | 6.94 MiB | 8.11 MiB | 86% |
| `katex` | 0.27 MiB | 0.38 MiB | 71% |
| `search.json` | 4.25 MiB | 5.25 MiB | 81% |
| `code-search.json` | 2.33 MiB | 2.86 MiB | 82% |
| `search` | 4.36 MiB | 5.25 MiB | 83% |

- 글 수에 비례해 자라는 `og`·`blog`는 글 1편당 한도로, 나머지는 총량으로 관리합니다.
- 예산을 올릴 때는 증가를 만든 커밋에서 같이 올리고 이유를 커밋 메시지에 적습니다.
- 검증: `npm test` 338개 통과(예산 검사 7개 추가), `npm run build` 성공, `npm run check:build-artifacts` 통과, `npm run test:e2e` 16개 통과, `npm run format:check` 통과

## 범위 제외

- Lighthouse 점수 게이트
- 방문자 분석·실사용자 성능 수집(23번 계획의 조건부 항목)
- 외부 모니터링 서비스 연동
