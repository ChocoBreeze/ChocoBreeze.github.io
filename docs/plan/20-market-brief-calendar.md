# 20. Market Brief 캘린더

## 현재 동작

- Market Brief 페이지는 월별 목록과 Daily·Weekly·월 필터를 유지하면서 목록·달력 뷰를 전환할 수 있습니다.
- `briefType`이 있으면 명시값을 사용하고, 기존 글은 제목에 `weekly`가 포함되는지로 추론합니다.
- `marketDate`가 있으면 미국 시장 기준일을 사용하고, 기존 글은 `pubDate` 또는 legacy `date`를 게시일 fallback으로 사용합니다.
- `type`·`month`·`view` 필터 상태가 URL에 남아 새로고침·공유·뒤로 가기에서 복원됩니다.
- Weekly에는 지정된 `coverageStart`~`coverageEnd` 범위의 Daily를 연결하고, 범위가 없으면 Weekly 날짜 기준 최근 7일을 fallback으로 사용합니다.

## 목표

- 기존 목록과 필터를 유지하면서 발행 공백과 일정을 한눈에 보는 월간 캘린더를 제공합니다.
- 같은 주의 Daily와 Weekly를 명시적으로 연결합니다.

## 권장 데이터 모델

- `briefType`: `Daily` 또는 `Weekly`
- `marketDate`: 리포트가 다루는 미국 시장 기준일
- Weekly에는 선택적으로 `coverageStart`, `coverageEnd`

`pubDate`는 게시 시각으로 유지하고 시장 기준일을 대신하지 않습니다. 기존 글은 제목 추론을 폴백으로 유지한 뒤 점진적으로 전환합니다.

명시 메타데이터가 없는 레거시 글은 기존 URL과 콘텐츠를 변경하지 않고 게시일 fallback으로 달력에 표시합니다. 새 글은 `npm run new:post -- --type market-daily|market-weekly`로 `briefType`을 자동 생성할 수 있으며, `--market-date`와 Weekly 범위 옵션은 작성자가 확인한 경우에만 추가합니다.

## 변경 후보

- `src/content.config.ts`
- `src/pages/market-brief/index.astro`
- `src/pages/blog/[...slug].astro` 또는 글 액션 영역
- `scripts/new-post.mjs`
- `docs/market-brief-prompts.md`
- `scripts/check-content.mjs`, 관련 테스트

## 구현 단계

1. [완료] 한국 시간 게시일과 미국 시장 기준일의 의미 및 레거시 fallback을 문서화했습니다.
2. [완료] 선택 frontmatter와 스캐폴드 옵션을 추가했습니다.
3. [완료] 현재 필터 상태를 URL에 저장하도록 개선했습니다.
4. [완료] 월별 그룹 데이터를 재사용해 접근 가능한 캘린더 뷰를 추가했습니다.
5. [완료] 날짜 셀에서 Daily·Weekly를 구분하고 동일 날짜의 복수 글을 처리했습니다.
6. [완료] Weekly 범위에 속한 Daily와 상호 링크를 생성했습니다.
7. [완료] 캘린더와 기존 카드 목록 사이 전환을 제공하며 목록을 유지했습니다.

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
