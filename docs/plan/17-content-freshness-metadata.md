# 17. 콘텐츠 기준일과 검증일

## 현재 동작

- 스키마와 글 상세가 `updatedDate`, `verifiedDate`, `dataAsOf`를 각각 문서 수정일·사실 검증일·수치 기준일로 표시합니다.
- ETF·기업 분석·산업 리포트에는 시간이 지나면 변하는 보수율, AUM, 가격, 시장 수치가 포함됩니다.
- ETF·Reports 일부 파일럿 글에는 기준일 메타데이터가 적용되어 있으며, 수치 오래됨 경고는 `dataAsOf`를 우선하고 없으면 `verifiedDate`를 사용합니다.
- 오래됨 경고는 ETF와 Reports에만 365일 기준으로 적용되고, 브라우저에서 현재 날짜를 다시 계산합니다.

## 목표

- 문서 수정일, 사실 재검증일, 데이터 기준일을 구분합니다.
- 오래된 수치를 최신 정보처럼 오인하지 않도록 글 상세에 문맥을 제공합니다.

## 데이터 모델

- `updatedDate`: 문서 내용이나 구조를 수정한 날짜
- `verifiedDate`: 핵심 사실과 출처를 다시 확인한 날짜
- `dataAsOf`: 표와 수치가 대표하는 기준일

세 필드는 ISO 8601 형식을 사용합니다. Git 커밋 시각을 자동으로 대입하지 않습니다.

## 변경 후보

- `src/content.config.ts`
- `src/layouts/BlogPost.astro`
- `src/components/BlogPostCard.astro` — 필요 시
- `scripts/check-content.mjs`
- `scripts/lib/content-rules.mjs`
- `scripts/test/content-rules.test.mjs`
- `scripts/new-post.mjs`, `templates/post.md`
- ETF·Reports 파일럿 글 소수

## 구현 단계

1. [완료] 필드 타입·엄격한 ISO 형식·날짜 순서 규칙을 스키마와 콘텐츠 검사에 추가했습니다.
2. [완료] 글 상세에 문서 수정일·사실 검증일·수치 기준일 레이블을 표시합니다.
3. [완료] ETF·Reports에 365일 오래됨 정책을 적용하고 Market Brief 같은 역사적 스냅샷은 대상에서 제외했습니다.
4. [완료] 대표 ETF·Reports 글에 파일럿 메타데이터를 적용했습니다.
5. [완료] 새 글 템플릿과 `scripts/new-post.mjs`에 날짜 필드와 검증 옵션을 반영했습니다.
6. [진행 예정] 기존 글 전체 백필은 별도 콘텐츠 작업으로 분리합니다.

## 테스트 설계

- 세 날짜 필드의 유효·무효 ISO 입력 검사
- 날짜 일부 또는 전부가 없을 때 레이아웃 확인
- `dataAsOf`가 `verifiedDate`보다 미래인 비정상 조합의 정책 확인
- Market Brief에 불필요한 오래됨 경고가 나타나지 않는지 확인
- OG·RSS·검색·빌드가 신규 필드 없이도 정상인지 회귀 확인
- `npm test`, `npm run check:content`, `npm run check`, `npm run build`

## 후속 결정 사항

- ETF와 Reports의 365일 기준을 향후 분리할지 여부
- 목록 카드에도 검증일을 노출할지 여부
- 하나의 글에 여러 데이터 기준일이 있을 때 본문 표기와 frontmatter의 역할 분담
