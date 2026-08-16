# 20. Market Brief 캘린더

## 현재 동작

- Market Brief 페이지는 이미 월별 그룹, Daily·Weekly 필터, 월 필터, 최신 Weekly 강조를 제공합니다.
- Daily·Weekly 판정은 제목에 `weekly`가 포함되는지로 추론합니다.
- 필터 상태가 URL에 남지 않고 달력 형태와 데일리↔위클리 연결은 없습니다.

## 목표

- 기존 목록과 필터를 유지하면서 발행 공백과 일정을 한눈에 보는 월간 캘린더를 제공합니다.
- 같은 주의 Daily와 Weekly를 명시적으로 연결합니다.

## 권장 데이터 모델

- `briefType`: `Daily` 또는 `Weekly`
- `marketDate`: 리포트가 다루는 미국 시장 기준일
- Weekly에는 선택적으로 `coverageStart`, `coverageEnd`

`pubDate`는 게시 시각으로 유지하고 시장 기준일을 대신하지 않습니다. 기존 글은 제목 추론을 폴백으로 유지한 뒤 점진적으로 전환합니다.

## 변경 후보

- `src/content.config.ts`
- `src/pages/market-brief/index.astro`
- `src/pages/blog/[...slug].astro` 또는 글 액션 영역
- `scripts/new-post.mjs`
- `docs/market-brief-prompts.md`
- `scripts/check-content.mjs`, 관련 테스트

## 구현 단계

1. 한국 시간 게시일과 미국 시장 기준일의 의미를 문서화합니다.
2. 선택 frontmatter와 스캐폴드 기본값을 추가합니다.
3. 현재 필터 상태를 URL에 저장하도록 개선합니다.
4. 월별 그룹 데이터를 재사용해 접근 가능한 캘린더 뷰를 추가합니다.
5. 날짜 셀에서 Daily·Weekly를 구분하고 동일 날짜의 복수 글을 처리합니다.
6. Weekly 범위에 속한 Daily와 상호 링크를 생성합니다.
7. 캘린더와 기존 카드 목록 사이 전환을 제공하되 목록을 제거하지 않습니다.

## 테스트 설계

- 월 시작 요일, 윤년 2월, 월 경계에 걸친 Weekly
- 같은 날 Daily·Weekly가 모두 있는 경우
- 발행 공백과 날짜 없는 레거시 글
- 제목 추론 폴백과 명시 `briefType`의 우선순위
- 캘린더 키보드 탐색과 스크린리더 레이블
- 필터 URL 복원과 뒤로 가기
- `npm test`, `npm run check:content`, `npm run check`, `npm run build`

## 후속 후보

지수 시계열은 데이터 출처·갱신 주기·기준일 정책이 정해진 뒤 별도 계획으로 작성합니다. 캘린더 구현에 포함하지 않습니다.
