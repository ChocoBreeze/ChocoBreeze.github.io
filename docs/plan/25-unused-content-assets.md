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

1. [완료] `collectAssetReferences()`로 글 1건의 자산 참조를 수집합니다. 상대 경로, `/images/...` 절대 경로, 이미지 파일을 가리키는 Markdown 링크, HTML `<img src>`, frontmatter `heroImage`/`image`를 처리하고 쿼리·프래그먼트·퍼센트 인코딩을 정규화합니다. 코드 블록과 인라인 코드 안의 참조는 제외합니다.
   페이지·컴포넌트·스타일이 참조하는 `public/images` 자산도 `collectSiteAssetReferences()`로 함께 수집합니다. 이 단계를 빼면 페이지에서만 쓰는 자산이 미참조로 잘못 분류됩니다.
2. [완료] `src/content/blog/**/images/`와 `public/images/`를 순회해 미참조 목록과 합계 용량을 계산합니다(`findUnusedAssets()`, `formatByteSize()`).
3. [완료] 전체 실행에서는 `UNUSED ASSETS <n> of <total> file(s), <size> unreferenced` 한 줄로 요약합니다. 기존 경고 집계에 322건을 더하지 않으므로 경고 수 기준선이 유지됩니다. `--staged-file-list` 모드에서는 스테이지된 글과 같은 폴더의 자산만 경고로 출력합니다.
4. [완료] `--report-unused-assets`는 전체 목록을, `--prune-unused-assets`는 경로만 stdout으로 출력합니다(요약은 stderr로 보내 파이프 사용이 가능합니다). 삭제는 기본 동작이 아니며 스크립트는 파일을 지우지 않습니다.
5. [완료] `scripts/lib/unused-asset-allowlist.json`의 `retain` 목록으로 예외 처리합니다. `/`로 끝나는 항목은 폴더 전체를 보관합니다.
6. [미착수] 확인된 미참조 자산을 카테고리 단위로 나눠 삭제 커밋을 진행합니다. 2026-10-16 측정 기준 322개(65.1MiB)가 후보이며, 삭제는 되돌리기 어려우므로 사람이 목록을 확인한 뒤에만 진행합니다.

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

### 2026-10-16 구현 결과

- `npm test` 249개 통과(자산 참조·미참조 판정·용량 포맷 단위 테스트 18개 추가)
- `npm run check:content` 통과, 경고 7건으로 기존과 동일
- 자산 384개 중 322개(65.1MiB)가 미참조로 집계됨. 내역: `src/content/blog/**/images/`와 `public/images/`
- `npm run format:check` 통과
- 삭제 작업(6단계)은 진행하지 않았습니다.

## 범위 제외

- 자산 자동 삭제
- 이미지 포맷 변환·리사이즈(31번 계획)
- 외부 호스팅으로의 이전
