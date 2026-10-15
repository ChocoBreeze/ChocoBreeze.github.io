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

- [미착수] 실제 네트워크 워터폴과 렌더 블로킹 시간 측정
- [미착수] 사용할 글꼴 굵기와 한글 서브셋 범위 결정
- [미착수] 라이선스 확인 및 `OFL`·고지 파일 동봉 방식 결정
- [미착수] KaTeX CSS와 연관 글꼴 자산의 버전 관리 방법 결정

## 범위

- 본문·제목 글꼴의 자체 호스팅과 `font-display` 정책
- KaTeX CSS 및 글꼴 자산의 자체 호스팅
- `preconnect`·`preload` 정리
- 본문 글꼴 자체를 다른 서체로 교체하는 디자인 변경은 포함하지 않음

## 변경 후보

- `public/fonts/` — 자체 호스팅 자산
- `src/components/BaseHead.astro` — 링크 정리
- `src/styles/global.css` — `@font-face`와 폰트 스택
- `scripts/check-build-artifacts.mjs` — 외부 폰트·CSS 참조가 남아 있지 않은지 검사
- `README.md`, `DESIGN.md` — 자산 출처와 라이선스 기록

## 구현 단계

1. [미착수] 현재 워터폴을 측정하고 외부 요청 수·전송량·첫 렌더 시점을 기록합니다.
2. [미착수] 필요한 굵기와 한글 서브셋을 확정하고 라이선스·고지 파일을 포함해 `public/fonts/`에 추가합니다.
3. [미착수] `@font-face`로 전환하고 Google Fonts 링크와 `preconnect`를 제거합니다.
4. [미착수] KaTeX CSS와 글꼴을 자체 호스팅으로 전환하고, 수식이 있는 글에서 렌더 결과를 비교합니다.
5. [미착수] 외부 참조 잔존 검사를 `check:build-artifacts`에 추가합니다.
6. [미착수] 전후 수치를 이 문서에 기록합니다.

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

## 범위 제외

- 본문 서체 교체
- 가변 폰트 도입
- 외부 CDN을 다른 CDN으로 바꾸는 선택
