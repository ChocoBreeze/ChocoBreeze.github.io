# 33. 기준일 경과 리포트

17번(콘텐츠 기준일과 검증일)과 19번(ETF 탐색기)의 잔여 작업인 "나머지 수동 검토"에서 무엇부터 다시 확인할지 정하는 진단 명령을 추가합니다.

## 현재 동작

- `src/lib/contentFreshness.mjs`의 `getFreshnessStatus()`는 ETF·Reports 글에 365일 기준 하나만 적용하고, 글 상세 페이지(`BlogPost.astro`)의 안내 문구에만 사용합니다.
- 기준일은 `dataAsOf ?? verifiedDate` 하나뿐입니다. `aumAsOf`, `expenseRatioAsOf`, `yieldAsOf` 같은 필드별 기준일은 경과 판단에 쓰이지 않습니다.
- 전체 글을 대상으로 경과 상태를 모아 보는 명령은 없습니다.
- 2026-10-26 기준 측정값(초안 상태 제외, frontmatter 직접 집계)은 다음과 같습니다.

| 항목 | ETF (135편) | Reports (45편) |
| --- | ---: | ---: |
| `dataAsOf`·`verifiedDate` 모두 없음 | 4 | 1 |
| 기준일 365일 초과 | 0 | 0 |
| 기준일 180일 초과 | 2 | 3 |
| 기준일 90일 초과 | 26 | 3 |
| `aumAsOf` 보유 / 90일 초과 | 107 / 15 | 0 / 0 |
| `expenseRatioAsOf` 보유 / 365일 초과 | 120 / 2 | 0 / 0 |
| `yieldAsOf` 보유 / 90일 초과 | 26 / 3 | 0 / 0 |

현재 365일 단일 기준으로는 경과 글이 0편입니다. 하지만 AUM·분배율처럼 빨리 바뀌는 값은 이미 90일을 넘긴 글이 있습니다.

## 목표

1. 필드별 변동 속도에 맞는 기준으로 다시 확인할 글 목록을 한 번에 출력합니다.
2. 기준일이 아예 없는 글을 별도 묶음으로 보여 17번 잔여 검토 대상을 드러냅니다.
3. 빌드 산출물과 글 페이지 표시는 바꾸지 않습니다.

## 범위

- `npm run report:stale` 진단 명령 추가
- 필드별 기준일 정의와 집계 함수
- 단위 테스트
- 포함하지 않음: 글 페이지 안내 문구 변경, CI 실패 조건, 외부 데이터 자동 조회, 값 자동 갱신

## 기준 설계

| 필드 | 기본 한도 | 근거 |
| --- | ---: | --- |
| `dataAsOf ?? verifiedDate` | 365일 | 기존 `FRESHNESS_MAX_AGE_DAYS`와 동일하게 유지 |
| `aumAsOf` | 90일 | 운용자산은 분기 단위로 크게 변함 |
| `yieldAsOf` | 90일 | 분배율은 분배 주기마다 변함 |
| `expenseRatioAsOf` | 365일 | 보수율은 연 단위 변경이 일반적 |

- 한도는 `contentFreshness.mjs`에 필드별 상수로 두고, 기존 `FRESHNESS_MAX_AGE_DAYS`는 그대로 둡니다. 글 페이지의 365일 판단이 바뀌지 않게 하기 위해서입니다.
- `--days <n>` 옵션은 모든 한도를 일괄 덮어쓰는 수동 점검용으로만 둡니다.
- 기준 시각은 Asia/Seoul 오늘이며, 테스트를 위해 `--now <ISO>` 옵션을 둡니다.
- 초안 글은 `scripts/lib/content-rules.mjs`의 `isDraftFrontmatter()`로 제외합니다.

## 출력 형식

- 필드별 묶음으로 나누고, 각 묶음은 경과일이 큰 순서로 정렬합니다.
- 한 줄에 `경과일`, `기준일`, `ticker`(있으면), `파일 경로`를 표시합니다.
- 마지막에 묶음별 개수 요약과 "기준일 없음" 목록을 출력합니다.
- `--json` 옵션으로 같은 내용을 JSON으로 출력합니다.
- 종료 코드는 항상 0입니다. 경과는 실패가 아니라 작업 목록입니다.

## 변경 후보

- `src/lib/contentFreshness.mjs` — 필드별 한도 상수와 집계 함수 추가(기존 함수 시그니처 유지)
- `scripts/report-stale-data.mjs`(신규)
- `package.json` — `report:stale` 스크립트
- `scripts/test/content-freshness.test.mjs` — 필드별 판단 테스트 추가
- `CLAUDE.md` — 진단 명령 목록에 한 줄 추가

## 구현 단계

1. 필드별 한도와 `collectStaleFields(frontmatter, now)` 함수를 추가하고 테스트합니다.
2. 리포트 스크립트가 ETF·Reports 글을 읽어 묶음별로 출력합니다.
3. `--days`, `--now`, `--json` 옵션을 추가합니다.
4. 출력 결과를 위 측정표와 대조해 수치가 맞는지 확인합니다.

## 테스트 설계

- 한도 경계값(정확히 90일, 91일)에서의 판단
- `dataAsOf`가 있으면 `verifiedDate`보다 우선하는지
- 날짜 파싱 실패와 필드 누락이 "기준일 없음" 또는 무시로 올바르게 분류되는지
- 초안 글 제외
- 기존 `getFreshnessStatus()` 테스트가 그대로 통과하는지

## 검증

- `npm test`
- `npm run report:stale`의 개수 요약이 측정표와 일치하는지 확인
- `npm run check`
- `npm run format:check`
