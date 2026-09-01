# 개선 작업 계획

이 디렉터리는 ChocoBreeze Blog의 기능·품질 개선 계획을 관리합니다.

- 1~10번 계획은 완료되었으며 결과와 커밋은 [COMPLETED.md](COMPLETED.md)에 기록합니다.
- 11번은 글 수와 빌드 비용이 더 커질 때 다시 판단하는 보류 계획입니다.
- 12~24번은 2026년 8월 코드 점검에서 도출한 기능 계획과 후속 작업 목록입니다.
- 현재 구현된 기능을 신규 기능으로 중복 계획하지 않고, 확인된 동작과 개선 범위를 각 문서에 구분합니다.

## 현재 로드맵

| # | 계획 | 상태 | 우선순위 | 선행 계획 | 규모 |
|---|---|---|---|---|---|
| 12 | [문서 언어와 404 복구](12-accessibility-and-recovery.md) | 완료 | P0 | 없음 | 소 |
| 13 | [반응형 읽기 경험](13-responsive-reading-experience.md) | 완료 | P0 | 12 권장 | 중 |
| 14 | [홈 콘텐츠 피드](14-home-content-feed.md) | 완료 | P0 | 12 권장 | 중 |
| 15 | [코드 블록과 글 단위 액션](15-code-and-post-actions.md) | 완료(인용 제외) | P1 | 없음 | 중 |
| 16 | [시리즈·관련 글·학습 경로](16-series-related-learning-paths.md) | 부분 완료(그래프형 확장 보류) | P2 | 없음 | 대 |
| 17 | [콘텐츠 기준일과 검증일](17-content-freshness-metadata.md) | 부분 완료(기존 글 백필 잔여) | P2 | 없음 | 중~대 |
| 18 | [카테고리 탐색과 Problem Solving 확장](18-category-discovery-and-problem-solving.md) | 완료(UI, 백필 제외) | P2 | 없음 | 대 |
| 19 | [ETF 탐색기와 비교](19-etf-explorer-and-comparison.md) | 부분 완료(ETF 백필 잔여) | P3 | 17, 18 | 대 |
| 20 | [Market Brief 캘린더](20-market-brief-calendar.md) | 완료 | P3 | 17 일부 | 중~대 |
| 21 | [검색 접근성과 인덱스 확장성](21-search-access-and-scaling.md) | 부분 완료(튜닝·벤치마크 잔여) | P2 | 없음 | 중~대 |
| 22 | [구조화 데이터와 링크 검증 강화](22-seo-and-link-validation.md) | 완료 | P2 | 16, 17 일부 | 중 |
| 23 | [조건부 플랫폼 개선](23-conditional-platform-improvements.md) | 조건부 보류 | 조건부 | 기능별 상이 | 선택 |
| 24 | [공개 글 통계 페이지](24-blog-stats.md) | 완료 | P3 | 없음 | 중 |

## 현재 남은 작업

- 16번: 그래프형 학습 경로와 자동 다음 글 추천 확장
- 17번: 기존 ETF·Reports 글의 날짜 메타데이터 백필
- 19번: 파일럿 검토 후 나머지 ETF 안정·변동 메타데이터 백필
- 21번: 본문 검색 필드·캐시 헤더 튜닝과 Pagefind 대안 벤치마크
- 23번: 방문 통계, Mermaid, 뉴스레터, 자산 셀프 호스팅의 착수 조건 검토

12~15, 18, 20, 22, 24번의 기능 구현은 완료되었고, 16번은 선수 글 패널까지 구현되었습니다. 15번의 인용 텍스트 복사와 16·17·19·21번의 잔여 항목은 별도 작업으로 관리합니다.

## 공통 구현 원칙

- 계획 하나를 한 번에 구현하고, 관련 없는 변경을 같은 커밋에 섞지 않습니다.
- 기존 공개 URL과 `post.data.slug || post.id` 규칙을 유지합니다.
- 신규 frontmatter는 처음에는 선택 필드로 추가하고, 기존 글 전체를 즉시 백필하지 않습니다.
- 날짜 기반 금융 데이터는 자동 추정하지 않고 기준일·검증일과 함께 관리합니다.
- 필터와 정렬 상태는 가능한 한 URL로 표현해 새로고침·공유·뒤로 가기를 지원합니다.
- JavaScript가 없어도 핵심 콘텐츠와 링크는 접근 가능해야 합니다.
- 댓글 기능은 이번 로드맵 범위에서 제외합니다.

## 공통 검증 게이트

- 콘텐츠 스키마·검증 변경: `npm test`, `npm run check:content`, `npm run check`
- 레이아웃·라우트·검색 변경: `npm run check`, `npm run build`
- 전체 작업 마감: `npm run format:check`
- 시각 변경: 모바일·노트북·데스크톱, 라이트·다크 모드 수동 확인
- 인터랙션 변경: 키보드 탐색, 포커스 표시, 뒤로 가기, 빈 결과 상태 확인

## 기존 계획

- 완료: [COMPLETED.md](COMPLETED.md)
- 보류: [11. OG 이미지 생성 규모 축소](11-og-image-scaling.md)
