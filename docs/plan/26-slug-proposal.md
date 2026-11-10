# 26번 비ASCII slug 목록

2026-11-10 기준으로 `slug` 없이 한글 경로에서 주소가 만들어지는 글 92편(Semiconductor 54, Reports 34, ETF 4)의 영문 `slug` 목록입니다. 2026-11-10에 이 목록대로 적용했습니다.

## 명명 규칙

- 공통: 소문자 영문·숫자·하이픈만 씁니다. 제목의 뜻을 짧게 영어로 옮기고, 설명형 부제("왜 ~할까?")는 뺍니다.
- Semiconductor: 상위 경로(`semiconductor/1--10/`)는 그대로 두고 마지막 부분만 `번호-영문`으로 바꿉니다. 같은 폴더의 영문 제목 글(`10-dram-nand-ssd` 등)이 이미 이 형태이므로 연재 안에서 모양이 맞춰집니다.
- Reports: 기존 Reports slug(`reports/arm-holdings-investment-research`)처럼 날짜 폴더 없이 `reports/주제`로 둡니다. 종목 리포트는 `회사명-investment-research`, 주제 리포트는 주제명만 씁니다. 한글 폴더명(`25년-12월`)이 주소에서 빠집니다.
- ETF: 번호를 유지해 `etf/basics/번호-영문`으로 둡니다.

## 적용 방법

- 각 글 frontmatter에 `slug`를 추가하고, 이전 주소를 `src/data/postRedirects.mjs`에 등록해 리디렉션 페이지를 만듭니다. 기존 56편과 같은 방식입니다.
- 카테고리별로 커밋을 나눕니다(ETF → Reports → Semiconductor).
- 적용 후 `check:content`의 비ASCII 경고 92건이 0건이 되면 6단계(경고를 오류로 승격)를 판단합니다.

## 제안 목록

### Semiconductor (54편)

| 제목 | 현재 주소 | 제안 slug |
|---|---|---|
| 1. 반도체(semiconductor) | `/blog/semiconductor/1--10/1-반도체-semiconductor` | `semiconductor/1--10/1-semiconductor` |
| 2. 트랜지스터(Transistor) | `/blog/semiconductor/1--10/2-트랜지스터-transistor` | `semiconductor/1--10/2-transistor` |
| 3. 공정(전공정/후공정) | `/blog/semiconductor/1--10/3-공정-전공정-후공정` | `semiconductor/1--10/3-front-end-and-back-end-process` |
| 4. 노광 (Lithography) | `/blog/semiconductor/1--10/4-노광-lithography` | `semiconductor/1--10/4-lithography` |
| 5. 파운드리 / 팹리스 / IDM | `/blog/semiconductor/1--10/5-반도체-산업-생태계-파운드리-팹리스-idm` | `semiconductor/1--10/5-foundry-fabless-idm` |
| 6. 웨이퍼(Wafer) | `/blog/semiconductor/1--10/6-웨이퍼-wafer` | `semiconductor/1--10/6-wafer` |
| 7. 다이(Die) | `/blog/semiconductor/1--10/7-다이-die` | `semiconductor/1--10/7-die` |
| 8. 패키징(Packaging) | `/blog/semiconductor/1--10/8-패키징-packaging` | `semiconductor/1--10/8-packaging` |
| 12. 공정 노드 (5nm / 3nm / 18A 등) | `/blog/semiconductor/11--20/12-공정-노드-process-node` | `semiconductor/11--20/12-process-node` |
| 13. AI 반도체 구조 — 인터포저(Interposer) | `/blog/semiconductor/11--20/13-인터포저-interposer` | `semiconductor/11--20/13-interposer` |
| 14. HBM + 인터포저 + GPU의 전체 구조 | `/blog/semiconductor/11--20/14-hbm--인터포저--gpu의-전체-구조` | `semiconductor/11--20/14-hbm-interposer-gpu-structure` |
| 15. 트랜지스터 구조 — FinFET vs GAAFET | `/blog/semiconductor/11--20/15-트랜지스터-구조---finfet-vs-gaafet` | `semiconductor/11--20/15-finfet-vs-gaafet` |
| 16. 반도체 공정 장비 — 포토(노광), 식각, 증착 | `/blog/semiconductor/11--20/16-반도체-공정-장비--포토노광-식각-증착` | `semiconductor/11--20/16-photo-etch-deposition-equipment` |
| 17. 클린룸(Clean Room) | `/blog/semiconductor/11--20/17-클린룸-clean-room` | `semiconductor/11--20/17-clean-room` |
| 18. 반도체 가격 구조 — 수율(Yield) | `/blog/semiconductor/11--20/18-수율-yield` | `semiconductor/11--20/18-yield` |
| 20. 버스(Bus)와 대역폭(Bandwidth) | `/blog/semiconductor/11--20/20-버스bus와-대역폭bandwidth` | `semiconductor/11--20/20-bus-and-bandwidth` |
| 21. 메모리 계층 구조 (Memory Hierarchy) | `/blog/semiconductor/21--30/21-메모리-계층-구조-memory-hierarchy` | `semiconductor/21--30/21-memory-hierarchy` |
| 22. 클럭(Clock)과 주파수(Frequency) | `/blog/semiconductor/21--30/22-클럭clock과-주파수frequency` | `semiconductor/21--30/22-clock-and-frequency` |
| 23. 열(Heat) & TDP — 반도체는 왜 뜨거워지는가? | `/blog/semiconductor/21--30/23-열heat--tdp` | `semiconductor/21--30/23-heat-and-tdp` |
| 24. 트랜지스터의 동작 원리 — 스위치가 어떻게 켜지고 꺼지는가? | `/blog/semiconductor/21--30/24-트랜지스터의-동작-원리` | `semiconductor/21--30/24-how-transistors-work` |
| 25. SRAM vs DRAM — 왜 CPU와 GPU 안에는 SRAM이 있고, 밖에는 DRAM이 있을까? | `/blog/semiconductor/21--30/25-sram-vs-dram---왜-cpu와-gpu-안에는-sram이-있고-밖에는-dram이-있을까` | `semiconductor/21--30/25-sram-vs-dram` |
| 26. 캐시 메모리(Cache) — 왜 CPU 근처에 꼭 있어야 할까? | `/blog/semiconductor/21--30/26-캐시-메모리cache---왜-cpu-근처에-꼭-있어야-할까` | `semiconductor/21--30/26-cache-memory` |
| 27. 미세공정의 한계 — 왜 1nm 아래로 가기 어려울까? | `/blog/semiconductor/21--30/27-미세공정의-한계---왜-1nm-아래로-가기-어려울까` | `semiconductor/21--30/27-limits-of-process-scaling` |
| 28. 반도체 패키징 — 2.5D vs 3D 패키징 | `/blog/semiconductor/21--30/28-반도체-패키징---25d-vs-3d-패키징` | `semiconductor/21--30/28-2-5d-vs-3d-packaging` |
| 29. 3D 칩렛(Chiplet) 구조 — 왜 여러 칩을 나눠 만들까? | `/blog/semiconductor/21--30/29-3d-칩렛chiplet-구조---왜-여러-칩을-나눠-만들까` | `semiconductor/21--30/29-3d-chiplets` |
| 30. 전력 소비의 진짜 원인 — 정적 전력(Leakage) vs 동적 전력(Switching Power) | `/blog/semiconductor/21--30/30-전력-소비의-진짜-원인---정적-전력leakage-vs-동적-전력switching-power` | `semiconductor/21--30/30-static-vs-dynamic-power` |
| 31. CPU vs GPU — 내부 구조가 왜 다를까? | `/blog/semiconductor/31--40/31-cpu-vs-gpu---내부-구조가-왜-다를까` | `semiconductor/31--40/31-cpu-vs-gpu` |
| 32. HBM(High Bandwidth Memory) — AI 시대의 핵심 메모리 | `/blog/semiconductor/31--40/32-hbmhigh-bandwidth-memory---ai-시대의-핵심-메모리` | `semiconductor/31--40/32-hbm` |
| 33. HBM 심화 1: TSV(Through-Silicon Via) | `/blog/semiconductor/31--40/33-hbm-심화-1-tsvthrough-silicon-via` | `semiconductor/31--40/33-hbm-tsv` |
| 34. HBM 심화 2: 왜 HBM은 만들기 어렵고(수율↓), 그래서 공급이 부족해질까? | `/blog/semiconductor/31--40/34-hbm-심화-2-왜-hbm은-만들기-어렵고수율-그래서-공급이-부족해질까` | `semiconductor/31--40/34-hbm-yield-and-supply` |
| 35. HBM 심화 3: HBM3e vs HBM4 — 뭐가 더 업그레이드 된 걸까? | `/blog/semiconductor/31--40/35-hbm-심화-3-hbm3e-vs-hbm4---뭐가-더-업그레이드-된-걸까` | `semiconductor/31--40/35-hbm3e-vs-hbm4` |
| 36. HBM 심화 4: 왜 HBM만 늘린다고 끝이 아닐까? (CoWoS 병목) | `/blog/semiconductor/31--40/36-hbm-심화-4-왜-hbm만-늘린다고-끝이-아닐까-cowos-병목` | `semiconductor/31--40/36-hbm-cowos-bottleneck` |
| 37. 인터커넥트(Interconnect) — 칩 안의 ‘전기 길(배선) | `/blog/semiconductor/31--40/37-인터커넥트interconnect---칩-안의-전기-길배선` | `semiconductor/31--40/37-interconnect` |
| 38. 지연(Delay)과 RC 지연(RC Delay) | `/blog/semiconductor/31--40/38-지연delay과-rc-지연rc-delay` | `semiconductor/31--40/38-rc-delay` |
| 39. 백사이드 전력공급(Backside Power Delivery, PowerVia) | `/blog/semiconductor/31--40/39-백사이드-전력공급backside-power-delivery-powervia` | `semiconductor/31--40/39-backside-power-delivery` |
| 40. 나노시트(Nanosheet) | `/blog/semiconductor/31--40/40-나노시트nanosheet` | `semiconductor/31--40/40-nanosheet` |
| 41. 변동성(Variation) — 왜 똑같이 만들었는데 결과가 다를까? | `/blog/semiconductor/41--50/41-변동성variation---왜-똑같이-만들었는데-결과가-다를까` | `semiconductor/41--50/41-variation` |
| 44. 빈닝(Binning) | `/blog/semiconductor/41--50/44-빈닝binning` | `semiconductor/41--50/44-binning` |
| 45. 테스트(Test) — 왜 반도체는 검사가 그렇게 중요할까? | `/blog/semiconductor/41--50/45-테스트test---왜-반도체는-검사가-그렇게-중요할까` | `semiconductor/41--50/45-test` |
| 46. 프로빙(Probing) / 웨이퍼 테스트(Wafer Test) | `/blog/semiconductor/41--50/46-프로빙probing-웨이퍼-테스트wafer-test` | `semiconductor/41--50/46-wafer-probing` |
| 47. 다이싱(Dicing) — 웨이퍼를 칩으로 자르는 단계 | `/blog/semiconductor/41--50/47-다이싱dicing---웨이퍼를-칩으로-자르는-단계` | `semiconductor/41--50/47-dicing` |
| 48. 다이 어태치(Die Attach) | `/blog/semiconductor/41--50/48-다이-어태치die-attach` | `semiconductor/41--50/48-die-attach` |
| 49. 와이어 본딩(Wire Bonding) | `/blog/semiconductor/41--50/49-와이어-본딩wire-bonding` | `semiconductor/41--50/49-wire-bonding` |
| 50. 플립칩(Flip-Chip) | `/blog/semiconductor/41--50/50-플립칩flip-chip` | `semiconductor/41--50/50-flip-chip` |
| 55. I/O 칩렛 | `/blog/semiconductor/51--60/55-io-칩렛i-o-chiplet` | `semiconductor/51--60/55-io-chiplet` |
| 56. 메모리 컨트롤러(Memory Controller) | `/blog/semiconductor/51--60/56-메모리-컨트롤러memory-controller` | `semiconductor/51--60/56-memory-controller` |
| 61. 메모리 풀링(Memory Pooling) | `/blog/semiconductor/61--70/61-메모리-풀링memory-pooling` | `semiconductor/61--70/61-memory-pooling` |
| 62. 지연시간(Latency) | `/blog/semiconductor/61--70/62-지연시간latency` | `semiconductor/61--70/62-latency` |
| 63. 처리량(Throughput) | `/blog/semiconductor/61--70/63-처리량throughput` | `semiconductor/61--70/63-throughput` |
| 64. 병목(Bottleneck) | `/blog/semiconductor/61--70/64-병목bottleneck` | `semiconductor/61--70/64-bottleneck` |
| 65. 병렬처리(Parallel Processing) | `/blog/semiconductor/61--70/65-병렬처리parallel-processing` | `semiconductor/61--70/65-parallel-processing` |
| 66. 행렬 연산(Matrix Operation) | `/blog/semiconductor/61--70/66-행렬-연산matrix-operation` | `semiconductor/61--70/66-matrix-operations` |
| 67. 텐서(Tensor) | `/blog/semiconductor/61--70/67-텐서tensor` | `semiconductor/61--70/67-tensor` |
| 69. 정밀도(Precision) — FP32, FP16, BF16, FP8 | `/blog/semiconductor/61--70/69-정밀도precision` | `semiconductor/61--70/69-precision` |

### Reports (34편)

| 제목 | 현재 주소 | 제안 slug |
|---|---|---|
| 뉴로모픽 반도체 | `/blog/reports/25년-12월/251202-뉴로모픽-반도체` | `reports/neuromorphic-semiconductors` |
| 실리콘 포토닉스 투자 아이디어 | `/blog/reports/25년-12월/251202-실리콘-포토닉스-투자-아이디어` | `reports/silicon-photonics-investment-ideas` |
| 저전력 메모리 | `/blog/reports/25년-12월/251202-저전력-메모리-분석` | `reports/low-power-memory` |
| 저전력 AI 칩 | `/blog/reports/25년-12월/251202-저전력-ai-칩` | `reports/low-power-ai-chips` |
| WBG 반도체 | `/blog/reports/25년-12월/251202-wbg-반도체` | `reports/wide-bandgap-semiconductors` |
| HBM(High Bandwidth Memory) 개요 | `/blog/reports/25년-12월/251203-hbmhigh-bandwidth-memory-개요` | `reports/hbm-overview` |
| 반도체용 CNT(탄소 나노 튜브) | `/blog/reports/25년-12월/251208-반도체용-cnt탄소-나노튜브-기술-종합-분석-리포트` | `reports/carbon-nanotubes-for-semiconductors` |
| HVDC 기술 개요 | `/blog/reports/25년-12월/251208-hvdc-기술-개요` | `reports/hvdc-technology-overview` |
| 반도체 유리기판 | `/blog/reports/25년-12월/251212-반도체-유리기판` | `reports/glass-substrates` |
| 미국 통화지표(M0, M1, M2 등 Monetary Aggregates) | `/blog/reports/25년-12월/251212-us-monetary-aggregates` | `reports/us-monetary-aggregates` |
| Navitas Semiconductor | `/blog/reports/25년-12월/251217-nvts-navitas-semiconductor` | `reports/navitas-semiconductor-investment-research` |
| Poet Technologies | `/blog/reports/25년-12월/251217-poet-poet-technologies` | `reports/poet-technologies-investment-research` |
| Redwire Corporation | `/blog/reports/25년-12월/251217-rdw-redwire` | `reports/redwire-investment-research` |
| Credo Technology | `/blog/reports/25년-12월/251221-crdo-credo-technology` | `reports/credo-technology-investment-research` |
| IREN | `/blog/reports/25년-12월/251221-iren-bitcoin-hpc` | `reports/iren-investment-research` |
| Rocket Lab | `/blog/reports/25년-12월/251221-rklb-rocket-lab` | `reports/rocket-lab-investment-research` |
| NuScale Power | `/blog/reports/25년-12월/251221-smr-nuscale-power` | `reports/nuscale-power-investment-research` |
| Vertiv Holdings | `/blog/reports/25년-12월/251221-vrt-vertiv-holdings` | `reports/vertiv-holdings-investment-research` |
| Marvell Technology | `/blog/reports/25년-12월/251230-mrvl-marvell-technology` | `reports/marvell-technology-investment-research` |
| 반도체 후공정 병목 | `/blog/reports/26년-1월/260116-반도체-후공정-병목_-기술-이슈를-넘어-구조적-변화의-핵심` | `reports/back-end-process-bottleneck` |
| OSAT와 파운드리의 첨단 패키징 전략 비교 | `/blog/reports/26년-1월/260116-osat와-파운드리의-첨단-패키징-전략-비교_-ase-amkor-tsmc의-산업-구조-분석` | `reports/osat-vs-foundry-advanced-packaging` |
| AI·HBM 시대의 검사 공정 | `/blog/reports/26년-1월/260122-aihbm-시대의-검사-공정_-병목으로-부상한-이유와-투자-시사점` | `reports/ai-hbm-test-process` |
| HBM 본딩 기술 진화와 장비 공급망 재편 | `/blog/reports/26년-1월/260122-hbm-본딩-기술-진화와-장비-공급망-재편_-중장기-투자-관점-분석` | `reports/hbm-bonding-equipment-supply-chain` |
| MSR 밸류체인별 유망 상장기업 | `/blog/reports/26년-2월/260210-msr-밸류체인별-유망-상장기업` | `reports/msr-value-chain-listed-companies` |
| MSR 투자 리서치 | `/blog/reports/26년-2월/260210-msr-투자-리서치` | `reports/msr-investment-research` |
| 용융염원전(MSR) 기술 주장 팩트체크 | `/blog/reports/26년-2월/260210-msr용융염원전-기술-주장-팩트체크` | `reports/msr-fact-check` |
| 소듐냉각고속로(SFR) 투자 개요 | `/blog/reports/26년-2월/260211-소듐냉각고속로sfr-투자-개요` | `reports/sfr-investment-overview` |
| 소듐냉각고속로(SFR) 투자 관점 주요 주장 팩트체크 | `/blog/reports/26년-2월/260211-소듐냉각고속로sfr-투자-관점-주요-주장-팩트체크` | `reports/sfr-fact-check` |
| 소듐냉각고속로(SFR) 투자 리서치 | `/blog/reports/26년-2월/260211-소듐냉각고속로sfr-투자-리서치` | `reports/sfr-investment-research` |
| ASE Technology Holding ADR | `/blog/reports/26년-2월/260225-ase-technology-holding-adr_-패키징-병목-시대의-투자-매력-분석` | `reports/ase-technology-investment-research` |
| Coherent | `/blog/reports/26년-2월/260226-coherent-corp-투자-리서치` | `reports/coherent-investment-research` |
| Centrus Energy | `/blog/reports/26년-2월/260228-centrus-energy-leu` | `reports/centrus-energy-investment-research` |
| HBF(High Bandwidth Flash) | `/blog/reports/26년-2월/260228-hbf-투자-리서치` | `reports/hbf-investment-research` |
| Lumentum Holdings | `/blog/reports/26년-2월/260228-lumentum-holdings-nasdaq-lite` | `reports/lumentum-holdings-investment-research` |

### ETF (4편)

| 제목 | 현재 주소 | 제안 slug |
|---|---|---|
| 1. 왜 ETF에 투자해야 하는가 | `/blog/etf/basics/1-왜-etf에-투자해야-하는가` | `etf/basics/1-why-invest-in-etfs` |
| 2. ETF란 무엇인가 | `/blog/etf/basics/2-etf란-무엇인가` | `etf/basics/2-what-is-an-etf` |
| 3. ETF의 종류 | `/blog/etf/basics/3-etf의-종류` | `etf/basics/3-types-of-etfs` |
| 4. ETF를 읽는 방법 | `/blog/etf/basics/4-etf를-읽는-방법` | `etf/basics/4-how-to-read-an-etf` |
