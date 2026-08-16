# 15. 코드 블록과 글 단위 액션

## 현재 동작

- Programming·Problem Solving·Computer Science 글 대부분에 코드 블록이 있지만 복사 버튼은 없습니다.
- 글 상세에는 이미지 확대와 맨 위로 이동만 있습니다.
- 피드백 페이지는 고정 GitHub Issue URL을 제공하며 현재 글 제목과 URL을 자동으로 채우지 않습니다.

## 목표

1. 코드 블록을 안전하게 복사하고 언어를 확인할 수 있게 합니다.
2. 현재 글·소제목 링크를 복사하고, 오류 제보에 현재 문맥을 자동 포함합니다.

## 권장 설계

- 먼저 실제 빌드 HTML에서 Shiki가 제공하는 `pre`·`code` 속성을 확인합니다.
- Markdown 파이프라인 플러그인 추가와 렌더 후 DOM 보강 중 더 작은 방식을 선택합니다.
- 액션은 본문 내용과 겹치지 않는 공통 글 액션 영역에 둡니다.
- GitHub Issue URL에는 글 제목과 canonical URL만 넣고 사용자가 선택한 본문을 자동 전송하지 않습니다.

## 변경 후보

- `src/layouts/BlogPost.astro`
- `src/pages/blog/[...slug].astro`
- 신규 `src/components/PostActions.astro` — 분리할 경우
- `src/styles/global.css`
- `src/pages/feedback.astro` — 안내 문구 정합성 확인

## 구현 단계

1. 대표 코드 블록의 빌드 HTML과 언어 속성을 확인합니다.
2. 코드 블록마다 언어 라벨과 복사 버튼을 추가합니다.
3. Clipboard API 실패 시 선택 가능한 대체 동작과 오류 상태를 제공합니다.
4. 글 URL·현재 소제목 URL 복사 기능을 추가합니다.
5. GitHub Issue 제목과 본문에 글 제목·URL을 URL 인코딩해 넣습니다.
6. 선택적으로 제목·사이트명·발행일 기반 인용 텍스트 복사를 추가합니다.

## 테스트 설계

- 언어 지정·미지정 코드 블록, 여러 코드 블록, 매우 긴 한 줄 코드 확인
- 특수문자와 한글이 있는 코드가 원문 그대로 복사되는지 확인
- Clipboard API 성공·실패 상태가 스크린리더에 전달되는지 확인
- 소제목 링크의 해시가 올바르게 복사되는지 확인
- GitHub Issue URL의 제목·본문 인코딩 확인
- 모바일·다크 모드·키보드 포커스 확인
- `npm run check`, `npm run build`, `npm run format:check`

## 범위 제외

- 댓글 UI
- 방문자의 선택 텍스트를 외부 서비스로 자동 전송하는 기능
- 서버 저장형 피드백 폼
