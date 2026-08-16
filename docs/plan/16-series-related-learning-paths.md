# 16. 시리즈·관련 글·학습 경로

## 현재 동작

- `order`는 카테고리 내 정렬과 이전·다음 글에 사용됩니다.
- 관련 글은 같은 카테고리·정렬 순서를 기준으로 선택되며 알려진 오프셋 한계가 있습니다.
- Git Internals는 슬러그 접두사, RAG는 태그로 글을 자동 수집합니다.
- Git Commands 허브는 섹션별 슬러그 목록을 직접 관리합니다.

## 목표

- 시리즈 소속과 순서를 frontmatter에서 명시합니다.
- 글 상세에서 시리즈 위치와 이전·다음 편을 공통으로 제공합니다.
- 관련 글 품질을 높이고 선수 개념 기반 학습 경로로 확장할 수 있게 합니다.

## 권장 데이터 모델

기존 `order`의 카테고리 정렬 의미를 바꾸지 않기 위해 다음 선택 필드를 별도로 검토합니다.

- `series`: 표시 이름
- `seriesSlug`: 안정적인 시리즈 식별자
- `seriesOrder`: 시리즈 내부 순서
- `relatedSlugs`: 작성자가 지정한 관련 글
- `prerequisiteSlugs`: 선수 글

필드명과 중복 허용 정책은 구현 전에 한 번 더 확정합니다.

## 변경 후보

- `src/content.config.ts`
- `src/pages/blog/[...slug].astro`
- `src/layouts/BlogPost.astro`
- 신규 `src/lib/series.*`, `src/lib/relatedPosts.*`
- 선택적 `src/pages/series/[series].astro`
- `scripts/check-content.mjs`, `scripts/test/content-rules.test.mjs`
- `scripts/new-post.mjs`, `templates/post.md`
- 기존 Git/RAG 허브 3개

## 구현 단계

1. 시리즈 식별자·순서·중복 정책을 확정하고 선택 스키마를 추가합니다.
2. 시리즈 정렬과 이전·다음 계산을 순수 함수로 분리합니다.
3. 글 상세에 현재 위치와 시리즈 전체 보기 링크를 추가합니다.
4. Git Commands 일부 글을 파일럿으로 전환하고 허브의 하드코딩 목록을 데이터 기반으로 바꿉니다.
5. 관련 글 우선순위를 `같은 시리즈 → 수동 지정 → 태그·주제 → 카테고리 폴백`으로 구현합니다.
6. 현재 관련 글 오프셋 한계를 함께 제거합니다.
7. 선수 글 데이터가 축적된 뒤 학습 경로 UI를 별도 단계로 추가합니다.

## 테스트 설계

- 시리즈 순서 누락·중복·동률 처리
- 현재 글이 처음·중간·마지막일 때 이전·다음 결과
- draft가 시리즈와 관련 글에 노출되지 않는지 확인
- 현재 글과 이전·다음 글이 관련 글 카드에 중복되지 않는지 확인
- 존재하지 않는 `relatedSlugs`·`prerequisiteSlugs` 검증
- 기존 비시리즈 글의 이전·다음 동작 회귀 확인
- `npm test`, `npm run check:content`, `npm run check`, `npm run build`

## 마이그레이션 원칙

- 기존 495개 글을 일괄 백필하지 않습니다.
- Git Commands를 첫 파일럿으로 삼고 Git Internals·RAG는 편집형 허브를 유지합니다.
- 시리즈 메타데이터가 없는 글은 현재 카테고리 동작을 그대로 사용합니다.
