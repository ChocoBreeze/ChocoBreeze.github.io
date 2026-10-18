# 30. 폰트·KaTeX 셀프 호스팅

23번 계획의 조건부 후보 중 `폰트·KaTeX 셀프 호스팅`을 별도 계획으로 승격한 문서입니다.

## 현재 동작

- `src/components/BaseHead.astro`는 `fonts.googleapis.com`과 `fonts.gstatic.com`에 `preconnect`한 뒤 Google Fonts에서 Inter 400/700과 Noto Sans KR 400/700을 받습니다.
- 같은 파일이 `cdn.jsdelivr.net`의 `katex@0.16.9` CSS를 직접 참조합니다. KaTeX 글꼴 파일은 그 CSS가 다시 외부에서 받아옵니다.
- `public/fonts/`에는 Atkinson 폰트만 있어 파일을 옮기는 것만으로는 대체되지 않습니다.
- OG 카드용 `Pretendard-Bold.otf`는 `src/assets/og/`에 벤더링되어 있고 빌드 시에만 쓰입니다.
- 결과적으로 모든 페이지가 렌더 블로킹 외부 도메인 두 곳에 의존합니다.

## 목표

1. 글꼴과 수식 스타일의 외부 도메인 의존을 제거합니다.
2. 한글 본문 폰트의 전송량을 서브셋으로 줄입니다.
3. 변경 전후의 네트워크·렌더 수치를 기록해 효과를 확인합니다.

## 착수 조건 확인

23번 계획이 요구한 조건을 이 문서에서 충족시킨 뒤 구현에 들어갑니다.

- [완료] 2026-10-18 측정. 글 페이지 1회 로드(콜드 캐시) 기준 서드파티 요청 16건 482,648 B. `fonts.googleapis.com` CSS 1건(압축 전 193,752 B, 실제 전송 46,854 B, 렌더 블로킹), `fonts.gstatic.com` 폰트 14건 271,848 B(Noto Sans KR 13건 223,592 B, Inter 1건 48,256 B), `cdn.jsdelivr.net` KaTeX CSS 1건 23,196 B.
- [완료, 방침 변경] 웹폰트를 자체 호스팅하는 대신 제거했습니다. 근거는 아래 `글꼴 결정`에 적었습니다.
- [완료] 웹폰트를 싣지 않으므로 글꼴 라이선스 동봉은 필요 없습니다. KaTeX는 `public/katex/LICENSE`로 함께 둡니다.
- [완료] `scripts/vendor-katex.mjs`가 설치된 `katex`에서 CSS와 woff2를 복사하고 CSS 첫 줄에 버전을 적습니다. `scripts/test/vendored-katex.test.mjs`가 설치 버전과 벤더링된 버전이 어긋나면 실패합니다.

## 범위

- 본문 글꼴의 외부 의존 제거
- KaTeX CSS 및 글꼴 자산의 자체 호스팅
- `preconnect`·`preload` 정리
- 본문 글꼴 자체를 다른 서체로 교체하는 디자인 변경은 포함하지 않음

## 글꼴 결정

측정 뒤 선택지는 셋이었습니다.

| | 외부 도메인 | 콜드 방문 전송 | 저장소 | 글꼴 모양 |
| --- | ---: | ---: | ---: | --- |
| A. 현재 유지 | 2곳 | 272 KB | +0 | 모든 OS 동일 |
| B. 전체 자체 호스팅 | 0곳 | 약 272 KB | +4.0 MB(woff2 131개) | 모든 OS 동일 |
| C. 웹폰트 제거 | 0곳 | 0 KB | +0 | OS마다 다름 |

B는 Noto Sans KR이 한글을 124개 서브셋으로 나눠 제공해 저장소에 4.0 MB를 영구히 싣게 되고, 그 대가로 얻는 것은 "외부 장애 시에도 같은 글꼴" 정도였습니다. 한글 폴백(Apple SD Gothic Neo, Malgun Gothic, Noto Sans CJK KR)은 모두 OS 기본 글꼴이라 품질 차이가 작아 **C를 선택**했습니다.

영문 폴백을 `Arial`로 두면 인상이 크게 바뀌므로 시스템 UI 글꼴을 앞에 둡니다.

```css
font-family:
  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR',
  'Helvetica Neue', Arial, sans-serif;
```

받아들인 비용: OS마다 글자 폭이 달라 줄바꿈 위치가 미세하게 달라집니다.

## 변경 후보

- `public/fonts/` — 자체 호스팅 자산
- `src/components/BaseHead.astro` — 링크 정리
- `src/styles/global.css` — `@font-face`와 폰트 스택
- `scripts/check-build-artifacts.mjs` — 외부 폰트·CSS 참조가 남아 있지 않은지 검사
- `README.md`, `DESIGN.md` — 자산 출처와 라이선스 기록

## 구현 단계

1. [완료] 위 착수 조건에 기록했습니다.
2. [해당 없음] 웹폰트를 제거해 `public/fonts/`에 추가한 자산이 없습니다.
3. [완료] Google Fonts 링크와 `preconnect` 2개를 `BaseHead.astro`에서 제거하고, `global.css`의 본문 글꼴 스택을 시스템 글꼴로 바꿨습니다.
4. [완료] `/katex/katex.min.css`와 woff2 20개를 자체 호스팅합니다. 수식이 있는 글에서 `KaTeX_Main-Regular.woff2`·`KaTeX_Math-Italic.woff2`가 같은 오리진에서 로드되고 수식이 정상 렌더링되는 것을 확인했습니다.
5. [완료] `findExternalAssetReferencesInHtml()`이 빌드 산출물의 `<link>`·`<script>`에서 알려진 CDN 호스트 참조를 찾으면 실패합니다.
6. [완료] 아래에 기록했습니다.

## 테스트 설계

- 수식이 포함된 글의 렌더 결과를 전후 비교
- 한글·영문·코드 블록에서 글꼴 폴백이 바뀌지 않는지 확인
- 다크 모드와 인쇄 스타일에서 글꼴 적용 확인
- 빌드 산출물 HTML·CSS에 외부 폰트 도메인 참조가 없는지 검사
- 글꼴 자산 누락 시 폴백 스택으로 읽을 수 있는지 확인

## 검증

- `npm run build` 및 `npm run check:build-artifacts`
- `npm run test:e2e`
- `npm run format:check`
- 브라우저에서 글 상세·검색·카테고리 페이지 수동 확인

### 2026-10-18 구현 결과

| 항목 | 이전 | 이후 |
| --- | ---: | ---: |
| 서드파티 요청(글 페이지) | 16건 | **0건** |
| 서드파티 전송량 | 482,648 B | **0 B** |
| 외부 도메인 | 3곳 | 0곳 |
| 저장소 증가 | — | +328 KB(KaTeX) |
| KaTeX CSS 버전 | 0.16.9(CDN) | 0.16.47(설치 버전과 일치) |

- 본문 글꼴은 웹폰트를 전혀 받지 않습니다. 브라우저에서 `document.fonts`에 로드된 웹폰트가 없고, 수식이 있는 글에서만 KaTeX 글꼴 2개가 같은 오리진에서 로드됩니다.
- `npm test` 327개 통과(KaTeX 벤더링 7개, 외부 참조 검사 5개 추가), `npm run check` 0 errors
- `npm run build` 성공, `npm run check:build-artifacts` 통과, `npm run test:e2e` 11개 통과, `npm run format:check` 통과
- 남은 후속: `public/fonts/`의 Atkinson 글꼴 2개는 어떤 CSS에서도 참조하지 않습니다. 25번 계획의 미사용 자산 검사는 현재 이미지 확장자만 보므로 잡히지 않습니다. 정리 여부는 별도로 판단합니다.

## 범위 제외

- 본문 서체 교체
- 가변 폰트 도입
- 외부 CDN을 다른 CDN으로 바꾸는 선택
