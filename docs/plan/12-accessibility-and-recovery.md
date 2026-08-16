# 12. 문서 언어와 404 복구

## 현재 동작

- 한국어가 주 언어인 홈, 글 상세, 카테고리 목록, 검색, 상위 허브 일부가 `<html lang="en">`을 사용합니다.
- `src/pages/404.astro`가 없어 GitHub Pages 기본 오류 화면에 의존합니다.
- 헤더의 본문 바로가기 링크와 여러 페이지의 `lang="ko"` 적용은 이미 존재합니다.

## 목표

1. 한국어 페이지의 문서 언어를 일관되게 `ko`로 선언합니다.
2. 잘못된 URL에서도 검색과 주요 콘텐츠로 복귀할 수 있는 자체 404 페이지를 제공합니다.

## 변경 범위

- `src/layouts/BlogPost.astro`
- `src/layouts/BlogListLayout.astro`
- `src/pages/index.astro`
- `src/pages/search.astro`
- `src/pages/finance/index.astro`
- `src/pages/computing/index.astro`
- `src/pages/market-brief/index.astro`
- 신규 `src/pages/404.astro`

반복되는 HTML 뼈대를 공통 레이아웃으로 전면 리팩터링하는 작업은 범위에서 제외합니다.

## 구현 단계

1. `lang="en"`을 사용하는 실제 한국어 페이지를 다시 검색해 대상 목록을 확정합니다.
2. 대상 문서의 언어를 `ko`로 변경합니다.
3. 404 페이지에 오류 설명, `/search/`, 주요 상위 허브, 홈 링크를 제공합니다.
4. 404 페이지의 링크와 포커스 스타일을 기존 디자인 토큰에 맞춥니다.

## 테스트 설계

- `npm run check`
- `npm run build`
- `dist/404.html` 생성 확인
- 빌드 결과의 주요 페이지에 `lang="ko"`가 들어가는지 확인
- 404 페이지를 모바일·다크 모드에서 확인
- 키보드만으로 검색·홈·카테고리 링크에 접근 가능한지 확인

## 완료 조건

- 한국어 주요 페이지에 잘못된 `lang="en"` 선언이 남지 않습니다.
- 존재하지 않는 경로에서 프로젝트 디자인의 404 페이지가 표시됩니다.
- 404 페이지에서 최소 두 가지 복구 경로를 사용할 수 있습니다.
