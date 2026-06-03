# 미국 상장 ETF 분류 및 Markdown 글 작성 기준

이 문서는 미국 주식시장에 상장된 ETF만을 대상으로 한다.  
입력으로 ETF 티커, ETF 이름, 또는 이미 작성된 ETF 분석 Markdown 보고서가 주어졌을 때, Codex가 해당 ETF를 일관된 기준으로 폴더 분류하고 글을 정리하기 위한 기준이다.

---

## 1. 전제 조건

분류 대상은 **미국 주식시장에 상장된 ETF**로 한정한다.

따라서 아래 항목은 기본 전제로 둔다.

```text
대상 시장: 미국 상장 ETF
기본 통화: USD
기본 거래소: NYSE Arca, Nasdaq, Cboe BZX 등 미국 거래소
분류 목적: ETF를 투자 성격별 폴더로 정리하고, 각 ETF별 Markdown 글을 작성
```

ETF가 미국 상장 상품이 아니거나 ETF가 아닌 ETN, CEF, 일반 펀드일 가능성이 있으면 `기타/확인필요`로 분류한다.

---

## 2. 가장 중요한 원칙

ETF 이름에 들어간 단어만 보고 분류하지 않는다.

아래 순서로 판단한다.

```text
1. 실제 투자 목적
2. 실제 추종 대상 또는 운용 전략
3. 수익이 발생하는 구조
4. 주요 보유 자산
5. 설명에 반복적으로 등장하는 핵심 키워드
6. ETF 이름에 포함된 지수명 또는 테마명
```

예를 들어 이름에 `S&P 500`이 들어가도 모두 같은 폴더에 넣지 않는다.

```text
IVV  → S&P 500을 그대로 추종하는 대표지수 ETF
GPIX → S&P 500 주식 + 옵션 프리미엄을 결합한 인컴형 ETF
```

따라서 IVV와 GPIX는 둘 다 이름에 S&P 500이 들어가지만 최종 분류는 다르다.

```text
IVV  → ETF/대표지수/S&P500/Market Cap Weight
GPIX → ETF/배당·인컴/Option Income/S&P500
```

---

## 3. 최상위 폴더 구조

미국 상장 ETF는 아래 폴더 중 하나로 분류한다.

```text
ETF
├─ 대표지수
├─ 섹터
├─ 테마
├─ 스타일·팩터
├─ 배당·인컴
├─ 채권
├─ 원자재
├─ 통화
├─ 부동산·리츠
├─ 레버리지·인버스
├─ 액티브
├─ 멀티에셋
└─ 기타
```

---

## 4. 분류 우선순위

ETF가 여러 성격을 동시에 가지면 아래 우선순위를 적용한다.

```text
1순위: 레버리지·인버스
2순위: 자산군
3순위: 수익 구조
4순위: 대표지수
5순위: 섹터
6순위: 테마
7순위: 스타일·팩터
8순위: 액티브 여부
9순위: 기타
```

중요:

```text
레버리지·인버스 구조가 있으면 무조건 레버리지·인버스가 최우선이다.
옵션 프리미엄, 커버드콜, BuyWrite, Premium Income 구조가 있으면 대표지수보다 배당·인컴을 우선한다.
채권, 원자재, 통화, 리츠처럼 자산군이 명확하면 자산군을 우선한다.
대표지수를 단순 추종하는 경우에만 대표지수 폴더에 넣는다.
```

---

## 5. 대표지수 ETF 분류 기준

대표지수 ETF는 넓은 시장을 단순 추종하는 ETF이다.  
일반적으로 패시브 운용이며, 특정 옵션 전략이나 고배당 전략이 결합되어 있지 않아야 한다.

```text
대표지수
├─ S&P500
│  ├─ Market Cap Weight
│  ├─ Equal Weight
│  ├─ Growth
│  ├─ Value
│  └─ Low Volatility
├─ Nasdaq-100
├─ Dow Jones
├─ Russell 1000
├─ Russell 2000
├─ Total Market
└─ Global ex-US
```

### 대표지수/S&P500/Market Cap Weight

아래 조건을 만족하면 이 폴더로 분류한다.

```text
S&P 500 지수를 단순 추종
시가총액 가중 방식
옵션 프리미엄 전략 없음
레버리지·인버스 아님
고배당·퀄리티·성장·가치 등 별도 팩터 전략 없음
```

예시:

```text
SPY → ETF/대표지수/S&P500/Market Cap Weight
IVV → ETF/대표지수/S&P500/Market Cap Weight
VOO → ETF/대표지수/S&P500/Market Cap Weight
SPLG → ETF/대표지수/S&P500/Market Cap Weight
```

### 대표지수/S&P500/Equal Weight

```text
RSP → ETF/대표지수/S&P500/Equal Weight
```

### 대표지수/S&P500/Growth 또는 Value

```text
SPYG → ETF/대표지수/S&P500/Growth
SPYV → ETF/대표지수/S&P500/Value
IVW  → ETF/대표지수/S&P500/Growth
IVE  → ETF/대표지수/S&P500/Value
```

### 대표지수/Nasdaq-100

아래 조건을 만족하면 이 폴더로 분류한다.

```text
Nasdaq-100 Index 또는 NDX를 단순 추종
레버리지·인버스 아님
옵션 인컴 전략 아님
```

예시:

```text
QQQ  → ETF/대표지수/Nasdaq-100
QQQM → ETF/대표지수/Nasdaq-100
```

주의:

이름에 `Nasdaq`이 들어간다고 해서 무조건 Nasdaq-100으로 분류하지 않는다.

```text
BLCN → ETF/테마/Blockchain
CIBR → ETF/테마/Cybersecurity
GPIQ → ETF/배당·인컴/Option Income/Nasdaq-100
JEPQ → ETF/배당·인컴/Option Income/Nasdaq-100
TQQQ → ETF/레버리지·인버스/Leveraged Long/Nasdaq-100
SQQQ → ETF/레버리지·인버스/Leveraged Inverse/Nasdaq-100
```

---

## 6. 배당·인컴 ETF 분류 기준

배당, 이자, 옵션 프리미엄, 커버드콜, 현금흐름 창출이 핵심 목적이면 `배당·인컴`으로 분류한다.

```text
배당·인컴
├─ Dividend Growth
├─ High Dividend
├─ Quality Dividend
├─ Covered Call
├─ Option Income
│  ├─ S&P500
│  ├─ Nasdaq-100
│  ├─ Russell 2000
│  └─ Single Stock
├─ Premium Income
├─ Preferred Stock
└─ Multi-Asset Income
```

### Option Income / Premium Income으로 분류하는 경우

아래 키워드가 있으면 대표지수보다 `배당·인컴`을 우선한다.

```text
Premium Income
Covered Call
BuyWrite
Option Income
Equity Premium Income
Call Option
ELN
월배당
옵션 프리미엄
커버드콜
```

예시:

```text
GPIX → ETF/배당·인컴/Option Income/S&P500
GPIQ → ETF/배당·인컴/Option Income/Nasdaq-100
JEPI → ETF/배당·인컴/Option Income/US Large Cap
JEPQ → ETF/배당·인컴/Option Income/Nasdaq-100
XYLD → ETF/배당·인컴/Covered Call/S&P500
QYLD → ETF/배당·인컴/Covered Call/Nasdaq-100
RYLD → ETF/배당·인컴/Covered Call/Russell 2000
```

### Dividend Growth로 분류하는 경우

```text
SCHD → ETF/배당·인컴/Dividend Growth
VIG  → ETF/배당·인컴/Dividend Growth
DGRO → ETF/배당·인컴/Dividend Growth
```

### High Dividend로 분류하는 경우

```text
VYM  → ETF/배당·인컴/High Dividend
HDV  → ETF/배당·인컴/High Dividend
SPYD → ETF/배당·인컴/High Dividend/S&P500
```

---

## 7. 레버리지·인버스 ETF 분류 기준

레버리지 또는 인버스 ETF는 항상 최우선으로 분류한다.

```text
레버리지·인버스
├─ Leveraged Long
├─ Inverse
├─ Leveraged Inverse
└─ Single Stock Leveraged
```

판단 키워드:

```text
2x
3x
Ultra
UltraPro
Daily Bull
Daily Bear
Leveraged
Inverse
Short
-1x
-2x
-3x
Single Stock
```

예시:

```text
TQQQ → ETF/레버리지·인버스/Leveraged Long/Nasdaq-100
SQQQ → ETF/레버리지·인버스/Leveraged Inverse/Nasdaq-100
UPRO → ETF/레버리지·인버스/Leveraged Long/S&P500
SPXU → ETF/레버리지·인버스/Leveraged Inverse/S&P500
SOXL → ETF/레버리지·인버스/Leveraged Long/Semiconductor
SOXS → ETF/레버리지·인버스/Leveraged Inverse/Semiconductor
TSLL → ETF/레버리지·인버스/Single Stock Leveraged/Tesla
```

---

## 8. 섹터 ETF 분류 기준

GICS 섹터 또는 전통 산업군이 명확하면 섹터 ETF로 분류한다.

```text
섹터
├─ Technology
├─ Communication Services
├─ Consumer Discretionary
├─ Consumer Staples
├─ Healthcare
├─ Financials
├─ Industrials
├─ Energy
├─ Materials
├─ Utilities
└─ Real Estate
```

예시:

```text
XLK → ETF/섹터/Technology
VGT → ETF/섹터/Technology
XLV → ETF/섹터/Healthcare
XLF → ETF/섹터/Financials
XLE → ETF/섹터/Energy
XLI → ETF/섹터/Industrials
```

주의:

반도체, AI, 클라우드, 사이버보안처럼 기술 섹터 안에 있지만 투자 스토리가 더 구체적인 경우에는 `테마`로 분류할 수 있다.

---

## 9. 테마 ETF 분류 기준

구조적 성장 스토리, 산업 변화, 특정 기술 트렌드에 투자하면 테마 ETF로 분류한다.

```text
테마
├─ AI
├─ Semiconductor
├─ Blockchain
├─ Digital Assets
├─ Cybersecurity
├─ Cloud
├─ Robotics
├─ Automation
├─ Clean Energy
├─ Nuclear
├─ Uranium
├─ Battery
├─ Electric Vehicles
├─ Space
├─ Defense Tech
├─ Fintech
├─ Genomics
├─ Biotech Innovation
├─ Water
├─ Infrastructure
└─ Food & Agriculture
```

예시:

```text
BLCN → ETF/테마/Blockchain
BLOK → ETF/테마/Blockchain
SMH  → ETF/테마/Semiconductor
SOXX → ETF/테마/Semiconductor
CIBR → ETF/테마/Cybersecurity
BOTZ → ETF/테마/Robotics
ICLN → ETF/테마/Clean Energy
URA  → ETF/테마/Uranium
```

---

## 10. 스타일·팩터 ETF 분류 기준

투자 스타일이나 팩터가 핵심이면 이 폴더로 분류한다.

```text
스타일·팩터
├─ Growth
├─ Value
├─ Quality
├─ Momentum
├─ Low Volatility
├─ Minimum Volatility
├─ Size
└─ Multi-Factor
```

예시:

```text
VUG  → ETF/스타일·팩터/Growth
VTV  → ETF/스타일·팩터/Value
QUAL → ETF/스타일·팩터/Quality
MTUM → ETF/스타일·팩터/Momentum
USMV → ETF/스타일·팩터/Minimum Volatility
```

단, `S&P 500 Growth`처럼 특정 대표지수 안에서 파생된 스타일 ETF는 아래처럼 분류한다.

```text
SPYG → ETF/대표지수/S&P500/Growth
```

---

## 11. 채권 ETF 분류 기준

채권 ETF는 자산군이 명확하므로 대표지수나 인컴보다 채권을 우선한다.

```text
채권
├─ Treasury
│  ├─ Short-Term
│  ├─ Intermediate-Term
│  └─ Long-Term
├─ Corporate
│  ├─ Investment Grade
│  └─ High Yield
├─ Municipal
├─ Inflation-Protected
├─ Aggregate Bond
├─ International Bond
└─ Emerging Market Bond
```

예시:

```text
BND → ETF/채권/Aggregate Bond
AGG → ETF/채권/Aggregate Bond
TLT → ETF/채권/Treasury/Long-Term
IEF → ETF/채권/Treasury/Intermediate-Term
SHY → ETF/채권/Treasury/Short-Term
LQD → ETF/채권/Corporate/Investment Grade
HYG → ETF/채권/Corporate/High Yield
TIP → ETF/채권/Inflation-Protected
```

---

## 12. 원자재 ETF 분류 기준

금, 은, 원유, 천연가스, 농산물 등 원자재 가격에 투자하면 원자재로 분류한다.

```text
원자재
├─ Gold
├─ Silver
├─ Broad Commodity
├─ Oil
├─ Natural Gas
├─ Agriculture
├─ Metals
└─ Carbon Credits
```

예시:

```text
GLD → ETF/원자재/Gold
IAU → ETF/원자재/Gold
SLV → ETF/원자재/Silver
DBC → ETF/원자재/Broad Commodity
USO → ETF/원자재/Oil
UNG → ETF/원자재/Natural Gas
```

---

## 13. 부동산·리츠 ETF 분류 기준

REITs 또는 부동산 관련 주식에 투자하면 부동산·리츠로 분류한다.

```text
부동산·리츠
├─ U.S. REITs
├─ Global REITs
├─ Residential
├─ Commercial
├─ Data Center REITs
├─ Industrial REITs
└─ Mortgage REITs
```

예시:

```text
VNQ  → ETF/부동산·리츠/U.S. REITs
SCHH → ETF/부동산·리츠/U.S. REITs
REET → ETF/부동산·리츠/Global REITs
```

---

## 14. 액티브 ETF 분류 기준

액티브 ETF라는 사실만으로 무조건 액티브 폴더에 넣지는 않는다.  
투자 목적이 더 명확하면 해당 목적을 우선한다.

예시:

```text
ARKK → ETF/액티브/Innovation
JEPI → ETF/배당·인컴/Option Income/US Large Cap
GPIX → ETF/배당·인컴/Option Income/S&P500
```

즉, `Active`는 보조 정보로 기록하되, 분류는 투자 목적을 우선한다.

---

## 15. 입력 파일이 긴 분석 보고서일 때 판단 방법

입력 파일이 ETF 분석 보고서 형태라면 아래 부분을 우선 읽는다.

```text
1. 제목
2. 요약
3. 기본 정보
4. 추종 지수
5. 운용 방식
6. 배당 정보
7. 옵션 전략 또는 커버드콜 전략
8. 포트폴리오 구성
9. 결론
```

보고서 전체를 다 읽기보다, 분류에 직접 필요한 정보를 먼저 찾는다.

### 분류에 필요한 핵심 필드

```yaml
ticker:
name:
listed_market:
asset_class:
index_or_strategy:
is_passive:
is_active:
uses_options:
uses_leverage:
uses_inverse:
income_focus:
main_exposure:
final_folder:
confidence:
needs_review:
```

---

## 16. YAML 분류 출력 형식

각 ETF에 대해 먼저 YAML 분류 정보를 만든다.

```yaml
ticker: ETF 티커
name: ETF 이름
listed_market: US
asset_class: Equity | Bond | Commodity | Currency | REIT | Multi-Asset | Other
index_or_strategy: 추종 지수 또는 핵심 전략
folder: ETF/상위폴더/하위폴더
category: 대분류
subcategory: 중분류
is_passive: true | false | unknown
is_active: true | false | unknown
uses_options: true | false | unknown
uses_leverage: true | false | unknown
uses_inverse: true | false | unknown
income_focus: true | false | unknown
reason: 분류 이유
confidence: high | medium | low
needs_review: true | false
```

예시:

```yaml
ticker: IVV
name: iShares Core S&P 500 ETF
listed_market: US
asset_class: Equity
index_or_strategy: S&P 500 Index
folder: ETF/대표지수/S&P500/Market Cap Weight
category: 대표지수
subcategory: S&P500 Market Cap Weight
is_passive: true
is_active: false
uses_options: false
uses_leverage: false
uses_inverse: false
income_focus: false
reason: S&P 500 지수를 시가총액 가중 방식으로 단순 추종하는 패시브 대표지수 ETF이다.
confidence: high
needs_review: false
```

```yaml
ticker: GPIX
name: Goldman Sachs S&P 500 Premium Income ETF
listed_market: US
asset_class: Equity
index_or_strategy: S&P 500 equity exposure with option premium income strategy
folder: ETF/배당·인컴/Option Income/S&P500
category: 배당·인컴
subcategory: Option Income
is_passive: false
is_active: true
uses_options: true
uses_leverage: false
uses_inverse: false
income_focus: true
reason: S&P 500 노출이 있지만 단순 지수 추종 ETF가 아니라 옵션 프리미엄을 활용해 월배당 소득을 추구하는 인컴형 ETF이다.
confidence: high
needs_review: false
```

---

## 17. Markdown 글 작성 형식

각 ETF 글은 아래 구조로 작성한다.

```markdown
# TICKER - ETF 이름

## 한 줄 요약

이 ETF는 ○○에 투자하는 ○○형 ETF이다.

## 기본 분류

| 항목 | 내용 |
|---|---|
| 티커 | TICKER |
| ETF 이름 | ETF 이름 |
| 상장 시장 | 미국 |
| 최종 폴더 | ETF/상위폴더/하위폴더 |
| 대분류 | 대표지수 / 섹터 / 테마 / 배당·인컴 / 채권 / 기타 |
| 핵심 전략 | 추종 지수 또는 운용 전략 |
| 옵션 전략 사용 | 예 / 아니오 / 확인 필요 |
| 레버리지·인버스 | 예 / 아니오 / 확인 필요 |
| 인컴 목적 | 예 / 아니오 / 확인 필요 |

## 어떤 ETF인가?

ETF의 실제 투자 대상과 전략을 설명한다.

## 왜 이 폴더로 분류했나?

분류 이유를 설명한다.

특히 아래 사항을 명확히 쓴다.

```text
이름에 들어간 지수명만 보고 분류하지 않았다.
실제 투자 목적과 수익 구조를 기준으로 분류했다.
```

## 비슷한 ETF

유사 ETF를 2~5개 제시한다.  
확실하지 않으면 `확인 필요`라고 표시한다.

## 주의할 점

아래 중 해당하는 내용을 쓴다.

```text
보수
AUM
거래량
호가 스프레드
추적오차
옵션 전략의 상승 제한
배당 변동성
레버리지 리밸런싱 리스크
섹터 집중도
상장 이력 부족
```

확인되지 않은 수치는 추정하지 않는다.

## 태그

`#ETF` `#미국ETF` `#분류명` `#핵심키워드`
```

---

## 18. 파일명 규칙

ETF 글 파일명은 아래 형식을 사용한다.

```text
TICKER.md
```

예시:

```text
IVV.md
GPIX.md
BLCN.md
QQQ.md
SCHD.md
```

폴더 경로 예시:

```text
ETF/대표지수/S&P500/Market Cap Weight/IVV.md
ETF/배당·인컴/Option Income/S&P500/GPIX.md
ETF/테마/Blockchain/BLCN.md
ETF/대표지수/Nasdaq-100/QQQ.md
ETF/배당·인컴/Dividend Growth/SCHD.md
```

---

## 19. 애매한 경우 처리 규칙

다음 경우에는 `needs_review: true`로 표시한다.

```text
ETF 이름만 있고 설명이 부족한 경우
미국 상장 ETF인지 불명확한 경우
ETF가 아니라 ETN, CEF, 뮤추얼펀드일 가능성이 있는 경우
레버리지·인버스 여부가 의심되지만 명확하지 않은 경우
옵션 전략 사용 여부가 불명확한 경우
이름의 지수명과 실제 전략이 충돌하는 경우
상장폐지 또는 티커 변경 가능성이 있는 경우
```

출력 예시:

```yaml
ticker: UNKNOWN
name: Unknown ETF
listed_market: US
folder: ETF/기타/확인필요
category: 기타
subcategory: 확인필요
reason: 제공된 설명만으로 미국 상장 ETF 여부와 실제 투자 전략을 확정하기 어렵다.
confidence: low
needs_review: true
```

---

## 20. Codex 작업 지시문 예시

Codex에게 아래 지시문을 함께 제공한다.

```text
아래 ETF 티커, ETF 이름, 또는 ETF 분석 Markdown 보고서를 읽고 `미국 상장 ETF 분류 기준.md`에 따라 분류해줘.

중요 규칙:
- 대상은 미국 주식시장에 상장된 ETF만이다.
- ETF 이름에 들어간 단어만 보고 분류하지 말 것.
- 실제 투자 목적, 추종 대상, 수익 구조를 우선할 것.
- S&P 500이 들어가도 단순 지수 추종인지, 옵션 인컴형인지 구분할 것.
- Nasdaq이 들어가도 Nasdaq-100 대표지수 ETF로 단정하지 말 것.
- Premium Income, Covered Call, Option Income, BuyWrite가 있으면 대표지수보다 배당·인컴을 우선할 것.
- 레버리지·인버스 ETF는 최우선으로 레버리지·인버스 폴더에 넣을 것.
- 액티브 여부는 보조 정보로 쓰되, 투자 목적이 명확하면 투자 목적을 우선할 것.
- 확신이 없으면 ETF/기타/확인필요로 분류하고 needs_review: true를 표시할 것.
- 확인되지 않은 운용보수, AUM, 수익률, 배당률, 보유종목은 추정하지 말 것.

출력:
1. YAML 분류 정보
2. Markdown 글 초안
```

---

## 21. 핵심 예시

### IVV

```text
입력:
IVV - iShares Core S&P 500 ETF
```

```yaml
ticker: IVV
folder: ETF/대표지수/S&P500/Market Cap Weight
reason: S&P 500 지수를 단순 추종하는 패시브 대표지수 ETF이다.
confidence: high
needs_review: false
```

### GPIX

```text
입력:
GPIX - Goldman Sachs S&P 500 Premium Income ETF
```

```yaml
ticker: GPIX
folder: ETF/배당·인컴/Option Income/S&P500
reason: S&P 500 노출이 있지만 옵션 프리미엄을 활용한 인컴형 ETF이므로 대표지수가 아니라 배당·인컴으로 분류한다.
confidence: high
needs_review: false
```

### QQQ

```text
입력:
QQQ - Invesco QQQ Trust. Tracks the Nasdaq-100 Index.
```

```yaml
ticker: QQQ
folder: ETF/대표지수/Nasdaq-100
reason: Nasdaq-100 지수를 단순 추종하는 대표지수 ETF이다.
confidence: high
needs_review: false
```

### BLCN

```text
입력:
BLCN - Siren Nasdaq NexGen Economy ETF. Blockchain-related companies.
```

```yaml
ticker: BLCN
folder: ETF/테마/Blockchain
reason: 이름에 Nasdaq이 포함되어 있지만 Nasdaq-100 대표지수 ETF가 아니라 블록체인 관련 기업에 투자하는 테마형 ETF이다.
confidence: high
needs_review: false
```

---

## 22. 최종 판단 문장 템플릿

ETF 글에는 아래 문장 중 하나를 넣는다.

```text
이 ETF는 미국 대표지수를 단순 추종하는 대표지수 ETF로 분류하는 것이 적절하다.
이 ETF는 특정 섹터에 집중 투자하는 섹터 ETF로 분류하는 것이 적절하다.
이 ETF는 구조적 성장 테마에 투자하는 테마형 ETF로 분류하는 것이 적절하다.
이 ETF는 옵션 프리미엄 또는 배당을 통해 현금흐름을 추구하는 배당·인컴 ETF로 분류하는 것이 적절하다.
이 ETF는 채권 자산군에 투자하므로 채권 ETF로 분류하는 것이 적절하다.
이 ETF는 레버리지·인버스 구조가 있으므로 일반 대표지수 ETF와 별도로 관리하는 것이 적절하다.
제공된 설명만으로는 정확한 분류가 어려우므로 확인필요로 분류한다.
```
