# Astra Review 후속 작업 계획

- 작성일: 2026-09-27
- 기준 보고서: [Astra Review — 2026-09-12](../astra-review-2026-09-12.md)
- 관련 로드맵: [검색 접근성과 인덱스 확장성](21-search-access-and-scaling.md)
- 상태: 첫 milestone과 503·1k·2k 검색 규모 측정 및 핫패스 최적화 완료. Pagefind 대규모 비교와 브라우저 end-to-end 지연 측정은 후속
- 목적: 검토 보고서의 지적 사항을 작업 범위·완료 조건·검증 방법으로 구체화한다.

## 1. 범위와 현재 확인 사항

첫 milestone은 **검색 정확성·공유 가능한 검색 상태·브라우저 검증 baseline**이다.
의존성 보안 정리와 문서·title 수정부터 진행하고, 검색 정확성·상태 복원·브라우저 검증·성능 측정으로 이어간다.
카테고리 매핑, 테스트 fixture 격리, 콘텐츠 메타데이터 백필, 측정 기반 최적화는 후속 범위로 관리한다.

착수 시 확인한 사실:

- 원본 보고서는 2026-09-12 기준이다. 이후 수정 여부는 현재 코드와 대조해야 한다.
- `SECURITY.md`에는 2026-07-20 감사 결과인 취약점 8건이 기록되어 있다.
- 착수 당시 2026-09-27 실행한 `npm audit --json`은 17건을 보고했다: low 1, moderate 7, high 8, critical 1. 이는 취약한 패키지 집계이며 고유 advisory 수와는 다르다.
- 착수 당시 `package.json`은 Astro 6 범위를 사용했다. Pagefind 의존성과 `benchmark:search`, `report:search-size` 명령도 이미 있었다.
- 현재 로드맵에는 21번 비교 벤치마크 완료·Pagefind 교체 보류 및 ETF·Reports의 일부 백필 완료가 기록되어 있다. 해당 작업을 신규 구현으로 반복하지 않는다.
- 일부 추가 파일 읽기가 실행 환경 오류로 실패했다. 아래 파일별 변경 범위와 미해결 여부는 착수 단계에서 확정한다.

이 문서는 구현 계획이며, 나열된 결함 전부를 현재 코드에서 재현했다는 의미는 아니다.
원본 검토 보고서는 당시 기록으로 보존하고, 후속 진행 상태는 이 문서와 관련 로드맵에서 관리한다.

## 2. 진행 순서와 상태

| 순서 | 작업 묶음 | 선행 조건 | 현재 상태 |
|---|---|---|---|
| 0 | 현재 구현과 보고서 대조 | 없음 | 완료 |
| 1 | 의존성 감사·호환 업데이트·SECURITY 갱신 | 0 | 업데이트 및 CI gate 적용, 사후 audit 0건. 이전 advisory JSON 미보존 제한을 기록 |
| 2 | 관련 글 문서와 title 계약 수정 | 0 | title 수정 완료. 관련 글 문서는 현 동작과 일치해 변경 불필요 |
| 3 | 검색 본문 추출 정확성 수정 | 0 | fixture·IDL 회귀 확인 완료 |
| 4 | 검색 함수 분리·정규화·URL 상태 | 3 | 구현·회귀 테스트 완료 |
| 5 | 브라우저 smoke suite·산출물 검사 | 2~4 | Playwright 8개 browser smoke 통과 |
| 6 | 품질·성능 baseline과 Pagefind 비교 | 3~5, 기존 실험 확인 | JSON 현재·1k·2k 측정 및 핫패스 최적화 완료. Pagefind 전면 교체 보류 |
| 7 | 카테고리·slug 매핑 통합, fixture 격리 | 첫 milestone 이후 | RSS·검색 slug를 canonical key에서 파생하고 slug 충돌 불변조건을 추가해 통합 완료. 콘텐츠·Git hook 테스트 픽스처는 이미 OS 임시 디렉터리에 격리돼 있어 추가 변경 불필요 |
| 8 | ETF·Reports 메타데이터 백필 | 기존 완료 범위 확인 | MPS·Arm·Venture Global·Lumentum·Centrus·Coherent·ASE·IREN·Marvell·Credo·Bloom Energy·Rocket Lab·Navitas Semiconductor·POET Technologies·Redwire Corporation·NuScale Power·Vertiv Holdings 리포트 17건에 출처·검증일을 추가하고, 공시·시세와 대조해 확인된 재무·밸류에이션 오류를 수정. 나머지는 글별 수동 검증 필요 |
| 9 | OG·목록·빌드 최적화 | 측정으로 병목 확인 | 조건부 작업 |

fixture 충돌이 검증이나 벤치마크의 실제 장애가 되면 7번 중 fixture 격리만 앞당긴다.

## 3. 작업 0 — 현재 구현과 보고서 대조

### 작업 내용

- 보고서 기준 커밋 이후 변경 이력과 현재 코드를 비교한다.
- 각 지적 사항을 `미해결 / 일부 해결 / 해결됨 / 재현 필요`로 분류한다.
- 기존 21번 계획, 검색 벤치마크, 관련 테스트를 확인한다.
- AGENTS·CLAUDE와 하위 디렉터리 지침의 적용 범위를 확인한다.
- 테스트가 실제 콘텐츠 폴더에 임시 파일을 만드는 위치를 파악한다.

### 산출물과 완료 조건

- 항목마다 현재 근거, 관련 파일, 변경 범위, 완료 조건을 기록한다.
- 이미 해결된 항목은 근거를 연결하고 구현 대상에서 제외한다.
- 역사적 보고서의 수치와 현재 측정값을 구분한다.

## 4. 작업 1 — 의존성 감사와 보안 문서

### 대상

`package.json`, `package-lock.json`, `SECURITY.md`.
Node·CI 변경은 호환성 때문에 필요한 경우에만 포함한다.

### 작업 내용

1. 감사 결과를 advisory별로 정리한다: 직접·간접 의존 경로, 설치 버전, 영향 범위, 공식 수정 버전, 실제 기능 사용 여부.
2. 생성 HTML·RSS, 빌드 입력 처리, 개발 서버, 서버 전용 기능의 노출 경로를 구분한다.
3. 현재 버전 범위 내 업데이트와 메이저 마이그레이션을 분리한다.
4. 호환 업데이트를 우선 적용하고, 남는 항목의 해결 방법을 검토한다.
5. `SECURITY.md`에 확인일, 감사 결과, 잔여 항목, 노출 조건, 후속 조치를 기록한다.

`fixAvailable: true`만으로 호환성을 판단하지 않는다. Astro와 이미지 처리 의존성은 공식 권고와 변경 내역을 확인한다.
정적 사이트라는 이유로 빌드 입력이나 생성 HTML의 위험을 일괄 제외하지 않는다.

### 검증과 완료 조건

- 모든 감사 항목에 해결 상태 또는 구체적인 잔여 사유가 있다.
- `npm test`, `npm run check:content`, `npm run check`, `npm run build`를 순차 실행한다.
- 변경 후 audit 결과와 설치·빌드 호환성을 함께 기록한다.
- audit gate는 high·critical 차단을 기본 제안으로 검토한다. 예외는 advisory, 근거, 재검토일을 명시한다.
- 차단 정책은 아직 확정·구현된 사항이 아니다. 예외 만료 처리와 CI 실행 비용까지 정한 뒤 도입한다.

## 5. 작업 2 — 운영 문서와 title 계약

### 대상과 작업 내용

- `AGENTS.md`, `CLAUDE.md`, 관련 글 동작 문서를 현재 추천 코드와 대조한다.
- 보고서에 기록된 추천 우선순위가 현재도 유효한지 확인하고 설명을 수정한다.
- title을 생성하는 공통 컴포넌트·레이아웃·호출부를 찾는다.
- 페이지 제목에 사이트 이름을 붙이는 책임을 한 곳으로 모은다.
- `<title>`과 Open Graph 제목 등 메타데이터별 의도를 확인한다.

### 검증과 완료 조건

- 관련 글 설명이 실제 추천 규칙과 일치한다.
- 홈·검색·카테고리·글 상세의 생성 title에 사이트 이름이 중복되지 않는다.
- canonical과 기존 글 경로가 유지된다.
- 문서 변경과 title 동작 변경은 검토·커밋 단위를 분리한다.

## 6. 작업 3 — 검색 본문 추출 정확성

### 대상

`src/lib/searchIndex.ts`, 텍스트 추출 유틸리티, 관련 테스트.

### 작업 내용

1. 변경 전에 기대 동작을 fixture로 고정한다.
2. frontmatter가 이미 분리된 `post.body`에서 frontmatter 제거를 수행하지 않도록 한다.
3. 기존 Markdown 처리 의존성을 조사해 AST 기반 추출을 재사용할 수 있는지 판단한다.
4. 아래 요소의 검색 텍스트 처리 규칙을 정한다.
5. 실제 IDL 글의 누락 구간을 회귀 사례로 확인한다.

| 요소 | 확인할 규칙 |
|---|---|
| 수평선 | 앞뒤 및 두 수평선 사이의 본문 보존 |
| 표 | 셀 텍스트 보존, 구분 문법 처리 |
| 링크 | 표시 문구 처리 |
| 이미지 | alt 텍스트 처리, 불필요한 `!` 제거 |
| 코드 fence·인라인 코드 | 일반 검색과 코드 검색의 역할에 맞는 포함 범위 |
| HTML·MDX | 표시 텍스트와 실행·스타일 요소 구분 |

### 검증과 완료 조건

- 수평선 사이 본문이 검색 필드에서 사라지지 않는다.
- 표·이미지·HTML·코드 fixture가 정한 결과를 낸다.
- excerpt 480자·본문 5,000자 제한은 추출 결함과 구분해 관리한다.
- 검색 JSON 필드 계약과 draft 제외 규칙을 유지한다.
- 실제 글의 기대 문구가 제한 범위 안에서 색인되는지 확인한다.

## 7. 작업 4 — 검색 로직·정규화·URL 상태

### 주요 대상

- `src/pages/search.astro`
- `src/lib/quickSearch.mjs`
- `src/lib/searchAccess.mjs`
- `src/components/GlobalSearchPalette.astro`

### 작업 내용

- 전체 검색의 점수 계산·정렬·검색어 처리를 DOM 코드에서 분리한다.
- 빠른 검색과 전체 검색에 공통 NFKC·대소문자 정규화를 적용한다.
- 기존 가중치와 동점 처리 결과를 회귀 사례로 고정한다.
- `q`, `mode`, `category`를 URL 상태 계약으로 정한다.
- 최초 진입·새로고침·뒤로 가기·앞으로 가기에서 상태를 복원한다.
- 빠른 검색에서 전체 검색으로 이동할 때 검색어를 전달한다.
- 잘못된 모드·카테고리·빈 검색어의 기본 처리 규칙을 정한다.
- 입력마다 방문 기록이 과도하게 쌓이지 않도록 `replaceState`와 `pushState` 사용 기준을 정한다.
- URL 복원 요청에도 기존 요청 순서 방어를 적용한다.

### 검증과 완료 조건

- 전각 영문 등 동일한 정규화 결과를 갖는 질의가 일관되게 처리된다.
- 공유 URL로 검색어·모드·카테고리가 복원된다.
- 오래된 응답이 최신 검색 결과를 덮어쓰지 않는다.
- 검색 범위가 명확히 안내되며 요약 검색을 전문 검색으로 표시하지 않는다.
- 함수 분리 과정에서 의도하지 않은 점수·순위 변화가 없다.

## 8. 작업 5 — 브라우저 검증과 산출물 검사

기존 도구를 먼저 확인하고, 필요하면 Playwright Chromium으로 작은 smoke suite를 구성한다.

| 검증 영역 | 핵심 사례 |
|---|---|
| 검색 팔레트 | 단축키 열기, 방향키 이동, Enter 선택, Escape 닫기, 포커스 복귀 |
| 지연 로딩 | 검색 전 불필요한 인덱스 요청 없음, 동일 요청 공유 |
| 요청 경쟁 | 카테고리·모드 전환 시 최신 상태 유지 |
| 오류 복구 | 인덱스 요청 실패 안내, 재시도 성공 |
| URL 상태 | 직접 진입, 새로고침, 뒤로·앞으로 가기 |
| 게시 산출물 | draft 제외, slug 링크 유효성, title 중복 |
| 화면 확인 | 모바일·다크모드·긴 검색어·결과 없음·많은 결과 |

### 완료 조건

- 브라우저 동작은 타입 검사나 빌드 성공만으로 완료 처리하지 않는다.
- 고정 대기 시간 대신 화면 상태·네트워크 응답으로 검사한다.
- 테스트 임시 콘텐츠가 빌드에 섞이지 않도록 순차 실행한다.
- CI 도입 전 실행 시간과 재현성을 확인한다.
- 시각 변경은 모바일·다크모드에서 수동 확인한다.

## 9. 작업 6 — 품질·성능 baseline과 Pagefind 비교

기존 `benchmark:search`, `report:search-size`, Pagefind 의존성과 21번 계획의 완료된 실험부터 확인한다.
기존 결과에서 비교 조건이 충분한 부분은 재사용하고, 부족한 조건만 보완한다.

### 질의와 실험 조건

- 실제 글에서 기대 결과를 확인한 질의 세트를 만든다.
- 한글 복합어·부분어·띄어쓰기, 티커, 전각 영문, 함수명·기호, 수평선 구간 문장을 포함한다.
- 5,000자 제한 이후에만 나오는 문구는 현 설계의 한계를 확인하는 사례로 구분한다.
- 현재 콘텐츠와 재현 가능한 1k·2k 규모를 측정한다. 필요성이 확인되면 5k로 확대한다.
- 정확성 수정본, 경량화한 JSON 검색, Pagefind를 같은 조건으로 비교한다.
- 합성 콘텐츠는 규모 시험에만 사용하고 검색 품질 정답셋에는 사용하지 않는다.

| 측정 대상 | 기록할 값 |
|---|---|
| 검색 품질 | Recall@10, 기대 문서 순위, 0건 비율 |
| 전송·파싱 | JSON 원본·gzip 크기, 실제 전송량, parse 시간 |
| 응답성 | cold/warm 입력→결과 p50·p95, long task |
| 렌더링 | 전체 결과 수, 초기 표시 수, DOM 수 |
| 빌드 | 검색 생성 시간, 전체 빌드 시간, 메모리 |

### 완료 조건과 채택 판단

- 기기·브라우저·네트워크·CPU 조건, 콘텐츠 규모, 반복 횟수를 기록한다.
- 보고서의 warm p95 100ms 목표는 baseline 확인 후 조정할 제안으로 취급한다.
- 한국어 부분 검색·티커·코드 검색의 품질과 비용을 함께 평가한다.
- 현재 JSON 유지, JSON 개선, Pagefind와 코드 검색 병행 중 근거에 맞는 방안을 선택한다.
- 채택 보류도 근거와 재검토 조건이 있으면 유효한 결과로 기록한다.

## 10. 후속 작업

| 작업 | 범위와 완료 기준 |
|---|---|
| [x] 카테고리·slug 매핑 통합 | 검사·검색·RSS의 중복 매핑을 조사하고 공통화하되 기존 URL 유지 |
| [x] 테스트 fixture 격리 | 임시 콘텐츠 루트를 주입할 수 있게 바꾸고 실제 게시물 폴더 사용 제거 |
| ETF·Reports 메타데이터 | 기존 완료 범위를 제외하고 검증 가능한 글부터 출처·기준일·검증일 백필 |
| OG·목록·빌드 최적화 | 측정으로 확인된 병목에만 적용하고 변경 전후 비용 비교 |

ETF 작업 시 [ETF 콘텐츠 가이드](../etf/etf-content-guide.md)를 따른다.
금융 수치나 검증일을 추정해 채우지 않으며, 미입력 상태와 비교 가능한 범위를 명확히 한다.
OG 규모 최적화는 [기존 보류 계획](11-og-image-scaling.md)과 연결한다.

## 11. 실행·검증·검토 원칙

각 구현 묶음은 다음 순서로 진행한다.

1. 현재 동작과 근거 확인
2. 최소 변경 설계
3. 필요한 검증 사례 설계
4. 구현
5. 변경에 맞는 검증 실행
6. 독립 검토와 구체적인 지적 수정
7. 완료 조건 및 진행 상태 갱신

검증 명령은 변경 범위에 맞춰 선택한다.

| 변경 | 검증 |
|---|---|
| 의존성 | audit, 기존 테스트, 콘텐츠 검사, Astro 검사, 빌드 |
| 검색 추출·순수 함수 | 관련 회귀 테스트, Astro 검사, 빌드 산출물 확인 |
| title·검색 UI·라우트 | Astro 검사, 빌드, 관련 산출물·브라우저 확인 |
| 게시물 | 콘텐츠 검사, 민감 문자열·링크·날짜·alt 검토 |
| 문서 | 내용·상대 링크·diff 확인, 필요한 포맷 확인 |

테스트·콘텐츠 검사·빌드는 실제 콘텐츠 fixture 충돌을 피하도록 순차 실행한다.
필요한 검사 통과 이후에는 새 변경이나 미해결 우려가 있을 때만 검증을 확대·반복한다.
생성 출력인 `.astro/`와 `dist/`는 직접 편집하지 않는다.

의존성, 문서, title, 검색 추출, 검색 상태, 브라우저 검사, 성능 작업은 각각 검토 가능한 변경 단위로 관리한다.
커밋 시에는 변경 요약, 검증 결과, 생략한 검사와 이유를 기록하고 저장소의 AI provenance trailer 규칙을 따른다.
이 계획 작성은 커밋·push·배포 실행을 포함하지 않는다.

## 12. 첫 milestone 완료 체크리스트

- [x] 현재 코드 대조로 해결된 항목과 남은 항목을 구분했다. 관련 글 동작 문서는 이미 구현과 일치해 수정하지 않았다.
- [x] 의존성 감사 결과, 업그레이드 후 0건, CI high 이상 gate, 정적 배포의 노출 조건을 기록했다. 이전 JSON advisory별 보고서는 보존되지 않아 해당 제한도 명시했다.
- [x] title 계약이 중복 suffix를 만들지 않도록 수정했다.
- [x] 수평선·표·코드·이미지·HTML fixture를 추가했고 기술 토큰 `_`, `|`, `~` 보존을 검증했다.
- [x] 검색 점수 회귀 테스트와 실제 IDL 검색 결과를 확인했다.
- [x] 빠른 검색과 전체 검색이 NFKC 및 대소문자 정규화를 공유한다.
- [x] 검색어·모드·카테고리 공유 URL, 초기 진입·새로고침·뒤로·앞으로 복원을 구현했다.
- [x] 브라우저에서 지연 로딩·요청 경쟁·전체/빠른 인덱스 오류 복구·키보드 동작을 확인했다.
- [x] 실제 503개, 1k·2k 합성 JSON 크기·gzip 추정·parse·검색 응답 p50/p95를 기록하고 검색 핫패스를 최적화했다. 최종 성능 비교는 30회 표본을 사용했다. 상세 결과는 [검색 확장성 계획](21-search-access-and-scaling.md)에 기록했다.
- [x] 현재 크기 benchmark로 JSON 유지 및 Pagefind 전면 교체 보류를 기록했다.
- [x] 독립 검토의 텍스트 추출 회귀, 재시도 UI, 브라우저 커버리지, advisory 추적성 지적을 반영했다.

### 검증 결과와 남은 항목

- `npm test`: 223 tests passed after the search scale benchmark and cache invalidation additions.
- `npm run check:content`: 통과.
- `npm run check`: 111 files, 오류·경고·힌트 없음.
- `npm run build`: Astro 7에서 802 pages 생성.
- `npm run test:e2e`: Chromium 8/8 통과. 직접 카테고리 URL·뒤로/앞으로 이동·전체 및 빠른 검색 재시도·요청 경쟁·Enter activation을 포함한다.
- `npm audit`: 마지막 성공 결과는 취약점 0건. 이번 후속 작업에서 재실행했을 때 registry audit endpoint 연결 오류로 결과를 가져오지 못했다.
- `npm run benchmark:search`: 현재 JSON 합계 10,604,428바이트, Pagefind 전체 8,407,258바이트, 초기 전송량 118,350바이트; 초기화 55.5ms, 첫 결과 152.9ms. 이 결과만으로 한국어 검색 품질과 코드 검색 대체 가능성을 판단할 수 없어 Pagefind 전면 전환은 보류.

후속 범위: 필요 시 5k 규모, 전체 페이지 산출물의 draft·slug·title 검사 자동화. 이전 advisory ID와 dependency path는 원본 audit JSON이 없어서 복원하지 않는다.

검색 규모 후속: 30회 반복 후 2k 한국어 다건 결과의 Node p50/p95는 179.87/190.38ms였다. 브라우저 입력→DOM 렌더 시간·메모리를 측정하고 필요하면 결과 표시량을 조정한다. 5k synthetic은 현재 예상 배포 규모를 크게 넘으므로 필요 시 실행한다. Pagefind 1k·2k 비교는 별도 작업이며 이번 JSON 전용 측정으로 대체하지 않는다.

2026-09-27 후속 구현: `benchmark:search:scale` 명령과 nearest-rank 측정·기록, 결과 정렬 이후의 일치 결과만 스니펫 생성, 검색 항목의 정규화 필드 캐시와 원본 변경 감지를 추가했다. 실제 검색 가중치와 상위 결과는 회귀 테스트로 고정했다. 독립 검토의 slug 충돌 및 배열 캐시 무효화 제안도 반영했다. 크기·Node 검색 성능 변화는 [검색 확장성 계획](21-search-access-and-scaling.md)에서 확인할 수 있다.

2026-09-28 후속 구현: 검사기와 앱에서 중복되던 카테고리 키·별칭을 공용 taxonomy 모듈로 옮기고 새 글 생성기의 카테고리 폴더 규칙을 그 키에서 파생하도록 했다. 새 글 생성기와 콘텐츠 검사기가 별도로 구현하던 경로 slug도 공용 함수로 합쳤다. 검색·RSS는 이미 앱 카테고리 정규화기를 사용하고 있어 수정하지 않았다. 기존 `Problem_Solving` 폴더를 포함한 폴더명은 유지했으며, Astro 검사에서 0 errors/warnings/hints, 콘텐츠 검사 통과, 802 pages 빌드를 확인했다.

2026-09-28 후속 구현: `ASTRA_BLOG_CONTENT_DIR`로 콘텐츠 검사기와 새 글 생성기의 게시물 루트를 주입할 수 있게 했다. 생성기·콘텐츠 검사기를 호출하는 기존 10개 fixture를 OS 임시 디렉터리로 옮기고 테스트마다 `finally` 정리를 적용했다. `npm run check:content`, `npm run format:check`, `git diff --check` 통과. 테스트 실행은 이 작업 요청에 포함되지 않아 생략했다.

2026-09-28 후속 구현: MPS 투자 리포트의 공시·IR·시장 자료를 연결하고 `updatedDate`·`verifiedDate`를 기록했다. 공시 기준 2024 EPS($32.60)와 2025 EPS($12.86)로 고치고, 2026-03-30 종가 기준 밸류에이션을 다시 계산했다. 기존의 재작성 전 2024 EPS와 잘못된 시가총액·주가를 수정했으며 나머지 ETF·Reports 글은 출처와 기준일을 글별로 확인해야 한다.

2026-09-28 후속 구현: Arm Holdings 리포트의 2026-03-30 종가($136.96), FY2025 실적, FY2026 Q3 공시 주식 수·현금 및 Q4 가이던스를 출처와 대조했다. 최근 12개월 매출을 기준으로 간이 EV/TTM Sales를 약 30.4배로 계산했다. 기준일이 확인되지 않은 경쟁사 시가총액·PER를 사업모델 비교로 바꾸고, 산식이 남지 않은 주당 DCF 시나리오 숫자를 삭제해 정성 시나리오와 한계를 표시했다. 검증 출처와 계산 기준을 글에 추가했다. `npm run check:content`와 `npm run format:check` 통과, 독립 검토 2차 완료.
2026-09-28 후속 구현: Venture Global 리포트의 데이터 기준일(2026-03-30)을 유지하면서 2025 Form 10-K, 회사 FY2025 실적 발표, FERC·EIA·IEA·Shell 원자료, 3월 26일 Edison 합의 자료와 과거 시세를 연결했다. 2025 조정 EBITDA를 당시 가이던스(61.8~62.4억달러)가 아니라 실제 63억달러로 바로잡고, 2026 가이던스와 EV·P/E 계산을 다시 산출했다. EV에서 총 차입금·비제한현금 기준을 명시하고, Repsol·Edison·BP 및 남은 고객 중재의 상태를 기준일에 맞춰 구분했다. CP2 확장의 예상 생산(9.7 mtpa)과 피크(11.7 mtpa), CP2 항소 상태를 바로잡았고 출처 없는 peer 시가총액 비교표를 제거했다. updatedDate·verifiedDate를 추가했다.

2026-09-28 후속 구현: Lumentum 리포트의 기준일을 2026-09-25로 갱신하고 FY2026 10-K·Q4 실적발표 및 9월 25일 종가를 연결했다. 제품 매출, 고객 집중, FY2027 Q1 가이던스, OCS 매출·공개된 backlog 시점, CPO/ELS 현황을 업데이트했다. 전환·주식화 뒤 Notes 원금과 순현금, 2026 Notes 잔액, NVIDIA 우선주 전환 가정을 반영해 주식가치·EV/Sales·adjusted P/E를 다시 계산했다. FY2026의 비현금 부채소멸손실과 운전자본 증가를 분리해 설명하고, 이미 지난 촉매와 경영진 질문을 현 시점에 맞게 고쳤다. updatedDate·verifiedDate를 추가했다.

2026-09-28 후속 구현: Centrus Energy 리포트를 2026-09-25 기준으로 갱신하고 FY2026 Q2 10-Q·실적발표, 7월 DOE 계약 공지, X-energy·Radiant·Antares 계약 및 9월 25일 종가를 연결했다. 상반기 매출·순이익·현금흐름과 backlog 조건부 구성, DOE HALEU 운영계약 옵션 종료 및 FY2027 예산 리스크를 반영했다. 공개된 주식 수로 시가총액·단순 EV와 TTM EV/Sales·equity/TTM earnings를 재계산하고, 공시되지 않은 offtake 수량·가격은 채우지 않았다. updatedDate·verifiedDate를 추가했다.

검증: `npm run check:content` 통과(기존 문서 경고 12건, Centrus 원고 경고 없음), `npm run format:check` 통과, `git diff --check` 통과. 독립 검토에서 주식 수·순현금·EV·TTM 배수 계산, backlog 구성, FY2027 제안 예산의 기준 시점에서 구체적 오류를 찾지 못했다. 콘텐츠 변경이므로 테스트와 빌드는 생략했다.

검증: `npm run check:content` 통과(기존 문서 경고 12건, Lumentum 경고 없음), `npm run format:check` 통과, `git diff --check` 통과. 독립 검토에서 주요 산술·주식 수 기준일·우선주 전환 가정의 구체적 오류를 찾지 못했다. 콘텐츠 변경이므로 테스트와 빌드는 생략했다.

2026-09-28 후속 구현: Coherent 리포트에 updatedDate·verifiedDate(2026-09-28), dataAsOf(2026-09-25)를 추가했다. FY2026 Form 10-K·Q4 실적 발표, 9월 21일 PhotonLink 발표, 8월 17일 SiC 샘플링 발표와 9월 25일 종가를 대조했다. Datacenter & Communications 매출 증가를 AI 데이터센터 단독 매출로 표현하지 않고, FY2025 보고부문 재편 및 비공개 고객 식별 한계를 명시했다. NVIDIA의 구매 약정과 20억 달러 보통주 투자를 구분하고 PhotonLink 예상 매출 램프를 확정 실적과 분리했다. 영업현금흐름에서 유형자산 취득액을 뺀 단순 현금흐름과 기준일 시가총액·EV·배수를 재계산했다. npm run check:content 통과(기존 경고 12건, Coherent 경고 없음), npm run format:check 및 git diff --check 통과. 독립 검토에서 수치·날짜·주요 표현 오류가 발견되지 않았다. 콘텐츠 변경이므로 테스트와 빌드는 실행하지 않았다.

2026-09-28 후속 구현: ASE Technology 리포트에 updatedDate·verifiedDate(2026-09-28), dataAsOf(2026-09-25)를 추가했다. 2026년 2분기 Form 6-K, 8월 월간 매출, FY2025 연간·상반기 실적과 9월 25일 NYSE 종가를 대조했다. ATM·EMS 실적과 별도 고객 집중 기준, 상반기 영업현금흐름·유형자산 지출, 장비 투자액을 반영하고 미공개 AI 고객별 매출·CoWoS 외주 물량 주장을 제거했다. ADS당 희석 EPS로 간이 TTM EPS $0.847과 P/E 약 52.3배를 계산하고 기간별 환산 차이 및 미감사 수치의 한계를 명시했다. `npm run check:content` 통과(기존 문서 경고 12건, ASE 원고 경고 없음), `git diff --check` 통과. `npm run format:check`는 실행 준비 단계의 도구 오류로 완료하지 못했다. 산술과 공시 기준을 수동 재검토했다. 콘텐츠 변경이므로 테스트와 빌드는 실행하지 않았다.

2026-09-28 후속 구현: IREN 리포트를 FY2026 10-K 및 8월 실적 발표, 7월 신규 AI 계약 발표, 9월 25일 종가 기준으로 갱신하고 updatedDate·verifiedDate(2026-09-28), dataAsOf(2026-09-25)를 기록했다. FY2026 GAAP 매출에서 채굴 매출 비중이 여전히 약 82%임을 분리해 쓰고, 순손실과 비현금 손상차손·조정 EBITDA를 함께 반영했다. 계약 TCV, 계약 ARR, 운영 ARR 및 GAAP 매출을 구분하고 미공개 연구소 계약가를 추정하지 않았다. 선급금에 의존한 영업현금흐름, 제한성 현금, 부채·자본지출 약정, ATM 주식발행과 NVIDIA 조건부 매수권을 위험에 반영했다. 9월 25일 종가·8월 14일 주식 수·6월 말 부채와 자유현금으로 단순 시가총액·EV·EV/Sales를 다시 계산하고 기준일 차이와 비완전희석 한계를 명시했다. `npm run check:content` 통과(기존 문서 경고 12건, IREN 원고 경고 없음), `git diff --check` 통과. `npm run format:check`는 실행 준비 단계 도구 오류로 완료하지 못했다. 테스트와 빌드는 콘텐츠 변경이어서 생략했다.

2026-09-28 후속 구현: Marvell 리포트를 FY2027 2분기 10-Q·실적 발표, FY2026 10-K, 9월 25일 종가 기준으로 갱신하고 updatedDate·verifiedDate(2026-09-28), dataAsOf(2026-09-25)를 기록했다. FY2026 데이터센터 비중과 FY2027 상반기·2분기 성장률, non-GAAP와 GAAP 차이, 인수·상각, 현금흐름·차입금을 반영했다. 비공개 고객 매출은 추정하지 않고 FY2026 상위 10개 고객 집중도와 NVIDIA 우선주 전환, 사후 발행 고객 워런트를 희석 위험으로 구분했다. 9월 25일 종가와 Q3 희석주식 가이던스, FY27 상반기 TTM 매출로 간이 EV/Sales를 계산하고 각 기준일·한계를 명시했다. npm run check:content 통과(기존 문서 경고 12건, MRVL 원고 경고 없음), git diff --check 통과. npm run format:check는 실행 준비 단계의 도구 오류로 완료하지 못했다. 콘텐츠 변경이므로 테스트와 빌드는 생략했다.

2026-09-28 후속 구현: Credo 리포트를 FY2027 1분기 10-Q·실적 발표, FY2026 10-K, DustPhotonics 인수 공시와 9월 25일 종가 기준으로 갱신하고 updatedDate·verifiedDate(2026-09-28), dataAsOf(2026-09-25)를 기록했다. Q1 매출 479.0M과 AEC가 증가분의 90% 이상을 차지한 사실, 익명 계약 고객·최종 고객 집중 기준, RPO 4.2M, 인수대가 1.251B와 순현금 지출 735.6M, 운전자본·SBC·생산능력 예치금을 반영했다. FY2026 ATM 조달과 Amazon 고객 워런트의 전량 행사·3.8M 순발행을 구분하고, 8월 25일 주식 수·9월 25일 주가 기준 간이 EV/TTM Sales를 산출해 기준일 차이를 밝혔다. npm run check:content 통과(기존 문서 경고 12건, Credo 원고 경고 없음), git diff --check 통과. npm run format:check는 실행 준비 단계의 도구 오류로 시작하지 못했다. 콘텐츠 변경이므로 테스트와 빌드는 생략했다.

2026-09-29 후속 구현: Bloom Energy 리포트를 FY2026 2분기 10-Q·실적발표, FY2025 10-K, Oracle 계약 발표, Brookfield 2분기 보고서와 9월 25일 시세 기준으로 갱신했다. Q2 매출 1.065B와 FY2026 상반기 1.816B, 2026 가이던스, 익명 고객·매출채권 집중, 미이행 수행의무의 공시 범위, 현금흐름·운전자본, 환급 관세, 보증·성능보증 노출과 전환사채 희석을 반영했다. Oracle의 최대 2.8GW 계획 및 Brookfield 최대 250억 달러 투자 프레임워크를 실현 매출과 분리했다. 공시 주식 수·현금·차입금과 9월 25일 종가를 이용해 EV/TTM Sales를 약 27.3배로 계산하고 기준일 불일치와 제외 항목을 명시했다. npm run check:content 통과(기존 문서 경고 12건, Bloom Energy 원고 경고 없음), git diff --check 통과. npm run format:check는 실행 준비 단계의 도구 초기화 오류로 시작하지 못했다. 콘텐츠 변경이므로 테스트와 빌드는 생략했다.

2026-09-29 후속 구현: Rocket Lab 보고서를 FY2026 2분기 Form 10-Q·실적 발표, 9월 15일 ATM/Iridium 자금조달 공시, Iridium 주주승인 공시와 9월 25일 종가를 기준으로 갱신했다. updatedDate·verifiedDate(2026-09-29), dataAsOf(2026-09-25)를 추가하고 실적·수주잔고·현금흐름·고객 집중도, Neutron 발사대 도착 목표, Iridium 거래 조건과 자금조달 희석을 반영했다. 약 2,930만 ATM 주식과 우선주 전환을 반영한 시가총액 및 단순 P/S를 계산하고, 기준일 차이와 비완전희석·미반영 인수효과를 밝혔다. npm run check:content 통과(기존 경고 12건, Rocket Lab 원고 경고 없음), git diff --check 통과. npm run format:check는 도구 실행 준비 단계에서 helper 초기화 오류로 시작하지 못했다. 콘텐츠 변경이므로 테스트와 빌드는 생략했다.

2026-09-29 후속 구현: Navitas Semiconductor 리포트를 FY2026 2분기 Form 10-Q·실적발표와 9월 SEC 공시 기준으로 갱신하고 updatedDate·verifiedDate(2026-09-29), dataAsOf(2026-09-25)를 기록했다. 고전력 매출 성장과 전체 매출 감소를 분리하고 GAAP·비GAAP 마진, 비현금 earnout 재평가, ATM 조달·주식 희석, 익명 유통사 집중을 반영했다. 미종결 Claros 거래의 대가·등록 주식, Magnachip 지분투자와 Wolfspeed 특허 소송을 갱신했다. 9월 25일 주가·7월 24일 최신 SEC 주식 수·최근 12개월 매출로 단순 P/S 약 87.2배를 계산하고 시점 차이와 미반영 희석을 명시했다. npm run check:content 통과(기존 경고 12건, Navitas 원고 경고 없음), git diff --check 통과. npm run format:check는 helper 초기화 오류로 시작하지 못했다. 콘텐츠 변경이므로 테스트와 빌드는 생략했다.

2026-09-29 후속 구현: POET Technologies 보고서를 2026년 2분기 Form 6-K(IFRS 재무제표·MD&A), 2025년 Form 20-F, 4월 Marvell/Celestial AI 주문 취소 공지, 5월 Lumilens 주문 발표, 9월 CIOE 행사 업데이트와 9월 25일 종가 기준으로 갱신했다. updatedDate·verifiedDate(2026-09-29), dataAsOf(2026-09-25)를 기록했다. 2분기 매출 569,925달러·상반기 매출 1,073,314달러, 상반기 순손실 23,682,146달러·영업 현금유출 21,079,966달러, 현금 및 단기투자 796,341,903달러와 6월 30일 발행주식 173,035,169주를 반영했다. Lumilens 초기 5,000만 달러 구매주문과 5년 누적 5억 달러 이상 가능성을 구분하고 이를 매출로 계상하지 않았다. Celestial AI/Marvell 구매주문 취소, 8월 RSU 부여, 5월 워런트 및 전략 대여 리스크를 반영했다. 9월 25일 종가로 시가총액·단순 EV와 TTM P/S·EV/Sales를 계산하고 시점 차이·미완전희석·제외 부채항목을 밝혔다. `npm run check:content` 통과(기존 경고 12건, POET 원고 경고 없음), `npm run format:check` 및 `git diff --check` 통과. 공시 수치·주문 상태와 밸류에이션 산식을 다시 대조했다. 콘텐츠 변경이므로 테스트와 빌드는 생략했다.

2026-09-29 후속 구현: Redwire Corporation 리포트를 2026년 2분기 Form 10-Q·실적 발표, 7월 Stalker 후속 주문, 8월 SpaceMD Starfall 미션, 9월 NITE-STAR IDIQ 선정 발표와 9월 25일 종가 기준으로 갱신하고 updatedDate·verifiedDate(2026-09-29), dataAsOf(2026-09-25)를 기록했다. 상반기 매출 증가가 Edge Autonomy 인수 영향에 크게 의존하고 Space 매출은 보합임을 구분했다. 확정 계약잔고 542.1M·book-to-bill 1.52, 상반기 순손실 117.5M·영업 현금유출 31.6M, 유동성 607.8M, ATM 40.3M 주식 발행·우선주 전환과 약 29.9% 주식 수 증가, 내부통제 중대한 취약점을 반영했다. NITE-STAR 계약 차량의 980M달러 이상 한도를 Redwire 보장 매출과 구분하고, 9월 25일 종가·8월 공시 주식 수·6월 말 현금과 부채·TTM 매출로 단순 시가총액 및 EV/TTM Sales를 다시 계산해 기준일과 제외 항목을 밝혔다. `npm run check:content` 통과(기존 경고 12건, Redwire 원고 경고 없음), `npm run format:check` 및 `git diff --check` 통과. 콘텐츠 변경이므로 테스트와 빌드는 생략했다.

2026-09-29 후속 구현: NuScale Power 리포트에 updatedDate·verifiedDate(2026-09-29), dataAsOf(2026-09-25)를 추가했다. 2026년 2분기 Form 10-Q와 회사 실적발표로 매출·손실·현금흐름·현금 및 투자자산·ATM 발행·주식 수를 확인하고, ENTRA1 PMA의 비대칭 조항, NPM 1기당 3,500만\~5,500만 달러 기여금 범위와 미인식 미래 지급 가능성을 반영했다. TVA 협력은 비구속 단계로 구분했다. Doicești는 조건부 FID로 정정하고, SNN의 7월 15일 업데이트와 9월 공개 정부 점검 보고서의 조건 미이행·20개월 일정 지연·$6.5B 사업비 추정·JV 거버넌스 지적을 추가했다. 정부 보고서 인용 시나리오와 최종 계약을 구분하고 SNN의 이견도 함께 기록했다. 9월 25일 종가와 경제적 지분 수로 시가총액 및 단순 P/S·EV/Sales를 계산하고 기준일 차이·미완전희석·제외 항목을 명시했다. npm run check:content 통과(기존 경고 12건, NuScale 원고 경고 없음), npm run format:check 및 git diff --check 통과. 콘텐츠 변경이므로 테스트와 빌드는 생략했다.
2026-09-29 후속 구현: Vertiv Holdings 리포트를 2026년 2분기 Form 10-Q·실적발표, FY2025 Form 10-K와 9월 25일 종가로 갱신했다. 보고서의 최신 분기 수치·가이던스·자본구조·운전자본·인수 내역을 업데이트하고, 오래된 2025년 3분기 수주·백로그 수치와 추정 고객 매출을 현행 사실로 제시하지 않도록 수정했다. 7월 공시 주식 수와 6월 말 재무상태로 시가총액·EV/TTM Sales·후행 P/E를 계산하고 시점 차이 및 단순화 범위를 적었다. npm run check:content 통과(기존 경고 12건, Vertiv 경고 없음), npm run format:check 및 git diff --check 통과. 콘텐츠 전용 변경이므로 테스트와 빌드는 생략했다.

2026-09-29 후속 구현: MSR 밸류체인별 유망 상장기업 보고서를 갱신했다. DOE·SEC·기업 공시에서 Terrestrial Energy의 TETRA/TEFLA 협약 및 재무 상태, Natura MSR-1의 FLiBE 운송, 원자로 임계시험의 범위를 대조했다. Centrus의 2026년 X-energy 연료 농축 계약은 Xe-100 고온가스로용이므로 MSR 매출과 구분했다. HAYN·SPX FLOW·Velan 상장 및 인수 상태, Flowserve/Aalo 나트륨 냉각로 협력, Toyo Tanso/Xe-100 공급 범위를 바로잡았다. updatedDate·verifiedDate·dataAsOf를 2026-09-29로 설정했다.
 npm run check:content 통과(기존 경고 12건, MSR 원고 경고 없음), npm run format:check 및 git diff --check 통과. 콘텐츠 변경이므로 테스트·빌드는 생략했다.

2026-09-29 후속 구현: MSR 기술 주장 팩트체크를 공식 IAEA·ORNL·DOE·기업 자료로 갱신했다. MSR 설계별 연료·냉각 방식과 기술 성숙도를 구분하고, 동결밸브, 폐기물·재처리, 고온 공정열, 저압 설계, 토륨 연료주기에 대한 과장·미검증 주장을 수정했다. Natura MSR-1에 전달된 FLiBE 염은 연구개발 진척으로 기록하고 임계·상업운전과 분리했다. updatedDate·verifiedDate·dataAsOf(2026-09-29)를 설정했다. npm run check:content 통과(기존 경고 12건, MSR 원고 경고 없음), npm run format:check 및 git diff --check 통과. 테스트와 빌드는 콘텐츠 변경이므로 생략했다.


2026-09-29 후속 구현: MSR 투자 리서치를 최신 SEC·DOE·INL·기업 1차 자료로 갱신했다. 오래된 2024–2027 예정 일정을 제거하고, Terrestrial Energy의 IMSR 직접 노출과 Centrus·산업재 공급사의 간접 노출을 구분했다. DOE TETRA/TEFLA 협약, RELLIS 부지 권리, Riot 비구속 MOU, Natura FLiBE 인도, TerraPower MCRE의 전망 일정을 확정 운전 실적·허가·매출과 혼동하지 않도록 정리했다. Terrestrial·Centrus의 재무와 계약 위험 및 희석 점검 항목을 반영했다. npm run check:content, npm run format:check, git diff --check 결과를 반영한다. 콘텐츠 전용 변경이므로 테스트·빌드는 생략한다.


2026-10-04 후속 구현: 카테고리별 RSS와 검색 JSON이 중복 보유하던 key→slug 표를 제거하고, 공통 taxonomy 모듈에서 canonical category key를 기준으로 기존 endpoint slug를 계산하도록 통합했다. 화면 카테고리 경로는 변경하지 않았다. 회귀 테스트에서 8개 기존 slug, slug 고유성, 비정규 category 입력을 확인했다. 저장소의 콘텐츠 및 Git hook 테스트 픽스처는 이미 OS 임시 디렉터리를 사용해 격리되는 것을 확인해 추가 수정하지 않았다. npm test 통과(226개), npm run check 통과(114개 Astro 파일, 오류·경고·힌트 0), npm run build 통과(808페이지 생성; 8개 RSS·검색 endpoint와 /cs 페이지 확인), npm run format:check 및 git diff --check 통과.

2026-10-04 후속 구현: HBF 투자 리서치를 OCP HBF High-Level Base Die Specification v0.7.0, Sandisk 2026 Investor Day 자료와 SK hynix 9월 AI Infra Summit 자료에 맞춰 갱신했다. 사양 초안 공개, 첫 메모리 다이 tape-out, 2027년 첫 추론 제품 샘플 목표를 구분하고, 구조 모형 전시를 동작 제품 시연이나 고객 PoC로 해석하지 않도록 했다. 지난 2026년 일정은 현재 진행 현황으로 바꾸고, 공급사 목표·사양과 독립 실측 결과를 구분했다. PCIe 기반 Kioxia 모듈은 OCP HBF 사양 제품과 별도 대안으로 설명했다. `npm run check:content` 통과(HBF 문서 경고 없음, 전체 기존 경고 12건), `npm run format:check`, `git diff --check` 통과. 콘텐츠 전용 변경이므로 테스트와 빌드는 생략했다.

2026-10-04 후속 구현: SFR 투자 리서치에 updatedDate·verifiedDate·dataAsOf(2026-10-04)를 기록했다. PFBR의 2026년 4월 첫 임계, Natrium의 3월 건설허가·4월 공사 착수와 별도 운영허가, 중국 CFR-600 연료 선적, 한국 PGSFR의 공개 R&D 현황을 공식 기관·사업자 자료와 대조했다. 낡은 2023–2028 일정과 상장사 오분류를 제거하고, Natrium의 Meta·HD Hyundai·HDEC·SK Innovation 관계를 확정 발주·매출과 구분했다. Oklo의 DOE 시범사업과 NRC 상업 인허가 단계도 분리했다. 폐쇄 연료주기·재처리 이점을 조건부로 기술하고 파이로공정 필수론과 BN-1200 미가동 설계 목표의 오해를 수정했다. 기존 경제성 추정치 전체를 재검증하지 않았다는 범위를 명시했다. `npm run check:content` 통과(전체 기존 경고 12건, SFR 원고 경고 없음), `npm run format:check`, `git diff --check` 통과. 콘텐츠 변경이므로 테스트와 빌드는 생략했다.

2026-10-04 후속 구현: SFR 투자 개요에 updatedDate·verifiedDate·dataAsOf(2026-10-04)를 추가하고 PFBR·FRFCF·Natrium·CFR-600·PGSFR 현황을 1차 자료로 갱신했다. BHEL의 과거 PFBR 공급 완료, HCC의 연료주기 시설 공사와 2027년 3월 회사 예상 완료일, Doosan의 2026년 Natrium 제조계약을 구분해 기재했다. HD Hyundai·HDEC·SK Innovation·Meta 관계를 발주·계약·term sheet·다호기 개발 협약으로 나눴고, SK 투자금 2억 5천만 달러는 그룹 합계이며 KHNP 귀속 지분액은 미공개임을 반영했다. 본문에서 발견한 Doosan 공급계약 누락을 앞선 SFR 리서치에도 보완했다. `npm run check:content` 통과(전체 기존 경고 12건, 두 SFR 문서 경고 없음), `npm run format:check`, `git diff --check` 통과. 콘텐츠 변경이므로 테스트와 빌드는 생략했다.

2026-10-04 후속 구현: SFR 투자 관점 팩트체크를 갱신해 GIF의 약 400 reactor-year 운전 경험과 BN-600·BN-800의 전력 생산·상업운전 이력을 구분하고, Monju 사고·지출, ASTRID 사업 종료, PFBR 첫 임계, Natrium 건설허가·공사·별도 운영허가 단계를 반영했다. 증식로 운전 모드와 폐쇄 연료주기 선택을 분리하고, SFR·SMR의 분류 및 경제성 비교 한계를 명시했다. 주장별 출처 16건을 연결했다. npm run check:content 통과(기존 경고 12건, SFR 원고 경고 없음), npm run format:check 및 git diff --check 통과. 콘텐츠 전용 변경이므로 테스트와 빌드는 생략했다.

2026-10-04 후속 구현: ETF 읽기 가이드에 updatedDate·verifiedDate를 추가하고 SEC·FINRA 및 삼성자산운용·State Street·Vanguard·미래에셋 자료를 연결했다. KODEX 인버스 2X의 일간 목표, 환헤지의 한계와 비용, 운용비용·매매비용, 추적차이·추적오차·괴리율·스프레드의 확인법을 보완했다. `npm run check:content` 통과(전체 기존 경고 12건, 해당 글 경고 없음), `npm run format:check` 및 `git diff --check` 통과. 교육용 콘텐츠 변경이므로 테스트와 빌드는 생략했다.

2026-10-04 후속 구현: TSIC 글을 발행사 공식 자료와 SEC 요약 투자설명서, MarketVector 지수 가이드에 맞춰 갱신했다. 정식 지수명과 편입 규칙, 2026-09-30 상위 10개 보유 종목 및 비중 합계를 반영하고, 자료별 미국 편입 기준 표현의 차이를 표시했다. 연혁상 성립하지 않는 1년·5년 수익률과 오래된 GICS 비중, 근거 없는 포트폴리오 비중·관찰 기간 권고를 제거했다. 설정 이후·YTD 성과, 작은 순자산·호가 차이·비분산 분류·보수·지수 심사 기준을 설명했다.

2026-10-04 후속 구현: XSD 글을 State Street와 S&P Dow Jones Indices의 최신 상품·지수 자료로 갱신했다. 수정 등가중과 분기 리밸런싱, 2026-10-01 기준 48개 보유 종목·약 31.74억 달러 순자산·0.35% 보수를 반영했다. 연혁과 맞지 않는 과거 성과표, 자산 규모·보유 종목의 상충 수치, 장비 기업 제외를 결함으로 단정하는 주장, 근거 없는 투자 권고를 제거했다. XSD와 SMH·SOXX의 지수 범위 차이를 설명하고 반도체 업종 집중·가중 방식의 위험을 정리했다. `npm run check:content` 통과(전체 기존 경고 12건, XSD 경고 없음), `npm run format:check` 및 `git diff --check` 통과. 콘텐츠 변경이므로 테스트와 빌드는 생략했다.
