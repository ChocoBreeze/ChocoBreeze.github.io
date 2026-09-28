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
6. [진행 중] 본문에 기준일이 명시된 48개 ETF·Reports 글에 `dataAsOf`를 적용했습니다. SPY 보고서는 본문에 전체 보고서 기준일을 2026년 1월 31일로 명시해 해당 날짜를 적용했습니다. 2026-09-28부터 2026-09-29까지 MPS, Arm, Venture Global, Lumentum, Centrus, Coherent, ASE, IREN, Marvell, Credo, Bloom Energy, Rocket Lab, Navitas Semiconductor, POET Technologies, Redwire Corporation, NuScale Power 보고서 16건에 대해 공시·IR·시세 자료를 대조하고 `updatedDate`·`verifiedDate`를 기록했습니다. MPS는 공시 후 재작성된 EPS와 시세 기준 밸류에이션을 바로잡았습니다. Arm은 간이 EV/Sales를 재계산하고 재현 불가능한 DCF 숫자를 정성 시나리오로 바꿨습니다. Venture Global은 FY2025 조정 EBITDA와 부채·현금, 프로젝트·분쟁 상태 및 밸류에이션을 수정했습니다. Lumentum은 FY2026 실적·전환 이후 자본구조와 최신 as-converted 밸류에이션을 검증했습니다. Centrus는 최신 실적·자본구조, DOE task order 및 HALEU 운영전환 상태, 신규 공급계약과 기준일 주가를 반영했습니다. Coherent는 FY2026 D&C 성장과 보고부문 재편, PhotonLink 예상 램프, NVIDIA 계약·지분투자, 현금흐름과 9월 25일 기준 가치 산정을 확인했습니다. ASE는 최신 2분기 실적과 8월 매출, 사업별 고객 집중도·현금흐름·설비투자를 대조하고 기준일 주가와 ADS 희석 EPS로 간이 TTM P/E를 계산했습니다. 미공개 AI 고객별 매출과 CoWoS 외주 물량은 추정하지 않았습니다. IREN은 FY2026 감사 실적에서 실제 AI 매출과 채굴 매출, 손상차손 및 조정 EBITDA를 분리하고, 계약 TCV·계약 ARR·운영 ARR을 구분했습니다. 선급금·제한성 현금·부채·주식 희석을 반영하고 기준일 주가 기반 EV/Sales를 계산했습니다. 2026-09-28 후속 구현: Marvell 리포트를 FY2027 2분기 10-Q·실적 발표, FY2026 10-K, 9월 25일 종가 기준으로 갱신하고 updatedDate·verifiedDate(2026-09-28), dataAsOf(2026-09-25)를 기록했다. FY2026 데이터센터 비중과 FY2027 상반기·2분기 성장률, non-GAAP와 GAAP 차이, 인수·상각, 현금흐름·차입금을 반영했다. 비공개 고객 매출은 추정하지 않고 FY2026 상위 10개 고객 집중도와 NVIDIA 우선주 전환, 사후 발행 고객 워런트를 희석 위험으로 구분했다. 9월 25일 종가와 Q3 희석주식 가이던스, FY27 상반기 TTM 매출로 간이 EV/Sales를 계산하고 각 기준일·한계를 명시했다. Credo는 FY2027 1분기 10-Q, FY2026 10-K와 9월 25일 시세로 고객 집중도, AEC 성장 기여, DustPhotonics 인수대가, 현금흐름·희석과 EV/TTM Sales를 갱신했다. 익명 고객을 실명 추정하지 않고 이미 행사된 Amazon 워런트와 향후 주식보상을 구분했다. Rocket Lab은 FY2026 2분기 Form 10-Q·실적 발표, 9월 ATM 및 Iridium 자금조달 공시, 인수 주주승인과 9월 25일 종가를 대조했다. 매출·수주잔고·현금흐름·정부 고객 집중도를 갱신하고 Neutron의 4분기 발사대 도착 목표와 첫 발사 일정을 구분했다. 인수는 주주승인 후에도 규제 및 종결 조건이 남아 있음을 반영했으며 ATM 2,930만 주와 전환우선주를 포함한 대략적인 주식 수, 단순 시가총액/최근 12개월 매출을 계산했다. Navitas Semiconductor는 FY2026 2분기 Form 10-Q·실적발표, Claros 인수 등록서류, Magnachip 9월 지분투자 발표 및 Wolfspeed 소송 공시를 대조했다. 모바일 매출 감소와 고전력 매출 성장을 구분하고, earnout 비현금 재평가와 주식정산·ATM 희석을 현금흐름과 분리했다. 유통사 집중도, 2026년 3분기 가이던스, 미종결 Claros 거래와 특허 소송을 갱신하고 9월 25일 종가 기준 단순 시가총액/최근 12개월 매출을 계산했다. Redwire Corporation은 2026년 2분기 Form 10-Q·실적 발표, 7월 Stalker 주문, 8월 SpaceMD Starfall 계약, 9월 NITE-STAR 선정과 9월 25일 종가를 대조했다. 인수에 따른 Defense Tech 성장과 Space 매출 보합, 확정 계약잔고·book-to-bill, 손실·현금흐름, ATM 및 우선주 전환에 따른 주식 희석, 재무보고 통제의 중대한 취약점을 반영했다. 다수공급자 IDIQ 계약 한도를 확정 매출과 구분하고 기준일 시가총액 및 단순 EV/TTM Sales를 계산했다. `npm run check:content` 통과(기존 경고 12건, Redwire 원고 경고 없음), `npm run format:check` 및 `git diff --check` 통과. 콘텐츠 변경이므로 테스트와 빌드는 생략했다. POET Technologies는 2026년 2분기 IFRS 공시, 주문 취소·신규 주문 발표, 9월 CIOE 업데이트와 9월 25일 종가를 대조했습니다. Celestial AI 주문 취소, Lumilens 주문액과 잠재 구매 규모의 차이, 매출·현금흐름, 워런트·RSU 희석을 반영하고 기준일 시가총액 및 TTM 매출 배수를 다시 계산했습니다. `npm run check:content` 통과(기존 경고 12건, POET 원고 경고 없음), `npm run format:check` 및 `git diff --check` 통과. 공시 수치와 주문 상태, 산식을 다시 대조했습니다. 콘텐츠 변경이므로 테스트와 빌드는 실행하지 않았습니다. 나머지 글의 검증일은 출처를 글별로 확인한 경우에만 추가합니다. 기준일을 확인할 수 없는 글은 별도 수동 검토로 분리합니다.


2026-09-29 후속 구현: NuScale Power 보고서를 2026년 2분기 Form 10-Q·실적 발표, 2025년 연간 실적 발표, 9월 1일 제조 발표와 9월 25일 종가 기준으로 갱신했다. updatedDate·verifiedDate(2026-09-29), dataAsOf(2026-09-25)를 추가하고 77MWe SDA와 개별 발전소 인허가의 차이, TVA 협력은 비구속 단계로 구분했다. Doicești는 조건부 FID로 정정하고 SNN의 7월 업데이트와 9월 공개된 정부 점검 보고서의 조건 미이행·20개월 지연·65억 달러 프로젝트 비용 추정 및 JV 거버넌스 지적을 추가했다. 정부 보고서의 모듈 시나리오와 최종 공급계약을 구분하고 SNN 경영진의 이견도 함께 기록했다. ENTRA1 PMA의 단계별 기여금·NPM 1기당 공시 금액과 상반기 지급액, 영업현금흐름의 일회성 요인을 구분했다. ATM 발행 후 경제적 지분 수·현금·투자자산·TTM 매출로 시가총액과 간이 EV/Sales를 다시 계산하고 기준일 차이를 명시했다. npm run check:content 통과(기존 경고 12건, NuScale 원고 경고 없음), npm run format:check 및 git diff --check 통과. 콘텐츠 변경이므로 테스트와 빌드는 생략했다.

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

2026-09-28 후속 구현: Coherent 리포트에 updatedDate·verifiedDate(2026-09-28), dataAsOf(2026-09-25)를 추가했다. FY2026 Form 10-K·Q4 실적 발표, 9월 21일 PhotonLink 발표, 8월 17일 SiC 샘플링 발표와 9월 25일 종가를 대조했다. Datacenter & Communications 매출 증가를 AI 데이터센터 단독 매출로 표현하지 않고, FY2025 보고부문 재편 및 비공개 고객 식별 한계를 명시했다. NVIDIA의 구매 약정과 20억 달러 보통주 투자를 구분하고 PhotonLink 예상 매출 램프를 확정 실적과 분리했다. 영업현금흐름에서 유형자산 취득액을 뺀 단순 현금흐름과 기준일 시가총액·EV·배수를 재계산했다. npm run check:content 통과(기존 경고 12건, Coherent 경고 없음), npm run format:check 및 git diff --check 통과. 독립 검토에서 수치·날짜·주요 표현 오류가 발견되지 않았다. 콘텐츠 변경이므로 테스트와 빌드는 실행하지 않았다.

2026-09-28 후속 구현: ASE Technology 리포트에 updatedDate·verifiedDate(2026-09-28), dataAsOf(2026-09-25)를 추가했다. 2026년 2분기 Form 6-K, 8월 월간 매출, FY2025 연간·상반기 실적과 9월 25일 NYSE 종가를 대조했다. ATM·EMS 실적과 별도 고객 집중 기준, 상반기 영업현금흐름·유형자산 지출, 장비 투자액을 반영하고 미공개 AI 고객별 매출·CoWoS 외주 물량 주장을 제거했다. ADS당 희석 EPS로 간이 TTM EPS $0.847과 P/E 약 52.3배를 계산하고 기간별 환산 차이 및 미감사 수치의 한계를 명시했다. `npm run check:content` 통과(기존 문서 경고 12건, ASE 원고 경고 없음), `git diff --check` 통과. `npm run format:check`는 실행 준비 단계의 도구 오류로 완료하지 못했다. 산술과 공시 기준을 수동 재검토했다. 콘텐츠 변경이므로 테스트와 빌드는 실행하지 않았다.

2026-09-28 후속 구현: IREN 리포트를 FY2026 10-K 및 8월 실적 발표, 7월 신규 AI 계약 발표, 9월 25일 종가 기준으로 갱신하고 updatedDate·verifiedDate(2026-09-28), dataAsOf(2026-09-25)를 기록했다. FY2026 GAAP 매출에서 채굴 매출 비중이 여전히 약 82%임을 분리해 쓰고, 순손실과 비현금 손상차손·조정 EBITDA를 함께 반영했다. 계약 TCV, 계약 ARR, 운영 ARR 및 GAAP 매출을 구분하고 미공개 연구소 계약가를 추정하지 않았다. 선급금에 의존한 영업현금흐름, 제한성 현금, 부채·자본지출 약정, ATM 주식발행과 NVIDIA 조건부 매수권을 위험에 반영했다. 9월 25일 종가·8월 14일 주식 수·6월 말 부채와 자유현금으로 단순 시가총액·EV·EV/Sales를 다시 계산하고 기준일 차이와 비완전희석 한계를 명시했다. `npm run check:content` 통과(기존 문서 경고 12건, IREN 원고 경고 없음), `git diff --check` 통과. `npm run format:check`는 실행 준비 단계 도구 오류로 완료하지 못했다. 테스트와 빌드는 콘텐츠 변경이어서 생략했다.

2026-09-28 후속 구현: Marvell 리포트를 FY2027 2분기 10-Q·실적 발표, FY2026 10-K, 9월 25일 종가 기준으로 갱신하고 updatedDate·verifiedDate(2026-09-28), dataAsOf(2026-09-25)를 기록했다. FY2026 데이터센터 비중과 FY2027 상반기·2분기 성장률, non-GAAP와 GAAP 차이, 인수·상각, 현금흐름·차입금을 반영했다. 비공개 고객 매출은 추정하지 않고 FY2026 상위 10개 고객 집중도와 NVIDIA 우선주 전환, 사후 발행 고객 워런트를 희석 위험으로 구분했다. 9월 25일 종가와 Q3 희석주식 가이던스, FY27 상반기 TTM 매출로 간이 EV/Sales를 계산하고 각 기준일·한계를 명시했다. npm run check:content 통과(기존 문서 경고 12건, MRVL 원고 경고 없음), git diff --check 통과. npm run format:check는 실행 준비 단계의 도구 오류로 완료하지 못했다. 콘텐츠 변경이므로 테스트와 빌드는 생략했다.

2026-09-28 후속 구현: Credo 리포트를 FY2027 1분기 10-Q·실적 발표, FY2026 10-K, DustPhotonics 인수 공시와 9월 25일 종가 기준으로 갱신하고 updatedDate·verifiedDate(2026-09-28), dataAsOf(2026-09-25)를 기록했다. Q1 매출 479.0M과 AEC가 증가분의 90% 이상을 차지한 사실, 익명 계약 고객·최종 고객 집중 기준, RPO 4.2M, 인수대가 1.251B와 순현금 지출 735.6M, 운전자본·SBC·생산능력 예치금을 반영했다. FY2026 ATM 조달과 Amazon 고객 워런트의 전량 행사·3.8M 순발행을 구분하고, 8월 25일 주식 수·9월 25일 주가 기준 간이 EV/TTM Sales를 산출해 기준일 차이를 밝혔다. npm run check:content 통과(기존 문서 경고 12건, Credo 원고 경고 없음), git diff --check 통과. npm run format:check는 실행 준비 단계의 도구 오류로 시작하지 못했다. 콘텐츠 변경이므로 테스트와 빌드는 생략했다.

2026-09-29 후속 구현: Bloom Energy 리포트를 FY2026 2분기 Form 10-Q·실적 발표, FY2025 Form 10-K, Oracle 계약 발표, Brookfield 2분기 보고서와 9월 25일 종가 기준으로 갱신하고 updatedDate·verifiedDate(2026-09-29), dataAsOf(2026-09-25)를 기록했다. 익명 고객 집중과 공개 RPO의 범위, 현금흐름에서 고객 예치금이 차지하는 영향, 미수 관세 환급, 보증·성능보증 노출, 전환사채·Oracle 워런트 희석을 반영했다. 최대 2.8GW Oracle 협약과 Brookfield의 최대 250억 달러 투자 프레임워크를 확정 매출과 구분하고, 기준일 주가·공시 주식 수·현금·차입금으로 EV/TTM Sales를 다시 계산했다. npm run check:content 통과(기존 문서 경고 12건, Bloom Energy 원고 경고 없음), git diff --check 통과. npm run format:check는 실행 준비 단계의 도구 초기화 오류로 시작하지 못했다. 콘텐츠 변경이므로 테스트와 빌드는 생략했다.
