# ETF Content Guide

## Scope

These rules apply to ETF posts under `src/content/blog/ETF`.

Use `docs/etf/미국상장_ETF_분류_기준_Codex용_v2.md` as the primary reference when classifying or writing ETF posts. This guide summarizes the operational rules for this repository.

## Core Classification Rules

- Classify by the ETF's actual investment purpose, strategy, income structure, holdings, and index exposure. Do not classify by ticker or ETF name alone.
- The target universe is U.S.-listed ETFs. If the product may be an ETN, CEF, mutual fund, non-U.S. product, delisted product, or unclear instrument, classify as `Other/Needs Review`.
- Always check for leverage or inverse exposure first. Leveraged and inverse products go under `Leveraged Inverse` even if they track a major index or theme.
- If the ETF uses covered calls, option premium, buy-write, equity premium income, ELNs, or similar income strategies, classify it as income-oriented before treating it as a representative index ETF.
- If the ETF clearly belongs to an asset class such as bonds, commodities, currencies, or REITs, prefer that asset class over broad equity index, sector, or theme labels.
- Use `needs_review: true` in the draft classification when the available information is insufficient or conflicting.
- Do not invent expense ratios, AUM, yields, returns, holdings, or index details. Mark unknown values as `확인 필요`.

## Repository Folder Style

The reference document uses Korean taxonomy names such as `대표지수`, `배당·인컴`, and `테마`. In this repository, keep physical folder names English and URL-friendly.

Use this mapping when creating new ETF folders:

| Reference taxonomy | Repository folder style |
|---|---|
| `대표지수` | `Broad Market` |
| `섹터` | `Sector` |
| `테마` | Existing specific theme folder, or a new English theme folder |
| `스타일·팩터` | `Style Factor` |
| `배당·인컴` | `Dividend Income` |
| `채권` | `Bond` |
| `원자재` | Existing commodity-specific folder such as `Copper`, or `Commodity` |
| `통화` | `Currency` |
| `부동산·리츠` | `REIT` |
| `레버리지·인버스` | `Leveraged Inverse` |
| `액티브` | `Active` only when no clearer investment objective exists |
| `멀티에셋` | `Multi Asset` |
| `기타/확인필요` | `Other/Needs Review` |

Prefer existing folders when they already match the ETF's real exposure. Examples already in this repository include:

- `Broad Market`
- `Coin`
- `Copper`
- `Defense Industry`
- `Dividend Income`
- `Leveraged Inverse`
- `Rare earth elements`
- `Semiconductor`
- `Space, Aerospace`

If a new ETF fits an existing folder, place it there rather than creating a duplicate synonym folder.

## Folder Decision Priority

Apply this order:

1. Leveraged or inverse structure
2. Asset class such as bond, commodity, currency, or REIT
3. Income structure such as covered call, option income, or premium income
4. Representative broad index exposure
5. GICS sector exposure
6. Thematic exposure
7. Style or factor exposure
8. Active management
9. Other or needs review

Examples:

- `QLD` tracks Nasdaq-100 with 2x leverage, so it belongs under a leveraged folder, not a normal Nasdaq folder.
- `QQQM` tracks Nasdaq-100 without leverage or option income, so it belongs under `Broad Market/Nasdaq-100`.
- `SPY` tracks S&P 500 without leverage or option income, so it belongs under `Broad Market/S&P500/Market Cap Weight`.
- `JEPQ` has Nasdaq-100 exposure but uses option income, so income classification wins over representative index classification.
- `CONY` references a single stock but is primarily an option income ETF, so it belongs under `Dividend Income/Option Income/Single Stock`.
- `SMH` is a semiconductor theme ETF, not a generic technology sector ETF.
- `BLCN` has Nasdaq in its index name, but the real exposure is blockchain, so classify it as a blockchain theme.

## New ETF Post Workflow

Before writing or moving an ETF post:

1. Identify ticker, official ETF name, issuer, listing market, asset class, index or strategy, active/passive status, leverage/inverse status, options usage, income focus, and main exposure.
2. Produce a short YAML-style classification block in the working notes or post draft.
3. Choose the folder from the classification priority and repository folder style.
4. Use the file name `TICKER.md` unless the existing folder already uses a different established pattern.
5. Include a stable `slug` in frontmatter if the final URL should avoid spaces, Korean text, or special characters.
6. Keep `categories` aligned with the site category convention. ETF posts should include `ETF`.

Suggested classification fields:

```yaml
ticker:
name:
listed_market: US
asset_class:
index_or_strategy:
folder:
category:
subcategory:
is_passive:
is_active:
uses_options:
uses_leverage:
uses_inverse:
income_focus:
reason:
confidence: high | medium | low
needs_review: true | false
```

## Post Structure

ETF posts should generally include:

- 한 줄 요약
- 기본 분류
- 어떤 ETF인가?
- 왜 이 폴더로 분류했나?
- 비슷한 ETF
- 주의할 점
- 태그

In the classification explanation, explicitly state that the folder was selected by actual exposure and strategy, not by ETF name alone.

## Content Safety

- Do not include private notes, local paths, temporary URLs, or unpublished source links.
- Do not copy long passages from issuer pages or news sources.
- For current ETF data, use official issuer pages and reputable financial data sources when the user asks for verification or latest values.
- If browsing is not requested and current data is not required, avoid adding unstable numbers.
