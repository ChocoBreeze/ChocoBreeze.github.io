# 1. deploy 워크플로에 검증 단계 추가

## 배경

- CI(`.github/workflows/ci.yml`)는 `pull_request`에서만 실행된다: `check:content` → `astro check` → `build`.
- 배포(`.github/workflows/deploy.yml`)는 `main` push 시 실행되지만 **검증 없이 바로 build → deploy** 한다.
- 현재 워크플로는 main 직접 커밋이 대부분이라, 사실상 pre-commit 훅(스테이징된 markdown만 검사)이 유일한 방어선이다.
  - 훅은 markdown 외 파일(레이아웃, 라우트, 스키마)을 검사하지 않는다.
  - `--no-verify`나 다른 기기에서 커밋하면 훅도 우회된다.

## 목표

`main`에 push된 커밋도 PR과 동일한 검증(`check:content`, `astro check`)을 통과해야 배포되도록 한다.

## 변경 대상

- `.github/workflows/deploy.yml` — `build` 잡의 `Build site` 스텝 앞에 두 스텝 추가:

```yaml
      - name: Check content quality
        run: npm run check:content

      - name: Check Astro types
        run: npm run check
```

## 구현 단계

1. `deploy.yml`의 `Install dependencies` 스텝과 `Build site` 스텝 사이에 위 두 스텝을 삽입한다.
2. 스텝 이름과 순서를 `ci.yml`과 동일하게 맞춘다 (검증 실패 시 로그 비교가 쉬움).

## 검증

1. 로컬에서 `npm run check:content && npm run check && npm run build`가 통과하는지 먼저 확인.
2. main에 push 후 Actions에서 deploy 워크플로가 새 스텝을 포함해 성공하는지 확인.
3. (선택) 일부러 깨진 frontmatter를 가진 브랜치를 workflow_dispatch로 돌려 실패하는지 확인.

## 리스크 / 참고

- 배포 시간이 검증 시간만큼 늘어난다 (수십 초 수준, 허용 가능).
- 기존 콘텐츠 전체가 `check:content`를 통과하는 상태여야 한다. 실패하는 레거시 포스트가 있으면 먼저 수정하거나 스크립트의 예외 처리를 확인할 것.
- 향후 `ci.yml`에 `push: branches: [main]` 트리거를 추가하는 대안도 있으나, 그 경우 배포와 검증이 병렬로 돌아 "검증 실패해도 배포됨" 문제가 남는다. deploy 잡 내부에 넣는 것이 확실하다.
