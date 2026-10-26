# 34. Market Brief 티커 자동 링크

Market Brief 본문에 나오는 ETF 티커를 같은 블로그의 ETF 글로 자동 연결합니다.

## 현재 동작

- ETF 글 127편에 `ticker` frontmatter가 있고, 티커는 모두 서로 다릅니다.
- Market Brief 글 112편 중 `/blog/` 내부 링크를 가진 글은 0편입니다. 본문 링크는 모두 외부 출처입니다.
- 2026-10-26 기준 `ticker`가 있는 ETF 중 21종이 Market Brief 본문에 단어 단위로 등장합니다. 등장 글 수 상위는 다음과 같습니다.

| 티커 | 등장 글 수 | 티커 | 등장 글 수 |
| --- | ---: | --- | ---: |
| QQQ | 70 | ITA | 28 |
| SMH | 48 | REMX | 24 |
| SPY | 32 | CIBR | 22 |
| SOXX | 30 | XAR | 21 |
| URA | 29 | UFO | 21 |

- 상위 5개 티커가 나오는 369줄 중 287줄이 표 행입니다. 일부 표는 `<strong>URNJ</strong>`처럼 raw HTML로 강조되어 있습니다.
- `astro.config.mjs`의 markdown 파이프라인에는 `remark-math`만 등록되어 있습니다.

## 목표

1. Market Brief 독자가 언급된 ETF의 상세 글로 바로 이동할 수 있게 합니다.
2. 글 원문은 수정하지 않고 렌더링 단계에서만 링크를 만듭니다.
3. 잘못된 연결(일반 단어, 다른 의미의 약어)을 만들지 않습니다.

## 범위

- Market Brief 카테고리 글에만 적용하는 remark 플러그인
- 티커 → 글 URL 매핑 생성
- 단위 테스트와 빌드 산출물 확인
- 포함하지 않음: 다른 카테고리 적용, 개별 주식 티커(`CCJ`, `NVDA` 등) 연결, 검색 인덱스 변경

## 연결 규칙

- 글 하나에서 티커마다 **첫 등장 한 번만** 링크합니다. 표에서 반복되는 티커가 모두 링크되면 읽기 어려워지기 때문입니다.
- 대문자 단어 경계로만 일치시킵니다. `QQQM` 안의 `QQQ`, 소문자 `ufo`는 연결하지 않습니다.
- 다음 노드 안에서는 연결하지 않습니다: 제목(heading), 기존 링크, 인라인 코드, 코드 블록, 수식, raw HTML.
- 표 셀 안의 일반 텍스트는 연결합니다. Market Brief 언급의 대부분이 표에 있기 때문입니다.
- 제외 목록을 둡니다. 시작 값은 `USD`(통화와 혼동)입니다. 착수 시 `GRID`, `UFO`, `BAR`, `RING`처럼 일반 영어 단어와 같은 티커가 실제 본문에서 다른 뜻으로 쓰였는지 확인해 목록을 확정합니다.
- 연결 대상이 초안 글이면 프로덕션 빌드에서 연결하지 않습니다(`shouldIndexPostRoute()` 기준).

## 매핑 생성 방식

- 플러그인은 콘텐츠 컬렉션에 접근할 수 없으므로, 설정 로드 시 `src/content/blog/ETF/` 아래 frontmatter를 직접 읽어 `ticker → /blog/<slug>` 맵을 만듭니다.
- 글 URL은 `check:content`가 쓰는 `scripts/lib/content-rules.mjs`의 `getBlogPostRoutePath()`를 재사용해 실제 라우트와 어긋나지 않게 합니다.
- frontmatter 파싱도 같은 파일의 `parseFrontmatterFields()`를 재사용합니다. 새 의존성은 추가하지 않습니다.
- `astro.config.mjs`가 `scripts/lib/`를 불러오는 구조가 어색하면, 필요한 함수를 `src/lib/`로 옮기고 `content-rules.mjs`가 다시 내보내게 합니다(`slugifyPathSegment`와 같은 방식).
- 적용 대상 판별은 vfile 경로가 `src/content/blog/Market Brief/` 아래인지로 합니다.

## 변경 후보

- `src/lib/remarkTickerLinks.mjs`(신규) — 플러그인과 매핑 함수
- `astro.config.mjs` — `remarkPlugins`에 등록
- `scripts/test/remark-ticker-links.test.mjs`(신규)
- `docs/market-brief-prompts.md` — 티커를 직접 링크하지 않아도 된다는 안내 한 줄

## 구현 단계

1. 매핑 함수를 만들고 127개 티커가 실제 글 라우트와 일치하는지 테스트합니다.
2. 연결 규칙을 구현하고 노드 종류별 테스트를 작성합니다.
3. `astro.config.mjs`에 등록하고 빌드 후 Market Brief 몇 편의 HTML을 확인합니다.
4. 제외 목록을 실제 본문 대조로 확정합니다.

## 테스트 설계

- 첫 등장만 링크되고 두 번째부터는 일반 텍스트로 남는지
- `QQQM`, `qqq`, `QQQ.` (구두점 인접)의 처리
- heading·link·inlineCode·code·math·html 노드 안에서 연결되지 않는지
- 표 셀 안에서는 연결되는지
- 제외 목록 티커가 연결되지 않는지
- Market Brief가 아닌 경로의 파일은 변경되지 않는지
- 초안 대상 글로의 연결이 프로덕션 모드에서 빠지는지

## 검증

- `npm test`
- `npm run build` 및 `npm run check:build-artifacts`(생성된 내부 링크가 실제 라우트를 가리키는지 기존 내부 링크 검사로 확인)
- `npm run check`
- `npm run format:check`
- 라이트·다크 모드에서 표 안 링크 가독성 수동 확인
