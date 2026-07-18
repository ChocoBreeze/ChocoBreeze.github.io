# 6. check-content.mjs 회귀 테스트 추가

## 배경

- `scripts/check-content.mjs`는 777줄의 검증 스크립트로, **pre-commit 훅과 CI를 모두 막는 게이트**다.
- 테스트가 없어 규칙을 수정하다 회귀가 생기면 모든 글 작업이 막히거나, 반대로 검사가 조용히 무력화되어도 알 수 없다.

## 목표

외부 의존성 없이 Node 내장 `node:test`로 핵심 규칙의 회귀 테스트를 만든다.

## 설계 선택

- 테스트 러너: `node --test` (내장, devDependency 추가 없음).
- 전제 조건: 검증 로직이 테스트에서 import 가능해야 한다. 현재 스크립트가 단일 파일 실행형이라면, **순수 함수를 export하는 리팩터링**이 선행된다:
  - `scripts/lib/content-rules.mjs` (가칭)로 규칙 함수 분리 — frontmatter 파싱, ISO 날짜 검증, 카테고리 정규화 매칭, 시크릿/로컬 경로 패턴, `$`/`~` 이스케이프 검사, bold 밸런스 검사 등.
  - `check-content.mjs`는 파일 순회 + 리포팅만 담당하고 규칙 함수를 import.
  - 리팩터링 시 동작 불변이 원칙: 분리 전후 전체 콘텐츠에 대한 실행 결과(에러/경고 목록)가 동일해야 한다.

## 변경 대상

1. `scripts/check-content.mjs` — 규칙 함수 분리 (동작 불변).
2. **신규** `scripts/lib/content-rules.mjs` — export된 규칙 함수.
3. **신규** `scripts/test/content-rules.test.mjs` — 규칙별 테스트.
4. `package.json` — `"test": "node --test scripts/test/"` 스크립트 추가.
5. `.github/workflows/ci.yml` — `Check content quality` 앞이나 뒤에 `npm test` 스텝 추가.

## 테스트 커버리지 (우선순위 순)

1. `pubDate` ISO 8601 + 타임존 검증: 통과/실패 케이스 (타임존 누락, 날짜만, legacy `date`).
2. 카테고리 검증: 정식 키, alias(cs → Computer Science 등), 미지의 값.
3. 시크릿 패턴: API key 형태 문자열, bearer token, 정상 코드 예제와의 구분.
4. 로컬 절대 경로: Windows 경로(`C:\...`), Unix 홈(`/Users/...`, `/home/...`), `file://`.
5. `$`/`~` 이스케이프 검사 (수식/취소선 오작동 방지) — 코드 펜스 내부는 제외되는지.
6. 이미지 alt 누락, bold(`**`) 밸런스.
7. 중복 route/제목 검출 (여러 파일 입력에 대한 집계 로직).

## 구현 단계

1. **기준선 확보**: 리팩터링 전 `npm run check:content` 전체 출력을 저장.
2. 규칙 함수 분리 → 동일 출력 확인 (diff).
3. 규칙별 테스트 작성 (`node --test`).
4. `package.json`·CI에 테스트 연결.
5. pre-commit 훅(`--staged-file-list` 모드)이 여전히 동작하는지 확인.

## 검증

1. `npm test` 전체 통과.
2. `npm run check:content` 출력이 리팩터링 전과 동일.
3. 깨진 markdown을 스테이징해 pre-commit 훅이 여전히 잡는지 확인.

## 리스크 / 참고

- 777줄 리팩터링 자체가 회귀 위험 → 기준선 diff 확인을 반드시 거친다. 규칙을 한 번에 다 옮기지 말고 함수 단위로 이동하며 매번 출력 비교.
- 5번 계획(draft 지원)이 이 스크립트를 수정하므로, 테스트를 먼저 만들면 draft 작업의 안전망이 된다. **순서는 6 → 5 권장** (README의 "5 → 6" 대신 이 문서가 우선).
