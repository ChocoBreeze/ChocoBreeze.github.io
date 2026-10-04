---
title: 'SHNY (MicroSectors Gold 3X Leveraged ETNs)'
description: 'SPDR Gold Shares(GLD)의 하루 가격 변동 3배를 목표로 하는 BMO 무담보 ETN의 구조와 비용, 위험을 정리한다.'
pubDate: '2026-07-23T10:30:00+09:00'
updatedDate: '2026-10-04T00:00:00+09:00'
verifiedDate: '2026-10-04T00:00:00+09:00'
dataAsOf: '2026-10-01T00:00:00+09:00'
ticker: 'SHNY'
issuer: 'Bank of Montreal'
instrumentType: 'ETN'
assetClass: 'Commodity'
strategy: 'Leveraged'
exposure: 'SPDR Gold Shares (GLD)'
leverage: '3x'
incomeStyle: 'None'
categories: 'ETF'
tags: ['ETN', 'SHNY', 'Bank of Montreal', 'Gold', 'Leveraged']
---

# SHNY (MicroSectors Gold 3X Leveraged ETN) 분석

> **분석 기준일: 2026년 10월 4일**
>
> SHNY는 SPDR Gold Shares(GLD)의 하루 가격 변동을 기준으로 비용 차감 전 3배 수익률을 추구하는 Bank of Montreal(BMO)의 상장지수증권(ETN)이다. SHNY 자체는 금이나 GLD 주식을 보유하는 펀드가 아니라 BMO의 무담보 채무증권이며, 원금과 수익은 BMO의 지급 능력에도 달려 있다.

## 분류와 기본 정보

| 항목 | 내용 |
|---|---|
| 사이트 분류 경로 | ETF/Leveraged Inverse/Gold/SHNY |
| 상품 유형 | ETN — 사이트상 ETF 경로는 탐색 분류이며 상품의 법적 형태와 다름 |
| 거래소 / 티커 | NYSE Arca / SHNY |
| 발행사 | Bank of Montreal |
| 기초 상품 | SPDR Gold Shares (GLD) |
| 일일 목표 | GLD 하루 가격 변동의 3배, 비용 차감 전 |
| 최초 거래일 / 발행일 | 2023년 2월 21일 / 2023년 2월 24일 |
| 예정 만기 | 2043년 1월 29일 (BMO가 추가 5년씩 최대 2회 연장 가능) |
| CUSIP | 063679526 |
| 종가 지표값 | 8.08달러 (closing indicative note value, 2026년 10월 1일) |

SHNY는 레버리지 상품이므로 Leveraged Inverse 경로에 두고, 메타데이터에는 실제 상품 유형인 `ETN`을 기록했다. GLD는 금괴 가격을 반영하도록 설계된 ETF지만 SHNY 투자자는 금괴나 GLD 지분을 직접 소유하지 않는다. BMO가 계산하는 지표값은 거래소 매매가격과 다를 수 있다. [BMO SHNY 상품 페이지](https://www.bmoetns.com/ETN/SHNY.P/) · [BMO ETN 목록](https://www.bmoetns.com/)

2026년 2월 24일 SHNY는 10대 1 ETN 분할을 했다. 투자설명서상 1개 ETN의 원금 표시는 분할 전 25달러에서 분할 후 2.50달러로 조정됐다. 분할은 보유 단위 수와 단위당 표시 금액을 조정하는 절차이므로, 분할 전후의 단위당 가격을 비교할 때는 분할 반영 여부를 확인해야 한다. [BMO 투자설명서](https://www.bmoetns.com/Documents/SHNY/Prospectus.pdf) · [BMO 분할 공지](https://www.bmoetns.com/Document?filename=BMO+announces+stock+split+of+3+ETNs.pdf&folder=PressRelease)

## 일일 3배 목표와 복리 효과

SHNY의 3배 목표는 하루 단위다. 이를 비용 차감 전 매일 정확히 달성한다고 가정하면, GLD가 첫날 10% 상승하고 다음 날 10% 하락하는 예시는 다음과 같다.

| 구간 | GLD 가상 값 | SHNY 가상 값 (시작 100) |
|---|---:|---:|
| 시작 | 100 | 100 |
| 첫째 날: GLD +10% | 110 | 130 |
| 둘째 날: GLD -10% | 99 | 91 |
| 누적 변화 | -1% | -9% |

하루 수익률에 3배를 적용한 뒤 매일 다시 설정하기 때문에 여러 날의 SHNY 수익률은 GLD 누적 수익률의 3배가 아니다. 이 예시는 수수료와 금융 비용, 실제 추종 차이를 제외한 단순 계산이다. BMO도 하루를 넘는 기간의 수익률이 3배 누적 성과와 크게 달라질 수 있다고 설명한다. [BMO 투자설명서](https://www.bmoetns.com/Documents/SHNY/Prospectus.pdf)

## 비용과 조기 상환

SHNY에는 ETF의 단일 운용보수 대신 투자자 수수료와 금융 비용이 매일 반영된다.

| 항목 | 적용 방식 |
|---|---|
| 일일 투자자 수수료 | 연 0.95%를 기준으로 직전 종가 지표값, 경과 달력일수 및 365일 기준으로 매일 산출·차감 |
| 일일 금융 비용 | 직전 종가 지표값 × 금융 배수 2 × (미국 은행 프라임 대출금리 + 금융 스프레드) × 경과 달력일수 ÷ 365 |
| 금융 스프레드 | 최초 거래일 기준 연 2.75%; BMO 계산 대리인이 조정할 수 있고, 투자설명서상 최대 연 5.00%까지 가능 |
| 직접 조기 상환 수수료 | 상환일의 Indicative Note Value에 0.125%를 적용한 금액이 상환액에서 차감될 수 있음. BMO가 개별적으로 감면하거나 면제할 수 있음 |

투자설명서는 스프레드 변경 시 효력 발생일보다 최소 5영업일 전에 공지하도록 정한다. 위 2.75%는 최초 거래일 기준이고 5.00%는 허용된 상한이므로, 어느 한 값을 현재 적용 중인 수치로 단정하지 않았다. 투자자가 BMO에 직접 조기 상환을 요청하려면 통상 최소 25,000개를 신청해야 한다. 중개사가 다른 투자자의 신청과 묶을 수 있지만 이를 보장하지 않는다. 거래소에서 매도하는 것과 발행사에 직접 상환을 요청하는 것은 다른 절차다. [BMO 투자설명서](https://www.bmoetns.com/Documents/SHNY/Prospectus.pdf)

## 주요 위험

- **발행사 신용 위험:** SHNY는 BMO의 선순위 무담보 채무다. BMO가 채무를 이행하지 못하면 지표값과 관계없이 투자금 일부 또는 전부를 회수하지 못할 수 있다.
- **레버리지와 전액 손실:** GLD의 하락이 3배로 반영되며, 투자설명서상 장중 지표가치가 0 이하가 되면 지표가치와 이후 상환액이 0이 될 수 있다.
- **경로 의존성과 비용 누적:** 여러 날의 결과는 GLD의 기간 누적 변동뿐 아니라 매일의 변동 순서와 크기, 투자자 수수료와 금융 비용에 따라 달라진다.
- **시장가격과 지표값 차이:** SHNY의 거래소 가격은 장중 지표값이나 종가 지표값보다 높거나 낮을 수 있다. 프리미엄이 축소되거나 시장 유동성이 낮아지면 매매 결과가 불리해질 수 있다.
- **발행사 콜 및 기초 ETF 변경:** BMO는 조건에 따라 ETN의 전부 또는 일부를 조기 상환할 수 있고, 투자설명서가 정한 절차에 따라 연결 ETF를 다른 금 관련 ETF로 교체할 권리도 보유한다.
- **이자와 소유권 부재:** SHNY는 이자를 지급하지 않으며, 보유자에게 GLD나 금괴에 대한 소유권·의결권을 부여하지 않는다.
- **세무 불확실성:** ETN의 세무 결과는 투자자의 거주지와 상황 및 관련 규정에 따라 달라질 수 있다. BMO는 투자설명서에서 세무 결과에 불확실성이 있음을 안내한다.

## 자료 출처

1. [BMO SHNY 상품 페이지](https://www.bmoetns.com/ETN/SHNY.P/) — 거래소, 기초 ETF, ETN 구조와 주요 위험.
2. [BMO SHNY 투자설명서 (2026년 8월 26일 개정)](https://www.bmoetns.com/Documents/SHNY/Prospectus.pdf) — 일일 산식, 수수료, 조기 상환·콜·만기 연장 조건과 2026년 분할.
3. [BMO ETN 목록](https://www.bmoetns.com/) — 2026년 10월 1일 종가 지표값.
4. [BMO ETN 분할 공지](https://www.bmoetns.com/Document?filename=BMO+announces+stock+split+of+3+ETNs.pdf&folder=PressRelease) — 2026년 2월 SHNY 10대 1 분할 일정.
