# 29. frontmatter 완성도와 태그 정규화

## 현재 동작

- `check:content`는 필수 필드, 날짜 형식, 카테고리 유효성, 중복 라우트·제목, 제목·설명 길이 상한을 검사합니다.
- `description`은 스키마에서 기본값 `''`이므로 비어 있어도 통과합니다.
- 2026-10-16 기준 필드 보유율은 다음과 같습니다.
  - `description` 424편(84%), 누락 또는 빈 값 82편
  - `tags` 276편(55%)
  - `topics`·`difficulty` 각 82편(16%)
  - `updatedDate`·`verifiedDate` 각 173편(34%), `dataAsOf` 157편(31%)
- `description`은 메타 설명, Open Graph, 글 카드 요약, 검색 결과에 모두 쓰이므로 비어 있으면 네 곳이 동시에 비어 보입니다.
- 태그 표기 정규화 장치는 없습니다. 검색·관련 글 계산은 소문자 비교를 하지만, 태그 페이지 목록은 표기별로 분리됩니다.

## 목표

1. 비어 있는 `description`을 드러내 점진적으로 채웁니다.
2. 같은 개념의 태그가 표기만 달라 분리되는 것을 막습니다.
3. 태그 페이지에서 인접 주제로 이어질 수 있게 합니다.

## 범위

- `description` 누락 경고(레거시 경고 정책 적용)
- 태그 표기 정규화 맵과 검사
- 태그 페이지의 연관 태그 표시
- 글당 태그 수 권고 상한

## 데이터 정책

- 태그 정규화 맵은 두지 않습니다(3단계 참고). 변형이 실제로 생기면 그때 `src/data/`에 카테고리 alias와 같은 방식으로 추가합니다.
- 정규화는 **표시 표기 통일**까지만 합니다. 태그 병합으로 글의 의미가 바뀌는 변경은 사람이 판단합니다.
- `description`은 사람이 작성합니다. 본문 첫 문단 자동 복사나 생성 모델 요약은 쓰지 않습니다.

## 변경 후보

- `src/data/blogTags.*`(신규) — 정규화 맵
- `src/pages/tags/index.astro`, `src/pages/tags/[tag].astro`
- `src/lib/taxonomy.ts`
- `scripts/lib/content-rules.mjs`, `scripts/check-content.mjs`
- `scripts/test/content-rules.test.mjs`

## 구현 단계

1. [완료] `description`이 비어 있는 글을 경고로 리포트합니다. 전체 실행에서는 `MISSING DESCRIPTIONS <n> warning(s)` 한 줄로 묶고 `--report-missing-descriptions`로 전체 목록을 봅니다. pre-commit 훅은 커밋 대상 글의 항목만 출력합니다.
2. [완료] 2026-10-18 집계: 서로 다른 태그 359개, 태그가 있는 글 276편, 태그 지정 933건, 한 글의 최대 태그 수 7개입니다. **대소문자·공백·하이픈·밑줄·점만 다른 표기 변형은 0건입니다.** 단독 사용 태그가 261개(73%)로 긴 꼬리가 실제 문제였습니다. 상위 태그는 ETF 82, Problem_Solving 82, Developer Tools 42, Git 35, Version Control 35입니다.
3. [완료, 방침 변경] 정규화 맵은 만들지 않았습니다. 2단계 측정에서 변형이 0건이었으므로 지금 만들면 항목이 비어 있는 맵이 됩니다. 대신 `findTagVariantCollisions()`로 변형이 새로 생기면 경고하는 검사를 넣어 현재 상태를 유지합니다.
4. [해당 없음] 정규화 맵을 만들지 않았으므로 태그 경로가 변하지 않고 리다이렉트도 필요하지 않습니다.
5. [완료] 태그 상세에 `함께 쓰인 태그` 섹션을 추가했습니다. 같은 글에 함께 달린 태그를 공통 글 수 순으로 최대 8개 보여주며, 계산은 `src/lib/relatedTags.mjs`의 `countCoOccurringTags()`에 있습니다.
6. [미착수] `description` 82편 백필은 글마다 사람이 문장을 써야 하므로 남겨 둡니다. 대상 목록은 `node scripts/check-content.mjs --report-missing-descriptions`로 확인합니다.

## 테스트 설계

- 빈 문자열·공백만 있는 `description`이 경고로 분류되는지 확인
- 정규화 맵이 대소문자·공백·하이픈 변형을 같은 태그로 모으는지 확인
- 맵에 없는 태그가 원래 표기를 유지하는지 확인
- 정규화 후 태그 페이지 경로가 중복되지 않는지 확인
- 연관 태그 계산이 자기 자신을 포함하지 않는지 확인

## 검증

- `npm test`
- `npm run check:content`
- `npm run check`
- `npm run build`
- `npm run format:check`

### 2026-10-18 구현 결과

- `npm test` 315개 통과(태그 표기 검사 9개, 연관 태그 9개 추가)
- `npm run check:content` 통과. 경고 기준선 7건 유지, 요약 줄에 `MISSING DESCRIPTIONS 82 warning(s)` 추가
- `npm run check` 0 errors, `npm run build` 성공, `npm run check:build-artifacts` 통과
- `npm run test:e2e` 11개 통과, `npm run format:check` 통과
- 확인 예: `/tags/git/`의 `함께 쓰인 태그`에 Developer Tools·Version Control이 각각 35개 공통으로 표시됩니다.
- `getRelatedTags()`는 `src/lib/taxonomy.ts`에 두고 계산만 `relatedTags.mjs`로 분리했습니다. `taxonomy.ts`는 확장자 없는 `./rss` import 때문에 Node 테스트에서 직접 불러올 수 없어, 저장소의 다른 테스트 대상 라이브러리와 같은 `.mjs` 분리 방식을 따랐습니다.

## 범위 제외

- 자동 생성 `description`
- 태그 의미 병합과 대량 재분류
- 태그 기반 추천(관련 글 로직은 16번 계획 범위)
