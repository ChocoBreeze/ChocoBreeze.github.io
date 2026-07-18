# 5. draft 프론트매터 지원

## 배경

- 스키마(`src/content.config.ts`)에 draft 개념이 없어, 작성 중인 글을 커밋하면 무조건 공개된다.
- 여러 날에 걸쳐 쓰는 시리즈 글이나 예약 발행 성격의 글을 저장소에 두기 어렵다.

## 목표

`draft: true`인 포스트는 빌드 결과물 어디에도 나타나지 않게 한다: 개별 페이지, 카테고리 목록, 홈, 아카이브, 태그, 검색 인덱스, RSS, sitemap.

## 변경 대상

1. `src/content.config.ts` — 스키마에 `draft: z.boolean().optional().default(false)` 추가.
2. **포스트 조회 공통화 (핵심)** — 현재 각 페이지가 `getCollection('blog')`을 직접 호출하는 구조라면, 필터를 한 곳에 모은다:
   - 신규 `src/lib/posts.ts`에 `getPublishedPosts()` 헬퍼 작성: `getCollection('blog', ({ data }) => !data.draft)`.
   - 사용처 전수 교체: `src/pages/` 하위 (index, blog/[...slug], 카테고리 8곳, archive, tags, search.json, code-search.json, rss 관련), `src/lib/rss.js`, `src/lib/searchIndex.ts` 등. `getCollection('blog')` 호출부를 grep으로 전수 조사 후 교체한다.
3. `scripts/check-content.mjs` — draft 필드 허용 (unknown field 검사가 있다면 whitelist에 추가). draft 글은 중복 제목/route 검사에서 제외할지 결정 필요 → **포함 유지 권장** (publish 시점에 놀라지 않도록).
4. `templates/post.md` / `scripts/new-post.mjs` — (선택) `--draft` 옵션 추가 시 frontmatter에 `draft: true` 삽입.
5. `CLAUDE.md` / `AGENTS.md` — draft 규칙 문서화.

## 구현 단계

1. 스키마에 필드 추가.
2. `grep -rn "getCollection('blog'" src/` 로 사용처 전수 파악.
3. `src/lib/posts.ts` 헬퍼 작성 후 사용처 일괄 교체. sitemap은 페이지가 생성되지 않으면 자동 제외되므로 별도 처리 불필요.
4. draft 테스트 포스트를 만들어 빌드 → dist에서 부재 확인 → 테스트 포스트 삭제.
5. check-content.mjs 및 문서 반영.

## 검증

1. `draft: true` 테스트 포스트 생성 후 `npm run build`:
   - `dist/blog/<slug>/` 미생성 확인.
   - `dist/search.json`, `dist/rss.xml`, `dist/sitemap-*.xml`에 해당 글 부재 확인 (grep).
   - 카테고리 목록 페이지에 카드 부재 확인.
2. `npm run check:content` 통과 확인.
3. `npm run dev`에서는 draft가 보이도록 할지 결정 (Astro 관례: dev에서도 필터 동일 적용이 단순. 미리보기가 필요하면 `import.meta.env.DEV` 조건으로 dev에서만 노출).

## 리스크 / 참고

- 사용처 누락이 가장 큰 리스크. **grep 전수 조사 → 헬퍼로 단일화**가 핵심이며, 이후 새 페이지도 헬퍼만 쓰도록 CLAUDE.md에 명시한다.
- 6번 계획(check-content 테스트)과 같은 파일을 수정하므로 연달아 진행하면 효율적이다.
