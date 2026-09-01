# 14. 홈 콘텐츠 피드

## 현재 동작

- 홈은 프로필, Finance·Semiconductor·Computing 허브 카드, 다짐 목록과 콘텐츠 피드로 구성됩니다.
- `src/lib/homeFeed.mjs`가 공개 글에서 시작하기 좋은 글, 최근 글, 분야별 최근 글을 중복 없이 구성하고 각 카드가 개별 글로 연결됩니다.
- 공개 글 판정은 `getPublishedPosts()`가 단일 진입점이며 production에서 draft를 제외합니다.

## 목표

약 500개의 글이 홈에서 실제 콘텐츠로 연결되도록 하되, 홈의 개인 소개 성격은 유지합니다.

## 권장 정보 구조

1. 기존 소개와 분야 카드 유지
2. 시작하기 좋은 글: `pinned` 글 중 중복을 제거한 소수 항목
3. 최근 글: 전체 공개 글에서 최신 글 6개 내외
4. 분야별 최근 글: Finance·Semiconductor·Computing에서 각 소수 항목

정확한 노출 개수는 구현 시 모바일 밀도와 중복 정도를 보고 확정합니다.

## 변경 후보

- `src/pages/index.astro`
- `src/components/BlogPostCard.astro` 또는 홈 전용 소형 카드
- `src/lib/posts.ts` 또는 홈 집계용 순수 유틸리티
- `src/data/blogCategories.ts`

## 구현 단계

1. [완료] 홈에서 사용할 정렬 규칙과 중복 제거 규칙을 `buildHomeFeed()`로 정의했습니다.
2. [완료] `getPublishedPosts()`로만 데이터를 가져와 draft 노출을 막습니다.
3. [완료] 기존 `BlogPostCard`를 홈 피드 밀도에 맞게 사용합니다.
4. [완료] 시작하기 좋은 글·최근 글·분야별 최근 글에 전체 보기 링크와 명확한 제목을 제공합니다.
5. [완료] 이미지가 있는 카드의 lazy loading과 크기 속성을 유지합니다.

## 테스트 설계

- draft가 production 홈 피드에 포함되지 않는지 확인
- 날짜가 없는 레거시 글과 같은 날짜의 글이 있어도 정렬이 안정적인지 확인
- pinned와 최신 글 사이 중복 처리 확인
- 글이 없는 분야에서도 홈이 깨지지 않는지 확인
- 긴 한글 제목과 이미지 없는 카드의 모바일 레이아웃 확인
- `npm run check`, `npm run build`, `npm run format:check`

## 완료 조건

- 홈에서 개별 공개 글로 직접 이동할 수 있습니다.
- 소개 영역을 지나치게 밀어내지 않고 모바일에서 한 열로 읽을 수 있습니다.
- 카테고리 정의를 별도로 중복 관리하지 않습니다.
