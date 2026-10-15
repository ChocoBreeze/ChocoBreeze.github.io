# 25. 미사용 콘텐츠 자산 검사

## 현재 동작

- `check:content`는 Markdown 이미지·내부 링크의 **대상 누락**을 검사합니다. 2026-10-16 기준 깨진 이미지 참조는 0건입니다.
- 반대 방향, 즉 **어떤 글에서도 참조되지 않는 자산**은 검사하지 않습니다.
- 2026-10-16 측정값은 다음과 같습니다.
  - `src/content/blog/**/images/` 파일 329개 중 291개(61.1MB)가 어떤 글에서도 참조되지 않습니다.
  - `public/images/` 파일 55개 중 32개(4.1MB)가 어떤 글·페이지·스타일에서도 참조되지 않습니다.
  - 예: `src/content/blog/ETF/Broad Market/Nasdaq Next Gen 100/QQQJ/images/`에 PNG 4개가 있지만 `QQQJ.md`는 이미지를 참조하지 않습니다.
- `public/images/`는 빌드 산출물에 원본 그대로 복사되므로(`dist/images` 7.6MB) 미참조 파일도 배포에 포함됩니다.

## 목표

1. 미참조 자산을 커밋 전에 드러내 저장소와 배포 산출물이 조용히 커지는 것을 막습니다.
2. 삭제 여부 판단은 사람이 하되, 목록 확보와 정리 작업을 반복 가능하게 만듭니다.
3. 기존 경고 체계와 pre-commit 훅 동작을 무너뜨리지 않습니다.

## 범위

- Markdown·MDX 본문의 상대·절대 이미지 경로, HTML `<img src>`, frontmatter `heroImage`/`image` 참조 수집
- `src/content/blog/**/images/`와 `public/images/` 자산의 참조 여부 판정
- 리포트 출력과 명시적 정리 옵션
- 실제 파일 삭제는 사람이 확인한 뒤 별도 커밋으로 분리
- `public/fonts`, `src/assets/og`, `favicon.svg`, `robots.txt` 등 글이 참조하지 않는 사이트 자산은 대상에서 제외

## 변경 후보

- `scripts/lib/content-rules.mjs` — 참조 수집 유틸리티
- `scripts/check-content.mjs` — 리포트와 옵션 처리
- `scripts/test/content-rules.test.mjs` — 단위 테스트
- `docs/image-management.md` — 정리 규칙 문서화

## 구현 단계

1. [미착수] 글 1건에서 참조하는 자산 경로를 수집하는 순수 함수를 추가합니다. 상대 경로, `/images/...` 절대 경로, HTML `<img>`, frontmatter 이미지 필드, 쿼리·프래그먼트가 붙은 경로를 모두 정규화합니다.
2. [미착수] 자산 디렉터리를 순회해 미참조 목록과 합계 용량을 계산합니다.
3. [미착수] 전체 실행에서는 경고로 요약하고, `--staged-file-list` 모드에서는 스테이지된 글과 관련된 항목만 출력해 기존 훅 소음 정책을 유지합니다.
4. [미착수] `--report-unused-assets`로 전체 목록을, `--prune-unused-assets`로 삭제 후보를 출력합니다. 삭제는 기본 동작이 아닙니다.
5. [미착수] 의도적으로 보관하는 원본은 allowlist 파일로 예외 처리합니다.
6. [미착수] 확인된 미참조 자산을 카테고리 단위로 나눠 삭제 커밋을 진행합니다.

## 테스트 설계

- 상대 경로·절대 경로·HTML `<img>`·frontmatter 이미지 참조가 각각 수집되는지 확인
- 쿼리 문자열, 프래그먼트, 공백 인코딩, 대소문자 차이가 있는 경로 처리 확인
- 참조가 있는 자산이 미참조로 분류되지 않는지 확인(거짓 양성 방지가 핵심)
- allowlist 항목이 목록에서 제외되는지 확인
- staged 모드에서 무관한 자산 경고가 출력되지 않는지 확인

## 검증

- `npm test`
- `npm run check:content`
- `npm run build` 및 `npm run check:build-artifacts`(삭제 커밋 이후 산출물 확인)
- `npm run format:check`

## 범위 제외

- 자산 자동 삭제
- 이미지 포맷 변환·리사이즈(31번 계획)
- 외부 호스팅으로의 이전
