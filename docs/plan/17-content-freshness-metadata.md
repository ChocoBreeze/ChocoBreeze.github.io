# 17. 콘텐츠 기준일과 검증일

## 현재 동작

- 스키마와 글 상세가 `updatedDate`, `verifiedDate`, `dataAsOf`를 각각 문서 수정일·사실 검증일·수치 기준일로 표시합니다.
- ETF·기업 분석·산업 리포트에는 시간이 지나면 변하는 보수율, AUM, 가격, 시장 수치가 포함됩니다.
- ETF·Reports 일부 파일럿 글에는 기준일 메타데이터가 적용되어 있으며, 수치 오래됨 경고는 `dataAsOf`를 우선하고 없으면 `verifiedDate`를 사용합니다.
- 오래됨 경고는 ETF와 Reports에만 365일 기준으로 적용되고, 브라우저에서 현재 날짜를 다시 계산합니다.

## 목표

- 문서 수정일, 사실 재검증일, 데이터 기준일을 구분합니다.
- 오래된 수치를 최신 정보처럼 오인하지 않도록 글 상세에 문맥을 제공합니다.

## 데이터 모델

- `updatedDate`: 문서 내용이나 구조를 수정한 날짜
- `verifiedDate`: 핵심 사실과 출처를 다시 확인한 날짜
- `dataAsOf`: 표와 수치가 대표하는 기준일

세 필드는 ISO 8601 형식을 사용합니다. Git 커밋 시각을 자동으로 대입하지 않습니다.

## 변경 후보

- `src/content.config.ts`
- `src/layouts/BlogPost.astro`
- `src/components/BlogPostCard.astro` — 필요 시
- `scripts/check-content.mjs`
- `scripts/lib/content-rules.mjs`
- `scripts/test/content-rules.test.mjs`
- `scripts/new-post.mjs`, `templates/post.md`
- ETF·Reports 파일럿 글 소수

## 구현 단계

1. [완료] 필드 타입·엄격한 ISO 형식·날짜 순서 규칙을 스키마와 콘텐츠 검사에 추가했습니다.
2. [완료] 글 상세에 문서 수정일·사실 검증일·수치 기준일 레이블을 표시합니다.
3. [완료] ETF·Reports에 365일 오래됨 정책을 적용하고 Market Brief 같은 역사적 스냅샷은 대상에서 제외했습니다.
4. [완료] 대표 ETF·Reports 글에 파일럿 메타데이터를 적용했습니다.
5. [완료] 새 글 템플릿과 `scripts/new-post.mjs`에 날짜 필드와 검증 옵션을 반영했습니다.
6. [진행 중] 본문에 기준일이 명시된 48개 ETF·Reports 글에 `dataAsOf`를 적용했습니다. SPY 보고서는 본문에 전체 보고서 기준일을 2026년 1월 31일로 명시해 해당 날짜를 적용했습니다. 2026-09-28에는 MPS, Arm, Venture Global, Lumentum, Centrus 보고서 5건에 대해 공시·IR·시세 자료를 대조하고 `updatedDate`·`verifiedDate`를 기록했습니다. MPS는 공시 후 재작성된 EPS와 시세 기준 밸류에이션을 바로잡았습니다. Arm은 간이 EV/Sales를 재계산하고 재현 불가능한 DCF 숫자를 정성 시나리오로 바꿨습니다. Venture Global은 FY2025 조정 EBITDA와 부채·현금, 프로젝트·분쟁 상태 및 밸류에이션을 수정했습니다. Lumentum은 FY2026 실적·전환 이후 자본구조와 최신 as-converted 밸류에이션을 검증했습니다. Centrus는 최신 실적·자본구조, DOE task order 및 HALEU 운영전환 상태, 신규 공급계약과 기준일 주가를 반영했습니다. 나머지 글의 검증일은 출처를 글별로 확인한 경우에만 추가합니다. 기준일을 확인할 수 없는 글은 별도 수동 검토로 분리합니다.

## 테스트 설계

- 세 날짜 필드의 유효·무효 ISO 입력 검사
- 날짜 일부 또는 전부가 없을 때 레이아웃 확인
- `dataAsOf`가 `verifiedDate`보다 미래인 비정상 조합의 정책 확인
- Market Brief에 불필요한 오래됨 경고가 나타나지 않는지 확인
- OG·RSS·검색·빌드가 신규 필드 없이도 정상인지 회귀 확인
- `npm test`, `npm run check:content`, `npm run check`, `npm run build`

## 후속 결정 사항

- ETF와 Reports의 365일 기준을 향후 분리할지 여부
- 목록 카드에도 검증일을 노출할지 여부
- 하나의 글에 여러 데이터 기준일이 있을 때 본문 표기와 frontmatter의 역할 분담

2026-09-28 후속 구현: Venture Global 투자 리포트에 updatedDate·verifiedDate(2026-09-28)를 기록하고 dataAsOf(2026-03-30)를 유지했다. 2025 Form 10-K와 2026-03-02 실적 발표로 조정 EBITDA·부채·현금·계약 잔고를 확인하고, 3월 30일 시세와 가장 최근 공시 주식 수로 간이 시가총액·EV·멀티플을 다시 계산했다. Edison 합의는 서명 시점과 예상 완료 시점을 구분하고 Repsol·Shell·BP 및 미해결 고객 사건을 공시 상태대로 반영했다. 확인되지 않은 동종사 시가총액 표를 제거하고, 프로젝트 인허가·확장 용량과 산업 전망에 원자료 링크를 추가했다.

2026-09-28 후속 구현: Lumentum 리포트에 updatedDate·verifiedDate(2026-09-28), dataAsOf(2026-09-25)를 기록했다. FY2026 10-K·Q4 실적발표, 2026-09-25 종가로 실적·시장가치·순현금·전환사채 잔액 및 preferred as-converted 계산을 확인했다. FY2026 부채소멸손실, OCS 매출 및 마지막 공개 backlog 시점, 고객 집중·재고·가이던스를 반영하고 FY2027 기준 촉매와 질문으로 갱신했다.

2026-09-28 후속 구현: Centrus Energy 리포트에 updatedDate·verifiedDate(2026-09-28), dataAsOf(2026-09-25)를 추가했다. FY2026 Q2 10-Q·실적발표, DOE task order 관련 7월 계약과 9월 X-energy·Radiant·Antares 공급계약, 9월 25일 종가를 대조했다. 2026 상반기 재무·현금흐름, \$4.5B backlog 중 \$3.0B 조건부 약정과 그 안의 \$2.4B definitive agreements, DOE 기존 HALEU 운영계약 종료 위험과 자본구조를 갱신했다. Class B 별도 시세를 확인할 수 없어 10-K상 동등한 경제적 권리를 근거로 Class A 종가를 적용한 추정임을 명시했다. 공개자료에 없는 신규 계약 물량·가격은 추정하지 않았다. `npm run check:content`, `npm run format:check`, `git diff --check`가 통과했고, 독립 검토에서 수치 산술·기준일·계약 상태의 구체적 오류가 발견되지 않았다. 콘텐츠 변경이므로 테스트와 빌드는 실행하지 않았다.
