# 11. OG 이미지 생성 규모 축소 (보류 — 필요 시 착수)

> 상태: **보류.** 현재 빌드 비용(~10초, ~20MB)은 GitHub Actions 무료 한도에서
> 문제되지 않는 수준이라 지금 당장 할 이유는 없다. 포스트 수가 크게 늘어
> 빌드가 느려지면 그때 이 문서대로 착수한다.

## 배경

`src/pages/og/[...slug].png.ts`는 `heroImage`/`image`가 없는 **모든** 공개 포스트에
대해 빌드 시 OG 카드 PNG를 생성한다. 현재 412개 중 이미지 없는 포스트 전량이 대상이라
빌드 시간 약 +10초, `dist` 용량 약 +20MB가 늘었다.

포스트가 수천 개 규모로 커지면 이 비용이 선형으로 증가하므로, 그 시점에 생성 대상을
줄이는 것이 목표다.

## 판단 기준 (언제 착수하나)

아래 중 하나라도 체감되면 착수:

- OG 생성이 전체 빌드 시간의 눈에 띄는 병목이 됨 (예: OG 단계만 30초+).
- `dist` 용량이 GitHub Pages 배포에 부담될 만큼 커짐.
- 실제로 SNS 공유가 일어나는 포스트가 일부에 한정된다는 게 분명해짐.

## 변경 대상 파일

- `src/pages/og/[...slug].png.ts` — `getStaticPaths`의 `.filter(...)` 조건.
- (선택) `src/pages/blog/[...slug].astro` — OG 폴백 URL을 넘길지 결정하는 부분.
- (선택) `src/layouts/BlogPost.astro` — `ogImage` 폴백 처리.

> ⚠️ CLAUDE.md("Open Graph images" 절)에 명시된 규칙: `og/[...slug].png.ts`의
> `getStaticPaths` 필터와 `BlogPost`의 폴백은 **항상 동일한 대상 집합**을 가리켜야 한다.
> 한쪽만 좁히면 나머지 포스트가 존재하지 않는 `/og/<slug>.png`를 참조하게 된다.
> 아래 어떤 방식을 택하든 두 곳을 반드시 함께 맞춘다.

## 구현 옵션 (택1)

### A. 최근 글만 생성

가장 단순. 정렬 후 상위 N개만 남긴다.

```ts
// getStaticPaths 안
const posts = await getPublishedPosts();
const RECENT_LIMIT = 100;
return posts
  .filter((post) => !hasOwnImage(post))
  .sort((a, b) => {
    const da = a.data.pubDate || a.data.date || new Date(0);
    const db = b.data.pubDate || b.data.date || new Date(0);
    return db.valueOf() - da.valueOf(); // 최신 우선
  })
  .slice(0, RECENT_LIMIT)
  .map(/* ... 기존과 동일 ... */);
```

- 장점: 구현 최소, 공유가 잦은 최신 글을 자연히 커버.
- 폴백 동기화: `BlogPost`/`blog/[...slug].astro`에서 "이미지 없음 + 최근 N개"가
  아니면 `ogImage`를 넘기지 않도록 같은 조건을 재현해야 한다. 이 조건 중복이 부담이면
  옵션 B가 더 깔끔하다.

### B. 프론트매터 옵트인 (`ogImage: true` 같은 플래그)

포스트가 스스로 "나는 OG 카드가 필요하다"를 선언.

- `src/content.config.ts` 스키마에 `generateOg: z.boolean().optional()` 추가.
- 필터를 `!hasOwnImage(post) && post.data.generateOg`로 변경.
- 폴백 동기화: `BlogPost` 쪽도 동일 플래그를 그대로 읽으면 되므로 조건이 한 곳으로
  모여 A보다 동기화 실수가 적다.
- 단점: 대상 포스트마다 프론트매터를 손봐야 함(마이그레이션 비용).

### C. 카테고리 화이트리스트

`Market Brief`처럼 공유가 잦은 카테고리만 생성.

- 필터에 `SHARE_HEAVY_CATEGORIES.has(getPrimaryCategory(post))` 추가.
- 장점: 포스트 개별 수정 불필요.
- 단점: 카테고리 단위라 세밀하지 않음.

## 권장

포스트가 폭증해서 착수하게 되는 시점이라면 **옵션 A(최근 N개)** 가 비용 대비 효과가
가장 좋다. 다만 폴백 동기화 로직이 두 파일에 중복되는 게 싫으면 **옵션 B**가 유지보수상
깔끔하다.

## 검증

- `npm run build` — 성공 및 OG 단계 소요 시간/`dist` 용량 변화 확인.
- 생성 대상 포스트의 `/og/<slug>.png`가 실제로 존재하는지 확인.
- 생성 **제외** 포스트의 HTML `og:image`가 깨진 `/og/...` 링크를 가리키지 않는지 확인
  (폴백 동기화가 맞는지 검증).
- `npm run check` — 0 errors.
