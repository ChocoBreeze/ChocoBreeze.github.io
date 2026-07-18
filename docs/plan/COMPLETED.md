# 개발 완료 내역 (2026-07-19)

[README](README.md)의 10가지 개선 계획을 모두 구현·리뷰·배포했습니다.
각 항목의 계획 문서와 실제 반영 커밋을 함께 기록합니다.

## 완료 목록

| # | 계획 | 상태 | 커밋 |
|---|------|------|------|
| 1 | [deploy 워크플로 검증 단계 추가](01-deploy-validation.md) | ✅ 완료 | `85fd475` Run content and type checks before Pages deploy |
| 2 | [git hook 버전 관리](02-versioned-git-hooks.md) | ✅ 완료 | `2b24051` Version the pre-commit hook under scripts/hooks |
| 3 | [deploy concurrency 설정](03-deploy-concurrency.md) | ✅ 완료 | `aac8536` Serialize Pages deploys with a concurrency group |
| 4 | [카테고리 목록 페이지네이션](04-category-pagination.md) | ✅ 완료 | `b12ea02` Paginate category lists with a client-side "더 보기" |
| 5 | [draft 프론트매터 지원](05-draft-support.md) | ✅ 완료 | `944ae37` Support draft posts excluded from production builds |
| 6 | [check-content.mjs 테스트](06-check-content-tests.md) | ✅ 완료 | `a760b27` Extract content-check rules into a tested module |
| 7 | [Node 버전 단일 소스화](07-node-version-single-source.md) | ✅ 완료 | `582a18c` Single-source the Node version via .nvmrc |
| 8 | [OG 이미지 자동 생성](08-og-image-generation.md) | ✅ 완료 | `7c5594d` Generate OG images for posts without a hero image |
| 9 | [Prettier 도입](09-prettier.md) | ✅ 완료 | `0d93a52` Add Prettier with an Astro-aware config · `69fa1e0` Apply Prettier formatting · `b9e3e7b` Ignore the bulk-format commit in git blame |
| 10 | [문서 카테고리 목록 동기화](10-docs-category-sync.md) | ✅ 완료 | `d85ad2d` Delegate category lists in docs to blogCategories.ts |

## 보류 항목

| # | 계획 | 상태 | 비고 |
|---|------|------|------|
| 11 | [OG 이미지 생성 규모 축소](11-og-image-scaling.md) | ⏸️ 보류 | 현재 빌드 비용(~10초/~20MB)이 부담 없어 착수 불필요. 포스트 폭증 시 문서대로 진행. |

## 검증

최종 게이트 전부 통과 후 `main`에 push 완료:

- `npm test` — PASS
- `npm run format:check` — PASS
- `npm run check:content` — PASS (412개 파일)
- `npm run check` (astro check) — 0 errors
- `npm run build` — PASS (675 pages)
