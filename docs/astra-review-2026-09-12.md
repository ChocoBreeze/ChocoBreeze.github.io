# Astra Review — ChocoBreeze.github.io 기술 검토 보고서

> 이 문서는 2026-09-12에 수행한 Astra Review를 추후 개발의 기준 문서로 보존한 것이다.
> 검토 시점의 저장소 상태와 공개 배포 결과를 기록하므로, 이후 구현에서는 현재 코드와
> 변경 이력을 함께 확인한다.

- 검토일: 2026-09-12
- 저장소: **ChocoBreeze/ChocoBreeze.github.io**
- 기준: `main` / `7f4b861f128240fdd28eb6d58984054d70bf66bf`
- 배포 사이트: [chocobreeze.github.io](https://chocobreeze.github.io/)
- 검토 범위: 소스, 운영 문서, 테스트, 배포 로그, 공개 사이트의 HTTP 응답과 HTML
- 제외 범위: 글 502개의 모든 기술·시장 주장을 개별적으로 사실 검증한 검토
- 이 문서화 작업에서는 GitHub 소스 수정, 커밋, PR, 배포를 수행하지 않음

## Executive summary

콘텐츠 관리와 탐색 기능은 충분히 성장했다. 다음 단계는 검색 인덱스의 정확성을 먼저
고치고, 브라우저 통합 검사와 검색 성능 기준을 마련하는 것이다. 기존 로드맵의 21번
‘검색 접근성과 인덱스 확장성’을 이어가는 것이 합리적이다. 의존성 보안 조치는 별도의
우선 작업으로 처리한다.

## 1. Current state

### 구현과 콘텐츠 규모

| 영역 | 현재 구현 | 판단 |
|---|---|---|
| 프레임워크 | Astro 6, Markdown/MDX Content Collections, 정적 GitHub Pages | 개인 지식 블로그에 적합한 구조 |
| 콘텐츠 | 추적되는 Markdown/MDX 502개, 공개 빠른 검색 인덱스도 502개 | 프로토타입을 넘어 운영·검색 품질이 중요한 규모 |
| 본문 | KaTeX, 코드 강조, 목차, 읽기 시간, 복사·공유·글 액션 | 장문 기술·투자 글을 읽는 기본 기능 확보 |
| 탐색 | 카테고리, 태그, 월별 아카이브, Finance/Computing 허브, 통계 | 정적 콘텐츠를 여러 경로로 탐색 가능 |
| 목록 | 30개 단위 더 보기, 필터·정렬·URL 상태 복구 | 전체 항목을 HTML에 포함하고 JS로 표시를 제어하는 방식 |
| 검색 | 전역 빠른 검색, 본문 요약 검색, 카테고리별 인덱스, 코드 검색 | 지연 로딩·페이지 내 캐시·요청 순서 방어 존재 |
| 추천 | 시리즈 → 수동 `relatedSlugs` → 태그/토픽 점수 → 카테고리 인접 글 | 결정적인 메타데이터 기반 추천. 임베딩 검색이 아님 |
| 학습 경로 | 선행 글 및 역방향 한 단계 연결 | 무제한 그래프 탐색을 구현하지 않은 것은 명시된 범위 |
| ETF | 메타데이터 필터와 2~4개 비교, 기준일 없는 변동값 표시 제한 | UI 구현과 실제 메타데이터 보급률은 구분 필요 |
| Market Brief | Daily/Weekly 분류, 달력, 기간별 관련 글 연결 | 날짜·취재 기간의 명시값과 호환 fallback 존재 |
| 게시 안전장치 | frontmatter·날짜·링크/앵커·민감 문자열·이미지 alt 검사, draft 제외 | 콘텐츠 검증이 CI와 배포 경로에 포함됨 |
| 배포 | main push → 테스트/콘텐츠/타입/빌드 → Pages 배포 | 검증 job과 배포 권한 분리, 배포 concurrency 설정 존재 |

근거: [README](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/README.md),
[package.json](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/package.json),
[콘텐츠 스키마](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/content.config.ts),
[게시 글 공통 필터](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/lib/posts.ts),
[목록](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/layouts/BlogListLayout.astro),
[로드맵](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/docs/plan/README.md).

메타데이터 정적 집계는 다음과 같다.

- ETF 카테고리 글 135개
- ticker가 있는 글 10개
- 전체 글 중 `dataAsOf` 2개
- `verifiedDate` 2개
- `seriesSlug` 26개

메타데이터가 없다고 글 내용이 틀렸다는 뜻은 아니다. 로드맵 17·19번은 기존 글 백필을
이미 잔여 작업으로 명시하고 있으므로, 이 부분은 숨겨진 미구현이 아니라 알려진 작업이다.

### 현재 알고리즘

- **빠른 검색:** NFKC 정규화·소문자 변환 후 제목 100, 카테고리 30, 설명 20점. 전체 후보를 점수화·정렬하고 상위 8개 표시.
- **전체 검색:** 제목 60, 설명 30, 태그 25, 소제목 20, 카테고리 15, excerpt와 본문 검색 필드 각각 12점. 코드 파일명은 35점. 검색어의 부분 문자열 포함 여부로 점수를 합산.
- **본문 인덱스:** Markdown에서 텍스트를 추출하고 excerpt 480자, 본문 검색 필드 5,000자로 제한. 코드 검색은 별도로 코드 블록·동일 디렉터리 소스 파일의 최대 12,000자를 색인.
- **관련 글:** 시리즈 근접도와 작성자 수동 링크를 우선하고, 태그 교집합×2 + 토픽 교집합으로 후보를 정렬. 날짜·키로 동점을 정리하고 제외·중복 규칙을 적용.
- **ETF 비교:** ticker 정규화·중복 제거 후 선택 항목을 최대 4개로 제한. 수치의 투자 판단 알고리즘이나 실시간 시세 시스템은 아님.

근거: [빠른 검색](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/lib/quickSearch.mjs),
[전체 검색 점수와 UI](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/pages/search.astro),
[인덱스 생성](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/lib/searchIndex.ts),
[코드 인덱스](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/lib/codeSearchIndex.ts),
[관련 글](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/lib/relatedPosts.mjs),
[ETF 비교](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/lib/etfCompare.mjs).

### 검증 결과

| 검증 | 결과 | 해석 |
|---|---|---|
| 최신 배포 CI | 테스트 187개 통과, 콘텐츠 검사 통과(경고 12개), 타입 검사·빌드·배포 성공 | 기준 커밋과 일치하는 실행 기록 |
| 이번 로컬 `npm test` | 187개 통과, 실패 0 | 콘텐츠 규칙·유틸리티·CLI/훅 fixture 검사 포함 |
| 이번 로컬 콘텐츠 검사 | 통과, 경고 12개 | 경고는 없는 것이 아니라 비차단 정책 |
| 이번 로컬 Astro 검사 | 95개 파일, error/warning/hint 각각 0 | 타입 검사 결과. 브라우저 동작 보장은 아님 |
| 이번 로컬 빌드 | 종료 코드 0, 검색 산출물 확인 | 전체/빠른 검색 각 502개, 코드 검색 4,244개 항목 |
| 이번 로컬 포맷 검사 | 통과 | Prettier 기준 충족 |
| 배포 사이트 HTTP | 홈·검색·빠른 검색 JSON·통계 모두 200 | 실제 공개 응답 확인. 모든 화면을 브라우저로 조작한 것은 아님 |
| 의존성 audit | 16건: low 1, moderate 6, high 8, critical 1 | 9월 10일 CI 설치 로그와 9월 12일 로컬 감사에서 동일 집계 |

[최신 배포 실행](https://github.com/ChocoBreeze/ChocoBreeze.github.io/actions/runs/34484418702),
[배포 워크플로](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/.github/workflows/deploy.yml),
[PR CI](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/.github/workflows/ci.yml).

테스트 일부가 임시 콘텐츠를 실제 content 디렉터리에 생성하므로 검사·빌드와 동시에
실행하지 않는 편이 안전하다. 당시 로컬 검증에서 발견한 테스트 임시 파일은 제거하고
빌드를 다시 실행했다. 검토 시점의 최종 추적 소스 변경은 없다. CI의 기존 순차 실행은
유지해야 한다.

## 2. Inconsistencies

### P1 — 구분선 사이의 실제 본문이 검색 인덱스에서 삭제됨

`searchIndex.ts`의 `stripMarkdown()`은 `replace(/---[\s\S]*?---/, ' ')`를 먼저 수행한다.
`createSearchIndex()`가 전달하는 값은 `post.body`인데, 이 정규식은 본문 안의 첫 구분선부터
다음 구분선까지도 frontmatter처럼 제거한다.

실제 함수를 추출해 실행한 최소 재현:

```text
입력: 도입 → --- → 핵심검색어XYZ 설명 → --- → 마무리
출력: 도입 마무리
```

실제 IDL 글에서도 ‘IDL이란?’ 구간의 정의 문장이 소스에는 있지만 생성된 본문 검색 필드
`x`에는 없다. 추적 콘텐츠 502개 중 379개 본문에서 이 정규식이 일치한다. 이 수치는
잠재적으로 잘리는 구간이 있는 문서 수이며, 379개 글이 검색 결과에서 완전히 사라진다는
뜻은 아니다. 제목·설명·소제목은 별도 필드여서 일부 질의는 계속 검색된다.

영향: 사용자가 본문에서 읽은 문구로 다시 검색해도 찾지 못할 수 있다. 성능 개선보다 먼저
수정해야 할 검색 정확성 문제다.

권장 사항:

- frontmatter를 이미 분리한 body에는 frontmatter 제거를 하지 않는다.
- Markdown AST 또는 검증된 렌더 텍스트 추출을 사용한다.
- 수평선·표 구분선·코드 fence·이미지·HTML fixture를 추가한다.

현재 이미지 처리도 링크 정규식이 먼저 실행되어 `![도표](image.png)`가 `!도표`로 남는
현상이 재현됐다. 이는 주로 검색 텍스트 품질 문제다.

근거: [stripMarkdown과 호출부](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/lib/searchIndex.ts).

### P1 — SECURITY.md의 현재 상태와 위험 설명이 뒤처짐

`SECURITY.md`는 마지막 확인일 2026-07-20, 8건을 기록하며 Astro 등의 문제를 정적 산출물
런타임과 무관한 개발/빌드 도구 문제로 설명한다. 최신 확인 결과는 16건이며 Critical 1건이
포함된다. 과거 감사 수치가 당시 틀렸다는 뜻은 아니지만, ‘Current known audit result’는
갱신이 필요하다.

정적 GitHub Pages에는 Astro 서버가 없으므로 서버 전용 공격 경로는 제한된다. 그러나 모든
Astro XSS를 정적 빌드와 무관하다고 일반화할 수 없다. 공식 spread props 권고는 신뢰할 수
없는 입력이 빌드에 들어오면 정적 HTML에도 영향을 줄 수 있다고 설명한다. 현재 블로그에서
그 공격 경로가 실제로 존재한다고 재현한 것은 아니다.

[공식 Astro 권고](https://github.com/advisories/GHSA-jrpj-wcv7-9fh9)

Critical 항목은 당시 `npm audit`에서 Astro의 AVIF 이미지 최적화 관련 권고로 보고됐다.
해당 권고 원문은 당시 조회에서 열리지 않았으므로 세부 악용 조건이나 안전한 업그레이드
버전을 독립적으로 확정하지 않았다. 배포 사이트가 즉시 원격 코드 실행에 노출된다고
단정하지 않는다.

권장 사항:

- advisory별 실제 의존 경로를 분류한다.
- 입력의 신뢰 경계와 정적 산출물·빌드·개발 서버 노출을 구분한다.
- 호환성 검증과 함께 의존성을 갱신한다.
- 현재 CI에 별도 audit gate가 없으므로, 차단 등급과 예외 만료일을 정책으로 정한다.

근거: [SECURITY.md](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/SECURITY.md),
[lockfile](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/package-lock.json),
[9월 10일 CI 로그](https://github.com/ChocoBreeze/ChocoBreeze.github.io/actions/runs/34484418702).

### P2 — AGENTS/CLAUDE의 관련 글 설명과 현재 구현 불일치

`AGENTS.md`는 추천이 category-and-order 기반이고 tag similarity를 사용하지 않는다고 명시한다.
`CLAUDE.md`에도 오래된 요약이 남아 있다. 실제 `getRelatedPosts()`는 시리즈·수동 링크·
태그/토픽 점수를 사용한다. 상세 문서 `docs/blog-routing-and-related-posts.md`는 이미 현재
동작으로 갱신돼 있다.

영향: 다음 코드 에이전트가 잘못된 규칙을 기준으로 기능을 되돌리거나 잘못 수정할 수 있다.
요약을 상세 문서와 맞추고, 규칙은 한 곳에서 설명하도록 정리한다.

근거: [AGENTS.md](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/AGENTS.md),
[CLAUDE.md](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/CLAUDE.md),
[갱신된 상세 문서](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/docs/blog-routing-and-related-posts.md).

### P2 — 카테고리 단일 출처 원칙이 코드 전체에는 적용되지 않음

README는 `BLOG_CATEGORIES`를 유일한 출처로 설명하지만 콘텐츠 검사기에는 `KNOWN_CATEGORIES`와
`CATEGORY_ALIASES`가 별도로 있다. RSS와 검색에도 category→slug 매핑이 각각 존재한다.

현재 카테고리가 반드시 틀렸다는 뜻은 아니다. 새 카테고리나 alias를 추가할 때 화면과
검사기가 서로 달라질 수 있는 구조적 불일치다. 공통 JS 데이터와 타입을 사용하거나,
최소한 정의 간 동등성 검사를 추가한다.

근거: [카테고리 정의](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/data/blogCategories.ts),
[검사기 규칙](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/scripts/lib/content-rules.mjs),
[RSS 매핑](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/lib/rss.js),
[검색 매핑](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/lib/searchIndex.ts).

### P2 — 실제 검색 페이지의 title에 사이트명이 중복

배포 HTML에서 `Search | ChocoBreeze | ChocoBreeze`를 확인했다. search 페이지가 사이트명을
포함한 title을 `BaseHead`에 전달하고, `BaseHead`가 다시 붙인다. Archive/Tags에도 같은 호출
패턴이 있다. 한 곳에서만 사이트명을 붙이도록 계약을 통일하고 생성 HTML 테스트로 보호한다.

근거: [공개 검색 페이지](https://chocobreeze.github.io/search/),
[BaseHead](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/components/BaseHead.astro),
[검색 페이지](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/pages/search.astro).

### P2 — 빠른 검색과 전체 검색의 정규화·상태 연결 차이

빠른 검색은 NFKC 정규화를 하지만 전체 검색은 trim/소문자 변환 중심이다. 전각 영문처럼
동일하게 보이는 입력에서 결과 차이가 생길 수 있다. 팔레트의 ‘전체 검색으로 이동’은
`/search/`로만 이동하며 입력 질의를 전달하지 않는다. 전체 검색에도 query/mode/category의
URL 복원 로직이 없다. 반면 목록 필터와 ETF 비교에는 URL·뒤로 가기 처리가 있다.

이는 모든 검색 결과가 틀렸다는 주장이 아니다. 통합 탐색 경험과 로드맵의 URL 상태 원칙을
마무리할 과제다. 공통 정규화와 `q`, `mode`, `category` URL 계약을 권장한다.

근거: [빠른 검색 유틸리티](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/lib/quickSearch.mjs),
[검색 접근 규칙](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/lib/searchAccess.mjs),
[팔레트](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/components/GlobalSearchPalette.astro),
[전체 검색](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/src/pages/search.astro).

## 3. Technical debt

| 부채 | 현재 영향 | 권장 방향 |
|---|---|---|
| 검색 점수·snippet·DOM 코드가 `search.astro`에 집중 | 핵심 전체 검색 로직의 독립 회귀 시험이 어려움 | 순수 검색 함수와 브라우저 UI를 분리 |
| 정규식 기반 본문/코드 추출 | 수평선 삭제, 복잡한 Markdown·fence 누락 가능 | AST 기반 추출, 실제 장문 fixture |
| 브라우저 E2E 부재 | focus, 키보드, 요청 경쟁, 오류 복구, 뒤로 가기는 타입 검사로 보장 못함 | 작은 Chromium smoke suite부터 추가 |
| 결과 전체 DOM 렌더링 | 넓은 검색어에서 결과 수만큼 노드 재생성 | 페이지 단위 표시 또는 제한된 초기 렌더링 |
| 리스트의 표시 pagination | 30개만 보여도 모든 카드가 HTML·DOM에 존재 | 실제 초기 HTML/DOM 비용을 측정한 뒤 정적 페이지 분할 검토 |
| 검색 필드 중복 | excerpt가 본문 x와 겹치고 두 필드 모두 점수에 반영 | 전송 중복과 초반 본문 가중치의 의도 명시 |
| 추천/학습 경로의 페이지별 전체 순회 | 글 수 증가 시 build 비용 확대 가능 | 카테고리/시리즈/참조 인덱스를 빌드 중 공유 |
| ETF/신선도 메타데이터 보급률 | 비교 UI가 전체 ETF 글을 포괄하지 못함 | 검증 가능한 파일럿부터 출처·기준일 포함 백필 |
| 응답 헤더 선언과 정적 호스팅 구분 | 소스의 Cache-Control 선언만 보고 CDN 동작을 확정할 수 없음 | 배포 응답으로 확인. 당시 홈/검색/quick/stats는 max-age=600 |
| 외부 폰트·KaTeX CSS | 외부 요청·차단 환경의 읽기 품질 영향 가능 | 네트워크/수식 표시 측정 후 조건부 셀프호스팅 |
| 테스트가 실제 content 디렉터리에 fixture 생성 | 검사/빌드와 병렬 실행하면 임시 글 혼입 가능 | 테스트 전용 임시 루트 주입, CI 순차 검증 유지 |

좋은 기반도 유지해야 한다.

- draft 제외는 `getPublishedPosts()`로 통일돼 있다.
- 요청 token·동일 요청 공유·캐시·검색 오류 안내가 구현돼 있다.
- 본문 인덱스 5,000자 제한은 명시적인 설계 한계다.
- UI는 ‘본문 요약’ 검색으로 안내하므로, 이를 완전한 전문 검색이라고 평가하면 안 된다.

## 4. Benchmark recommendations

### 이미 확인한 baseline

| 인덱스 | 항목 수 | 파일 크기 | 로컬 gzip 추정 크기 |
|---|---:|---:|---:|
| 전체 검색 | 502 | 4,354,812 bytes / 4.15MiB | 1,162,349 bytes |
| 빠른 검색 | 502 | 99,182 bytes / 96.86KiB | 26,461 bytes |
| 코드 검색 | 4,244 | 2,438,385 bytes / 2.33MiB | 250,627 bytes |

파일 크기는 최신 CI의 size report와 로컬 생성 결과가 일치한다. gzip은 로컬 압축 계산이며
실제 CDN 전송량·브라우저 parse 비용을 측정한 결과는 아니다. 빠른 검색 공개 응답도 99,182
bytes로 확인됐다. 크기 보고 도구는 존재하지만 임계값 초과를 차단하거나 검색 품질·latency를
측정하지는 않는다.

[크기 보고 스크립트](https://github.com/ChocoBreeze/ChocoBreeze.github.io/blob/7f4b861f128240fdd28eb6d58984054d70bf66bf/scripts/report-search-size.mjs)

### 예상되는 확장 경계

1. **정확성 경계가 이미 존재한다.** 수평선 구간 삭제와 5,000자 cap을 구분한다. 전자는 결함이고 후자는 설계 절충이다. 장문 후반에만 존재하는 단어는 전문 검색 기대를 충족하지 못한다.
2. **검색 CPU와 DOM 비용:** 입력할 때마다 인덱스 N개를 순회하고 일치 M개를 정렬한 뒤 전부 렌더링한다. 대략 텍스트 검사 O(전체 검색 문자열 길이), 정렬 O(M log M), DOM O(M) 경향이다. 4,244개 코드 항목은 글 수 502개만 보고 판단할 수 없는 비용이다.
3. **네트워크와 메모리:** 지연 로딩은 최초 페이지 방문 비용을 줄이지만 첫 실제 검색에서는 선택한 인덱스 전체를 받는다. 여러 카테고리·전체·코드 인덱스를 순회하면 같은 내용이 페이지 캐시에 중복 보관된다.
4. **빌드 비용:** 전체/카테고리 검색 생성, 글별 관련 글 계산, OG 이미지 생성이 함께 증가한다. 각 비용을 분리 측정해야 한다. 기존 OG 규모 최적화 보류 계획을 측정 없이 우선순위 1로 바꿀 근거는 없다.

### 권장 실험

| 축 | 실험 | 지표/성공 조건 |
|---|---|---|
| 검색 정확도 | 한글 복합어·부분어·띄어쓰기·전각 영문·티커·함수명·후반 본문·구분선 구간 | 기대 문서 Recall@10, 상위 결과 순위, 0건 비율 |
| 성장 | 현재 502글, 재현 가능한 1k/2k/5k 콘텐츠 | 인덱스 크기, JSON parse, CPU, peak heap |
| 응답성 | cold/warm, 네트워크 제한, CPU 저속화 | 입력→결과 p50/p95, long task, DOM 수 |
| 넓은 질의 | 공통 카테고리·짧은 코드 토큰·일치 수가 큰 질의 | 전체 결과 수와 초기 렌더링 수, 스크롤/입력 지연 |
| 요청 상태 | 카테고리 빠른 전환, 느린 응답, 404/500, 재시도 | 오래된 응답이 최신 결과를 덮어쓰지 않음 |
| 접근성 | Ctrl/Cmd+K, Tab/↑↓/Enter/Escape, 포커스 복귀 | 키보드로 열기·결과 이동·닫기·원위치 복귀 |
| 게시 안정성 | draft, slug 변경, 관련 링크, title/OG/canonical | 생성 산출물과 실제 배포 링크 일치 |
| 빌드 | cold/warm cache, Markdown/OG/검색 단계 분리 | 단계 시간·메모리·산출물 수, 동일 fixture 재현 |

추천 질의는 다음부터 시작한다.

- `의존성 주입`
- `트랜잭션`
- `반도체`
- `QQQ`
- `ＳＰＲＩＮＧ`
- 함수명/기호가 섞인 코드
- IDL 구간 문장

기대 결과는 실제 글에서 사람이 확인해 고정한다. 합성 글 복제는 규모 시험에는 쓰되,
검색 품질 정답셋에는 쓰지 않는다.

초기 예산 제안은 다음과 같다. 이는 현재 달성 수치가 아니라 baseline 측정 후 조정할
목표다.

- 기준 모바일 조건에서 warm 입력→결과 p95 100ms 이내
- 메인 스레드 50ms 이상 long task 최소화
- 미사용 인덱스 요청 0

### Pagefind 채택 판단

현재 JSON 검색을 즉시 교체하기보다 **정확성 수정본 / 경량화한 JSON 검색 / Pagefind**를
같은 질의 세트로 비교한다. Pagefind는 빌드한 정적 HTML을 색인할 수 있어 이 배포 구조의
후보가 된다. 그러나 현재 부분 문자열·티커·코드 검색과 자동으로 같은 결과가 된다고
가정해서는 안 된다.

[Pagefind 공식 시작 문서](https://pagefind.app/docs/)

공식 언어 문서는 한국어 UI 지원, 한국어 stemming 미지원, extended release의 중국어·일본어·
한국어 segmentation을 구분한다. 따라서 한국어 지원 유무만으로 판단하지 말고 복합어·조사·
부분어 recall을 검증해야 한다. 코드 검색은 별도 유지하는 혼합 구성도 후보로 둔다.

[Pagefind 언어 지원](https://pagefind.app/docs/multilingual/)

## 5. Next milestone

### 현재 진행 상태 (2026-10-06)

아래 표시는 원 검토일의 기록을 바꾸지 않고, 후속 계획과 현재 저장소 기록을 대조해
추가한 상태다. 이 절의 완료 조건은 현재 모두 충족했다. 구현 순서의 남은 작업과 확장
측정은 다음 절에 따로 표시한다. 근거는
[`docs/plan/astra-review-2026-09-12-follow-up.md`](plan/astra-review-2026-09-12-follow-up.md)와
[`docs/plan/21-search-access-and-scaling.md`](plan/21-search-access-and-scaling.md)다.

### 추천 milestone

**‘검색 정확성·공유 가능한 검색 상태·브라우저 검증 baseline’ — 기존 로드맵 21번 마무리.**

우선순위의 근거는 명확하다. 현재 502개 콘텐츠와 여러 탐색 UI가 이미 존재하며, 사용자가
원하는 글을 다시 찾는 정확성에 재현 가능한 결함이 있다. 새로운 추천 AI나 임베딩 시스템을
추가하기 전에 현재 검색이 게시된 본문을 의도한 범위 안에서 정확히 색인하도록 해야 한다.

### 완료 조건

- [완료] 구분선·표·코드·이미지 fixture에서 의도치 않은 본문 삭제가 없음을 확인했다.
- [완료] 전문/요약/코드 검색 범위를 명시하고 기대 질의 결과를 회귀 테스트로 고정했다.
- [완료] 빠른 검색과 전체 검색이 공통 Unicode 정규화를 사용한다.
- [완료] 검색어·모드·카테고리를 URL로 공유하고 새로고침·뒤로 가기로 복구한다.
- [완료] 실제 브라우저에서 지연 로딩, 요청 경쟁, 오류 복구, 키보드 동작을 검증했다. Playwright Chromium smoke 8개가 통과했다.
- [완료] 현재 503개 corpus와 1k/2k JSON 규모 비용을 기록하고, 현재 corpus의 JSON/Pagefind 비교를 근거로 Pagefind 전면 교체를 보류했다. Pagefind 1k/2k 합성 비교와 브라우저 입력→DOM·메모리 측정은 별도 후속 측정으로 남아 있다.

의존성 보안 분류·갱신은 milestone 이전 또는 별도 우선 변경으로 진행한다. ETF 메타데이터
백필은 그다음 콘텐츠 milestone으로 두고 기준일·출처를 검증하며 진행한다. 계좌 연동·
개인화 추천·댓글·뉴스레터 등으로 범위를 확대할 필요는 없다.

## 6. Recommended implementation order

| 순서 | 구현 묶음 | 완료 기준 | 현재 상태 (2026-10-06) |
|---|---|---|---|
| 1 | 의존성 audit 재분류·호환 업그레이드, SECURITY 갱신 | advisory별 노출/예외/해결 상태 명확, 기존 테스트·빌드 통과 | **완료.** 업그레이드 후 audit 0건과 high 이상 CI gate를 기록했다. 후속 audit 재실행은 registry 연결 오류였고, 이전 advisory JSON은 보존되지 않았다. |
| 2 | AGENTS/CLAUDE 관련 글 설명과 title 계약 수정 | 문서와 실제 추천 규칙 일치, 배포 title 중복 없음 | **완료.** title 계약과 `AGENTS.md`·`CLAUDE.md`의 관련 글 안내를 현재 시리즈·수동 링크·태그/토픽·카테고리 fallback 규칙에 맞췄다. |
| 3 | 검색 본문 추출 수정 및 fixture | 수평선 사이 본문 보존, 코드·표·이미지 처리 의도대로 동작 | **완료.** 구분선·표·코드·이미지·HTML fixture와 실제 IDL 검색 회귀를 확인했다. |
| 4 | 전체 검색 순수 함수 분리·정규화 통일·URL 상태 | 정답 질의와 공유/복귀 상태 회귀 통과 | **완료.** 검색 함수·공통 NFKC 정규화와 query/mode/category URL 복원 회귀를 구현했다. |
| 5 | 최소 브라우저 smoke suite·산출물 검사 | 키보드·지연 로딩·오류·요청 순서·draft 노출 검증 | **부분 완료.** Chromium smoke 8/8 통과. draft·slug·title 생성 산출물 검사를 자동화하는 후속 작업은 남아 있다. |
| 6 | baseline과 JSON/Pagefind 비교 | 품질 회귀 없이 전송량·입력 지연 개선이 확인될 때 채택 | **완료(결정까지).** 현재 JSON과 1k/2k JSON 비용, 현재 corpus Pagefind 비교를 기록하고 전면 교체를 보류했다. Pagefind 1k/2k 합성 비교와 브라우저 입력→DOM·메모리 계측은 미실시다. |
| 7 | 카테고리/slug 매핑 통합, 테스트 fixture 격리 | 새 분류 추가 시 검사/검색/RSS가 함께 일치 | **완료.** 공통 taxonomy/slug 로직을 연결했고 fixture는 OS 임시 디렉터리로 격리했다. |
| 8 | ETF·Reports의 기준일/검증일/비교 메타데이터 백필 | 출처 기반 필드 추가, 비교 가능 범위와 미입력 상태 명확 | **진행 중.** ETF 후보 29건은 모두 완료했다. Reports는 17건 중 5건(뉴로모픽 반도체, 실리콘 포토닉스, 저전력 메모리, 저전력 AI 칩, WBG 반도체)을 2026-10-06 기준으로 재검토하고 원자료 링크와 검증일을 반영했다. 남은 Reports 12건은 글별 검증이 필요하다. |
| 9 | 측정 결과에 따른 OG·리스트·빌드 최적화 | 해당 병목이 실제로 확인된 경우만 시행 | **조건부 미착수.** OG·목록·빌드 병목이 측정으로 확인될 때 시작한다. |

여러 기능이 이미 완료된 로드맵이므로, 완료 항목을 신규 구현으로 되풀이하지 않는다.
작은 문서·title 수정, 검색 의미 변경, 의존성 변경은 검토하기 쉽도록 각각 분리한다.

## 검토 범위의 한계

공개 사이트 일부 경로의 HTTP/HTML을 확인했지만 모바일·다크모드·키보드의 수동 시각 QA는
수행하지 않았다. 당시 브라우저 p95나 Pagefind 대비 우열을 실측했다고 주장하지 않는다.
게시물의 금융 수치·시장 전망·기술 설명 502개 전체에 대한 사실 검증은 별도 과제다.

## 후속 개발 시 참고 순서

1. 이 문서의 **P1** 이슈와 `docs/plan/21-search-access-and-scaling.md`를 먼저 확인한다.
2. 검색 의미를 바꾸기 전, 권장 질의와 fixture를 회귀 테스트로 고정한다.
3. 브라우저 동작은 `npm run check`나 빌드 성공만으로 완료 처리하지 않는다.
4. 의존성 변경은 `SECURITY.md`의 감사 상태와 호환성 검증을 함께 갱신한다.
5. 성능 최적화는 인덱스 크기, 입력 지연, DOM 수, 빌드 시간 중 실제 병목을 측정한 뒤 적용한다.
