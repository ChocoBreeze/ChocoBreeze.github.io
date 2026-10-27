# 35. 인쇄용 스타일

글 페이지를 인쇄하거나 PDF로 저장할 때 본문만 읽기 좋게 나오도록 합니다.

## 현재 동작

- `@media print` 규칙이 저장소 전체에 없습니다. 인쇄하면 헤더, 왼쪽 카테고리 사이드바, 오른쪽 목차, 글 도구 버튼, 관련 글, 이전·다음 글, 푸터가 모두 종이에 나옵니다.
- 글 레이아웃(`BlogPost.astro`의 `.blog-post-shell`)은 `240px | 본문 | 240px` 3열 grid라 인쇄 폭에서 본문이 좁아집니다.
- 다크 모드는 `[data-theme='dark']` 변수와 개별 규칙으로 구현되어 있습니다(`global.css` 6곳, `BlogPost.astro`·`Header.astro`·`GlobalSearchPalette.astro` 각 1곳). 브라우저는 기본 설정에서 배경을 인쇄하지 않으므로, 다크 모드에서 인쇄하면 밝은 글자가 흰 종이에 찍힙니다.
- 코드 블록은 Shiki `github-dark` 테마의 인라인 스타일(어두운 배경, 밝은 글자)입니다. 테마와 무관하게 배경이 빠지면 글자가 거의 보이지 않습니다.
- 레이아웃 스타일은 Astro scoped style이라 전역 CSS 선택자보다 우선순위가 높습니다.

## 목표

1. 인쇄물에 제목, 메타 정보, 기준일 안내, 본문만 남깁니다.
2. 화면 테마와 관계없이 흰 바탕에 어두운 글자로 인쇄합니다.
3. 외부 출처 링크는 종이에서도 주소를 알 수 있게 합니다.
4. 코드 블록, 표, 이미지가 페이지 경계에서 잘리지 않게 합니다.

## 범위

- 글 상세 페이지(`/blog/...`) 인쇄 스타일
- 인쇄 직전 라이트 테마 전환 스크립트
- 브라우저 테스트
- 포함하지 않음: 카테고리 목록·검색 등 다른 페이지 전용 조정, "인쇄" 버튼 추가, PDF 생성 기능

## 설계

### 숨길 요소

헤더, 푸터, 본문 바로가기 링크, 읽기 진행 표시줄, 카테고리 사이드바, 목차(데스크톱·모바일), 글 도구 버튼, 시리즈 탐색, 학습 경로, 관련 글, 이전·다음 글, 맨 위로 버튼, 이미지 확대 창, 코드 블록 복사 버튼.

기준일 안내(`freshness-notice`)는 금융 글에서 의미가 있으므로 남깁니다.

### 레이아웃

- `.blog-post-shell`을 1열 block으로 바꾸고 폭 제한과 여백을 없앱니다.
- `@page` 여백은 15mm로 둡니다.
- scoped style을 이기기 위해 인쇄 규칙의 `display`·레이아웃 속성에 `!important`를 씁니다.

### 테마

- CSS만으로 모든 다크 규칙을 되돌리면 규칙이 추가될 때마다 인쇄 쪽도 고쳐야 합니다. 대신 `beforeprint`에서 `data-theme`을 `light`로 바꾸고 `afterprint`에서 원래 값으로 돌립니다. `localStorage`의 사용자 선택은 바꾸지 않습니다.
- 스크립트는 테마 초기화가 있는 `BaseHead.astro`에 둡니다.

### 링크 주소

- 본문(`.post-body`) 안의 외부 링크(`http`로 시작) 뒤에 주소를 작은 글씨로 붙입니다. 긴 주소는 `word-break: break-all`로 줄바꿈합니다.
- 내부 링크(티커 링크, 관련 글 등)와 `#` 앵커는 붙이지 않습니다. Market Brief 표의 티커마다 사이트 주소가 붙으면 표를 읽기 어려워지기 때문입니다.
- 링크 텍스트가 주소와 같은 경우(GFM 자동 링크)에도 주소가 한 번 더 붙습니다. CSS로는 텍스트와 주소의 일치를 판별할 수 없어 감수합니다.

### 코드·표·이미지

- `pre`에 `print-color-adjust: exact`를 적용해 Shiki 배경을 유지합니다. `white-space: pre-wrap`으로 긴 줄을 접어 잘림을 막습니다.
- `pre`, `table`, `img`, `figure`, `blockquote`에 `break-inside: avoid`, 제목에 `break-after: avoid`를 적용합니다.

## 변경 후보

- `src/styles/global.css` — `@media print` 블록
- `src/components/BaseHead.astro` — `beforeprint`/`afterprint` 테마 전환
- `e2e/print.spec.mjs`(신규)

## 구현 단계

1. [완료] `global.css`에 `@media print` 블록을, `BaseHead.astro`에 `beforeprint`/`afterprint` 테마 전환을 추가했습니다.
2. [완료] `e2e/print.spec.mjs`에 브라우저 테스트 4개를 추가했습니다. 각 요소가 화면에서는 보이고 인쇄에서는 숨는지 함께 확인합니다.
3. [완료, 방식 변경] PDF는 만들었지만 이 PC에 PDF 렌더러(poppler)가 없어, 대신 print 미디어 에뮬레이션과 A4 본문 폭(680px)에서 다크 테마로 시작한 스크린샷으로 확인했습니다(`git-add-command-guide`, Market Brief `260411-weekly`, Problem Solving 1829). 쪽 나눔은 이 방식으로 확인되지 않습니다.
   - 확인 중 두 가지를 고쳤습니다. 다크→라이트 전환에 배경색 transition이 걸려 중간 색으로 찍힐 수 있어 인쇄 시 transition·animation을 끕니다. 코드 블록의 "복사" 버튼(`.code-copy-button`)도 숨깁니다.

## 테스트 설계

- print 미디어 에뮬레이션에서 헤더·사이드바·목차·관련 글·푸터가 보이지 않고 본문이 보이는지
- 본문 외부 링크의 `::after`에 주소가 들어가고 내부 링크에는 없는지
- 다크 테마에서 `beforeprint` 이벤트 후 `data-theme`이 `light`이고, `afterprint` 후 `dark`로 돌아오는지, `localStorage`가 바뀌지 않는지
- 화면(screen) 미디어에서는 기존 레이아웃이 그대로인지

## 검증

- `npm run build`, `npm run test:e2e`
- `npm run check`, `npm run format:check`
- 코드 블록이 있는 Programming 글, 표가 많은 Market Brief 글, 수식이 있는 글을 PDF로 저장해 확인
