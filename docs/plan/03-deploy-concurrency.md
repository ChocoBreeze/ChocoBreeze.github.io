# 3. deploy 워크플로 concurrency 설정

## 배경

`deploy.yml`에 `concurrency` 설정이 없어, main에 연속으로 push하면 배포 워크플로가 동시에 여러 개 실행된다.

- GitHub Pages 배포가 순서 보장 없이 겹칠 수 있다 (이론상 이전 커밋이 나중에 배포될 가능성).
- Actions 사용량 낭비.

## 목표

배포는 항상 최신 커밋 기준 하나만 실행되도록 한다.

## 변경 대상

`.github/workflows/deploy.yml` — 최상위(`permissions` 아래)에 추가:

```yaml
concurrency:
  group: pages
  cancel-in-progress: false
```

- `cancel-in-progress: false` 권장: 진행 중 배포는 완료시키고, 대기 중인 이전 실행만 최신 실행으로 대체된다 (GitHub이 pending 항목을 자동 스킵).
  - `true`로 하면 배포 중간 취소가 발생할 수 있는데, Pages 공식 스타터 워크플로는 `false`를 사용한다.

## 구현 단계

1. `deploy.yml`에 위 블록 삽입.
2. YAML 문법 확인 후 커밋.

## 검증

1. main에 push → Actions에서 정상 배포 확인.
2. (선택) 빠르게 두 번 push하여 이전 실행이 스킵/대기되는지 확인.

## 리스크 / 참고

- 없음에 가까움. 1번 계획(deploy 검증 단계 추가)과 같은 파일을 수정하므로 같은 세션에서 진행하되 커밋은 분리하거나, 워크플로 정비로 묶어 하나의 커밋으로 처리해도 무방하다.
