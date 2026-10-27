# 36. 글별 수정 이력 링크

글 도구 줄에 그 글의 GitHub 커밋 이력으로 가는 링크를 추가합니다.

## 현재 동작

- 글 상단 글 도구(`BlogPost.astro`의 `.post-actions`)에 "글 링크 복사", "소제목 링크 복사", "인용문 복사", "오류 제보"가 있습니다.
- "오류 제보"는 `src/lib/postActions.mjs`의 `buildFeedbackIssueUrl()`로 GitHub 새 이슈 화면을 새 탭에서 엽니다. 저장소 주소는 이 파일의 `ISSUE_URL`에 있습니다.
- `updatedDate`·`verifiedDate`가 있는 글은 날짜만 보이고, 무엇이 바뀌었는지는 확인할 방법이 없습니다.

## 목표

1. 독자가 글이 언제, 어떻게 바뀌었는지 직접 확인할 수 있게 합니다. 기준일이 중요한 금융 글에서 특히 의미가 있습니다.
2. 링크는 실제 원본 파일의 이력을 가리켜야 합니다.

## 범위

- 글 도구에 "수정 이력" 링크 추가
- URL 생성 함수와 테스트
- 포함하지 않음: 이력을 사이트 안에 표시하는 기능, 빌드 시 Git 이력 조회, 파일 이름 변경 추적

## 설계

- URL 형식은 `https://github.com/ChocoBreeze/ChocoBreeze.github.io/commits/main/<파일 경로>`입니다.
- 파일 경로는 Astro 콘텐츠 항목의 `filePath`(저장소 루트 기준 상대 경로)를 씁니다. 글 경로 계산 규칙을 따로 만들지 않습니다.
- 경로에는 공백, 괄호, `&`, 한글이 들어가므로 경로 구분자 `/`는 두고 각 구간을 `encodeURIComponent`로 인코딩합니다.
- 저장소 주소는 `ISSUE_URL`과 같은 상수에서 파생해 한 곳에서 관리합니다.
- "오류 제보"와 같이 새 탭(`target="_blank"`, `rel="noopener noreferrer"`)으로 엽니다.
- `filePath`가 없으면 링크를 만들지 않습니다.

### 알려진 한계

- GitHub의 경로별 커밋 목록은 파일 이름 변경 이전 이력을 따라가지 않습니다. 이름을 바꾼 글은 변경 이후 이력만 보입니다.

## 변경 후보

- `src/lib/postActions.mjs` — `buildHistoryUrl(filePath)`
- `src/pages/blog/[...slug].astro` — `historyUrl` 전달
- `src/layouts/BlogPost.astro` — 링크 렌더링
- `scripts/test/post-actions.test.mjs` — 단위 테스트
- `e2e/accessibility.spec.mjs` 또는 신규 브라우저 테스트

## 구현 단계

1. [완료] `postActions.mjs`에 `buildHistoryUrl()`을 추가하고, 저장소 주소를 `REPOSITORY_URL` 한 곳에서 파생하도록 정리했습니다. 단위 테스트 4개를 추가했습니다.
2. [완료] `[...slug].astro`가 `post.filePath`로 `historyUrl`을 만들어 넘기고, `BlogPost.astro`가 "오류 제보" 앞에 "수정 이력" 링크를 렌더링합니다. 브라우저 테스트는 `e2e/post-history.spec.mjs`입니다.
3. [완료] 2026-10-27 빌드에서 글 페이지 528개 모두 링크가 있고, 528개 모두 Git이 추적하는 서로 다른 파일을 가리킵니다. `&`·공백·괄호가 들어간 ITA 글의 링크는 GitHub에서 HTTP 200으로 열리고, 같은 경로로 API를 조회하면 커밋 이력이 나옵니다.

## 테스트 설계

- 공백, 괄호, `&`, `#`, 한글이 들어간 경로가 올바르게 인코딩되는지
- Windows 구분자(`\`)가 들어와도 `/`로 정규화되는지
- `filePath`가 없을 때 `undefined`를 반환하는지
- 브라우저에서 링크가 보이고 새 탭으로 열리는 속성이 있는지

## 검증

- `npm test`, `npm run check`
- `npm run build`, `npm run test:e2e`
- 빌드된 글 528편의 링크 경로가 모두 저장소 파일과 일치하는지 일회성 스크립트로 확인
