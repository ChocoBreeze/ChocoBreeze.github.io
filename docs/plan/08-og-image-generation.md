# 8. OG 이미지 자동 생성 (선택 사항)

## 배경

- `BaseHead.astro`는 og:image(1200×630)와 twitter:card를 이미 출력하지만, 포스트별 이미지가 없으면 공용 이미지로 대체된다.
- 포스트 제목이 들어간 OG 이미지를 빌드 시 자동 생성하면 SNS/메신저 공유 시 클릭률이 올라간다.

## 목표

`heroImage`가 없는 포스트에 대해 제목·카테고리가 들어간 1200×630 OG 이미지를 빌드 시 정적 생성한다.

## 설계 선택

- 라이브러리: `satori`(JSX → SVG) + `sharp`(SVG → PNG, **이미 의존성에 있음**). devDependency로 `satori`만 추가.
- 생성 방식: Astro 엔드포인트 `src/pages/og/[...slug].png.ts` — `getStaticPaths()`로 전 포스트 경로를 만들고, GET 핸들러에서 satori로 렌더 후 PNG 반환. 빌드 시 정적 파일로 떨어진다.
- 한글 렌더링을 위해 한글 폰트 서브셋(예: Pretendard/Noto Sans KR의 woff → ttf)을 `src/assets/fonts/`에 두고 satori에 전달해야 한다. **폰트 라이선스 확인 필수** (Pretendard: OFL, 문제 없음).

## 변경 대상

1. `package.json` — `satori` devDependency 추가.
2. **신규** `src/pages/og/[...slug].png.ts` — OG 이미지 엔드포인트.
3. **신규** `src/lib/ogTemplate.ts` (가칭) — satori용 레이아웃 정의 (제목, 카테고리 라벨, 사이트명; 카테고리별 색상은 `blogCategories.ts` 참조).
4. `src/components/BaseHead.astro` — 포스트 페이지에서 `heroImage` 부재 시 `/og/<slug>.png`를 og:image로 사용하도록 분기.
5. `src/assets/fonts/` — 한글 폰트 파일 추가.

## 구현 단계

1. satori + 한글 폰트로 단일 이미지 생성 PoC (scratchpad에서 확인).
2. 엔드포인트·템플릿 구현, 포스트 2~3개로 결과 확인.
3. BaseHead 분기 연결.
4. 전체 빌드로 412개 이미지 생성 시간 측정.

## 검증

1. `npm run build` 후 `dist/og/<slug>.png` 생성 확인, 몇 개 열어 한글 렌더링·레이아웃 확인.
2. 빌드 시간 증가 측정 (아래 리스크 참조).
3. OG 디버거(카카오톡 미리보기, opengraph.xyz 등)로 실제 공유 카드 확인.

## 리스크 / 참고

- **빌드 시간**: 412개 × satori+sharp 렌더링으로 빌드가 수 분 늘어날 수 있다. 허용 불가 수준이면 (a) 최근 N개월 글만 생성, (b) 캐싱(생성물 커밋) 등을 검토.
- 긴 제목 줄바꿈/말줄임 처리 필요 — 템플릿에서 2줄 제한 + ellipsis.
- 우선순위 낮음: 다른 계획들과 독립적이며, 미착수로 남겨도 무방하다.
