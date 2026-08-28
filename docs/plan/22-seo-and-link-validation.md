# 22. 구조화 데이터와 링크 검증 강화

## 현재 동작

- `BaseHead.astro`는 canonical, Open Graph, Twitter, RSS 메타데이터를 제공합니다.
- JSON-LD는 없습니다.
- `check:content`는 Markdown 내부 링크, 생성된 `/blog/...` 경로, `src/pages`의 정적 경로를 검사합니다.
- `#소제목`만 있는 앵커와 대상 문서의 실제 heading ID는 검사하지 않습니다.

## 목표

1. 글과 사이트 계층을 검색엔진에 명시적으로 설명합니다.
2. 확실하게 깨진 내부 글 링크는 커밋 전에 차단합니다.
3. 링크 검사를 기존 경고 체계를 무너뜨리지 않는 범위에서 확장합니다.

## JSON-LD 범위

- 글 상세: `BlogPosting`
- 탐색 계층: `BreadcrumbList`
- 제목, 설명, canonical URL, 대표 이미지, 발행일, 수정일, 작성자
- 16·17번이 구현된 경우 시리즈·검증일 중 표준 속성에 맞는 정보만 선택적으로 연결

JSON-LD는 검색 순위나 리치 결과를 보장하는 기능으로 표현하지 않습니다.

## 링크 검사 범위

- 생성 경로 목록에 없는 명시적 `/blog/...` 링크는 오류로 승격
- 알려진 Astro 정적 페이지 경로 검사
- 대상 글의 heading ID와 URL fragment 비교
- 외부 링크의 네트워크 생존 여부 검사는 포함하지 않음

## 변경 후보

- `src/components/BaseHead.astro`
- `src/layouts/BlogPost.astro`
- `src/pages/blog/[...slug].astro`
- `scripts/check-content.mjs`
- `scripts/lib/content-rules.mjs`
- `scripts/test/content-rules.test.mjs`

## 구현 단계

1. [완료] JSON-LD에 필요한 값을 기존 Props에서 확인하고 순수 생성 함수를 추가했습니다.
2. [완료] JSON 직렬화 시 `<` 등 스크립트 문맥 문자를 안전하게 처리합니다.
3. [완료] `BlogPosting`을 글 상세 레이아웃에 적용하고 빌드 HTML을 검증합니다.
4. [완료] 실제 사용자 경로를 반영한 `BreadcrumbList`를 추가합니다.
5. [완료] 링크 검사를 `확실한 오류`와 `레거시 경고`로 구분합니다.
6. [진행 중] `/blog/...` 누락을 오류로 승격하고 정적 Astro 경로를 인덱싱했습니다. 앵커 검사는 후속 단계로 남깁니다.

## 테스트 설계

- JSON-LD가 유효한 JSON이며 canonical·날짜·이미지 URL이 절대 URL인지 확인
- 대표 이미지·updatedDate가 없는 글의 JSON-LD 확인
- 제목에 따옴표·한글·`<`가 있는 글의 직렬화 확인
- 존재·부재하는 글 링크, 쿼리·해시·후행 슬래시 조합
- 한글·중복·특수문자 heading 앵커 검사
- staged warnings 정책이 기존 레거시 글 전체를 매번 출력하지 않는지 확인
- `npm test`, `npm run check:content`, `npm run check`, `npm run build`

## 리스크

- Astro와 Markdown의 heading slug 규칙을 단순 정규식으로 재구현하면 오탐이 생길 수 있습니다. 가능한 한 렌더 단계와 동일한 slug 생성 로직을 공유합니다.
- 오류 승격 전에 현재 경고 목록을 기준선으로 저장하고 실제 오탐을 먼저 제거합니다.
