---
title: 'GLL (ProShares UltraShort Gold)'
description: 'Bloomberg Gold Subindex 하루 수익률의 -2배를 목표로 하는 ProShares 금 선물 인버스 상품의 구조와 위험을 정리한다.'
pubDate: '2026-07-22T19:00:00+09:00'
updatedDate: '2026-10-04T00:00:00+09:00'
verifiedDate: '2026-10-04T00:00:00+09:00'
dataAsOf: '2026-10-02T00:00:00+09:00'
aumAsOf: '2026-10-02T00:00:00+09:00'
expenseRatioAsOf: '2026-03-27T00:00:00+09:00'
ticker: 'GLL'
issuer: 'ProShares'
instrumentType: 'ETF'
assetClass: 'Commodity'
strategy: 'Inverse'
exposure: 'Bloomberg Gold Subindex'
leverage: '-2x'
incomeStyle: 'None'
aum: 94307370
expenseRatio: '0.95%'
categories: 'ETF'
tags: ['ETF', 'GLL', 'ProShares', 'Gold', 'Commodity', 'Inverse']
---

# GLL (ProShares UltraShort Gold) 분석

> **분석 기준일: 2026년 10월 4일**
>
> GLL은 Bloomberg Gold Subindex 하루 수익률의 -2배를 수수료와 비용 차감 전에 목표로 한다. 지수는 COMEX 금 선물 성과를 반영하며, 실물 금 현물 가격과 같지 않다. 목표는 한 NAV 산출 시점부터 다음 NAV 산출 시점까지의 하루 구간에 적용된다.

## ETF 분류

| 항목 | 내용 |
|---|---|
| 분류 경로 | ETF/Leveraged Inverse/Gold/GLL |
| 상품 | ProShares UltraShort Gold |
| 티커 / 거래소 | GLL / NYSE Arca |
| 기초 노출 | Bloomberg Gold Subindex (COMEX 금 선물 기반) |
| 일일 목표 | 비용 차감 전 지수 하루 수익률의 -2배 |
| 분류 근거 | 금 가격 노출에 인버스 일일 레버리지 전략을 적용하므로 레버리지·인버스 상품으로 분류한다. |

## 기본 정보

| 항목 | 내용 |
|---|---|
| 설정일 | 2008년 12월 1일 |
| 순자산 | 94,307,370달러 (운용사 페이지 표시값) |
| 운용사 표시 Expense Ratio | 0.95% |
| NAV / 시장가격 | 25.24달러 / 25.06달러 (2026년 10월 2일) |
| 30일 중간 호가 스프레드 | 0.04% (운용사 페이지 표시) |
| 분배 | 운용사 페이지에 과거 분배가 없다고 표시; 향후 분배가 없다는 보장은 아님 |

운용사는 Expense Ratio를 0.95%로 표시하며, 이 비율은 펀드가 부담하는 중개 수수료와 관련 거래 비용을 포함하지 않는다. 2026년 3월 27일 SEC 투자설명서는 관리보수 0.95%와 중개 수수료·비용 추정치 0.31%를 합산한 1.26% 손익분기 예시를 제시한다. 이 예시는 주당 20달러의 일정 NAV 등을 가정한 계산이므로 현재의 확정 총비용률로 읽어서는 안 된다. [SEC 투자설명서](https://www.sec.gov/Archives/edgar/data/1415311/000119312526126528/d132458d424b3.htm) · [ProShares 상품 페이지](https://www.proshares.com/our-etfs/leveraged-and-inverse/gll)

## 운용 구조와 기초 지수

GLL은 금괴를 직접 보유하지 않는다. 선물과 스왑 등 파생상품으로 Bloomberg Gold Subindex에 반대 방향으로 노출되며, 증거금·현금 관리를 위해 단기 국채나 머니마켓 상품을 보유할 수 있다. 2026년 10월 2일 운용사 보유 내역에는 2026년 12월물 COMEX 금 선물 노출 -126.98%, Citibank·UBS·Goldman Sachs의 지수 스왑 노출 -50.12%, -13.76%, -8.90%가 표시됐다. 이는 운용사 표의 노출 비중이며, 실제 시장가치 비중과 다르다. 파생상품 계약과 비중은 매일 바뀔 수 있다. [운용사 보유 내역](https://www.proshares.com/our-etfs/leveraged-and-inverse/gll)

Bloomberg Gold Subindex는 COMEX 금 선물 가격의 성과를 반영하는 롤링 지수다. 실물 금을 인수하지 않으며, 특정 월에 미리 정한 일정에 따라 5영업일 동안 선물 계약 일부를 교체한다. 보통 해당 월 6~10번째 영업일에 하루 약 20%씩 롤한다. 선물 만기 교체의 영향은 콘탱고나 백워데이션 등 선물 가격 구조에 따라 달라지므로 고정된 연간 비용으로 가정할 수 없다. [ProShares 지수 설명](https://www.proshares.com/our-etfs/leveraged-and-inverse/gll)

## 하루 목표와 여러 날 수익률

GLL은 매일 -2배 노출을 다시 맞춘다. 기초 지수가 하루 1% 오르면 수수료·비용과 추적 차이를 제외할 경우 약 2% 하락을, 하루 1% 내리면 약 2% 상승을 목표로 한다. 투자설명서에서 하루는 한 NAV 산출 시점부터 다음 NAV 산출 시점까지를 뜻한다.

아래는 매일 목표를 정확히 달성한다고 가정하고 비용과 추적 차이를 제외한 산술 예시다.

| 구간 | Bloomberg Gold Subindex 가상 지수 | GLL 가상 가치 (시작 100) |
|---|---:|---:|
| 시작 | 100 | 100 |
| 첫째 날: 지수 +10% | 110 | 80 |
| 둘째 날: 지수 -10% | 99 | 96 |
| 누적 변화 | -1% | -4% |

이 예시에서는 지수가 이틀 동안 1% 하락했지만 GLL 가치는 4% 하락한다. 일일 재설정 때문에 하루보다 긴 기간의 수익률은 지수 누적 수익률의 -2배와 달라질 수 있다. 변동성과 수익 경로에 따라 지수가 보합이거나 하락하더라도 GLL이 손실을 기록할 수 있다. 이는 계산 예시이며 실제 펀드 성과에는 비용, 선물 가격, 파생상품 거래와 추적 차이가 반영된다. [SEC 투자설명서](https://www.sec.gov/Archives/edgar/data/1415311/000119312526126528/d132458d424b3.htm)

## 공시 성과

운용사 페이지의 최신 월말 총수익률은 2026년 8월 31일 기준이다. 설정 이후 수익률은 연환산 값이다. 과거 성과는 미래 결과를 보장하지 않는다. [ProShares 상품 페이지](https://www.proshares.com/our-etfs/leveraged-and-inverse/gll)

| 기간 | GLL NAV | GLL 시장가격 |
|---|---:|---:|
| 2026년 초 이후 | -15.44% | -16.79% |
| 최근 1년 | -46.20% | -46.72% |
| 최근 10년 연환산 | -22.60% | -22.68% |
| 설정 이후 연환산 | -22.45% | -22.49% |

## 비용·분배·세금 구조

GLL은 ProShares Trust II의 원자재 풀로 운용되며, 투자회사법(Investment Company Act of 1940)에 따라 등록된 투자회사가 아니어서 해당 법률의 보호를 받지 않는다. 운용사와 SEC 투자설명서는 GLL이 Schedule K-1을 발행한다고 안내한다. 이 내용은 미국 세금 보고 서류에 관한 상품 구조 설명이며, 개인별 세금 처리를 판단하는 조언은 아니다. 분배 이력이 없더라도 미래 분배가 없다고 보장되지는 않는다. [SEC 투자설명서](https://www.sec.gov/Archives/edgar/data/1415311/000119312526126528/d132458d424b3.htm) · [ProShares 상품 페이지](https://www.proshares.com/our-etfs/leveraged-and-inverse/gll)

## 주요 위험

- **일일 인버스 레버리지와 경로 의존성:** 하루보다 긴 기간의 수익은 기초 지수 누적 수익의 -2배와 달라질 수 있다. 금 선물 지수가 하락해도 변동성과 경로에 따라 GLL이 손실을 볼 수 있다.
- **전액 손실 가능성:** 기초 지수가 급격히 상승하면 인버스 포지션 가치가 큰 폭으로 감소할 수 있으며, 투자설명서는 레버리지 파생상품에서 하루 안에 원금 전부를 잃을 수 있다고 경고한다.
- **선물 롤 및 기초자산 차이:** 지수는 금 현물 대신 COMEX 선물 성과와 계약 교체 효과를 반영한다. 따라서 GLL의 결과가 현물 금 가격의 반대 방향 수익률과 같지 않을 수 있다.
- **파생상품·거래상대방 위험:** 선물 증거금, 스왑 상대방의 신용도, 담보와 시장 유동성이 목표 노출 및 순자산가치에 영향을 줄 수 있다.
- **법적 구조와 시장가격 차이:** 원자재 풀 구조는 일반적인 1940년 투자회사법 등록 ETF와 다르다. 거래소 시장가격은 NAV와 달라질 수 있으며 개인 거래 수수료도 별도로 발생한다.

## 자료 출처

1. [SEC 제출 ProShares Trust II 투자설명서 (2026년 3월 27일)](https://www.sec.gov/Archives/edgar/data/1415311/000119312526126528/d132458d424b3.htm) — 일일 목표, 파생상품·현금 관리, 비용 예시, 세금 서류와 위험.
2. [ProShares GLL 상품 페이지](https://www.proshares.com/our-etfs/leveraged-and-inverse/gll) — 순자산, 거래 정보, 기준일별 보유 내역, 지수 구성 방식, 성과, 분배와 상품 구조.
