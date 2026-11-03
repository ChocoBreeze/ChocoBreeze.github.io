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
| `aumAsOf` | 150일 | 분기 공시 간격 90일 + 공시 지연 약 60일 (처음 90일에서 변경) |
| `yieldAsOf` | 150일 | `aumAsOf`와 같은 기준 (처음 90일에서 변경) |
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

1. [완료] `contentFreshness.mjs`에 `FIELD_MAX_AGE_DAYS`와 `collectStaleFields(fields, now, maxAgeOverride)`를 추가했습니다. 기준일 한도는 기존 `FRESHNESS_MAX_AGE_DAYS`를 그대로 씁니다. 입력은 frontmatter 원문이 아니라 파싱된 필드 값이라 순수 함수로 테스트합니다.
2. [완료] `scripts/report-stale-data.mjs`가 첫 번째 카테고리 기준(글 페이지와 같은 규칙)으로 ETF·Reports 글을 골라 묶음별로 출력합니다.
3. [완료] `--days`, `--now`, `--json` 옵션을 추가했습니다. 잘못된 옵션만 종료 코드 1입니다.
4. [완료] 2026-10-27 실행 결과(`--now 2026-10-26T00:00:00+09:00`)가 측정표와 일치합니다. 대상 180편, 기준일 365일 초과 0편, AUM 90일 초과 15편, 분배율 90일 초과 3편, 보수율 365일 초과 2편, 기준일 없음 5편입니다.

## 테스트 설계

- 한도 경계값(정확히 150일, 151일)에서의 판단
- `dataAsOf`가 있으면 `verifiedDate`보다 우선하는지
- 날짜 파싱 실패와 필드 누락이 "기준일 없음" 또는 무시로 올바르게 분류되는지
- 초안 글 제외
- 기존 `getFreshnessStatus()` 테스트가 그대로 통과하는지

## 검증

- `npm test`
- `npm run report:stale`의 개수 요약이 측정표와 일치하는지 확인
- `npm run check`
- `npm run format:check`

### 2026-11-02 재확인 시험 결과

가장 오래된 AUM 4건(QQQS, QQMG, IBBQ, ONEQ)을 2026년 8월 31일 기준 NPORT-P 값으로 갱신했습니다. 나머지 대상은 아직 갱신하지 않았습니다.

- 집계 사이트는 같은 시기 값이 서로 크게 달라(IBBQ $67M~$95M) 근거로 쓰지 않습니다.
- 등록 투자회사 ETF는 SEC 공시로 확인합니다. `data.sec.gov/submissions/CIK<10자리>.json`에서 제출 목록을 찾고, EDGAR 전문 검색으로 펀드의 제출 건을 찾은 뒤, `primary_doc.xml`의 `seriesName`, `repPdDate`, `netAssets`를 읽습니다.
- `repPdDate`가 기준일입니다. `repPdEnd`는 회계연도 말일 수 있습니다(ONEQ는 2026-11-30).
- 분기 공시는 기준일 약 60일 뒤에 공개되므로, 90일 한도로는 최신 공시를 반영해도 다음 공시 전에 한도를 넘는 기간이 생겼습니다. 그래서 AUM·분배율 한도를 150일로 바꿨습니다.

### 2026-11-03 보수율 재확인과 한도 조정

- AUM·분배율 한도를 150일로 바꿨습니다. 이 기준으로 초과 글은 0편입니다.
- 365일을 넘긴 보수율 5편을 새 요약 투자설명서로 확인했습니다. DRUP(0.60%), XAR(0.35%), ROKT(0.45%), JEPQ(0.35%)는 값이 같고, SEMY는 순비용 1.14%, 총비용 1.16%로 바뀌었습니다.
- SEMY의 비용 한도는 1.15%로 같지만 기한이 2027년 12월 31일로 늘었고, 글에 적힌 제외 항목이 투자설명서와 달라 함께 고쳤습니다. ROKT의 회전율은 21%에서 60%로 고쳤습니다.
- `check:content`는 `expenseRatioAsOf`가 `verifiedDate`보다 늦을 수 없게 하므로 다섯 글의 `verifiedDate`를 2026-11-03으로 바꿨습니다. 이때 다시 확인한 것은 비용과 회전율뿐입니다. 본문에 범위를 적을 자리가 있는 글은 그렇게 표시했습니다.
