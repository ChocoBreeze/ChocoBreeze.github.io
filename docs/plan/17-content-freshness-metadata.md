# 17. 콘텐츠 기준일과 검증일

## 현재 동작

- 스키마에 `updatedDate`가 있고 글 상세가 이를 표시할 수 있지만 실제 사용 글은 없습니다.
- ETF·기업 분석·산업 리포트에는 시간이 지나면 변하는 보수율, AUM, 가격, 시장 수치가 포함됩니다.
- 문서 수정과 수치 검증을 구분하는 필드는 없습니다.

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

1. 필드 타입과 ISO 형식 규칙을 스키마와 콘텐츠 검사에 추가합니다.
2. 글 상세에 각 날짜의 의미가 구분되는 레이블을 표시합니다.
3. 카테고리별 오래됨 정책을 정의합니다. Market Brief 같은 역사적 스냅샷은 자동 경고 대상에서 제외합니다.
4. 대표 ETF·Reports 글에만 파일럿 적용합니다.
5. 파일럿 검토 후 새 글 템플릿과 스캐폴드 옵션을 갱신합니다.
6. 기존 글 백필은 별도 콘텐츠 작업으로 분리합니다.

## 테스트 설계

- 세 날짜 필드의 유효·무효 ISO 입력 검사
- 날짜 일부 또는 전부가 없을 때 레이아웃 확인
- `dataAsOf`가 `verifiedDate`보다 미래인 비정상 조합의 정책 확인
- Market Brief에 불필요한 오래됨 경고가 나타나지 않는지 확인
- OG·RSS·검색·빌드가 신규 필드 없이도 정상인지 회귀 확인
- `npm test`, `npm run check:content`, `npm run check`, `npm run build`

## 결정이 필요한 사항

- ETF와 Reports의 오래됨 기준을 동일하게 둘지 여부
- 목록 카드에도 검증일을 노출할지 여부
- 하나의 글에 여러 데이터 기준일이 있을 때 본문 표기와 frontmatter의 역할 분담
