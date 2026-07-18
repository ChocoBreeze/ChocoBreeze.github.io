# 7. Node 버전 단일 소스화

## 배경

Node `22.12.0`이 두 워크플로(`ci.yml`, `deploy.yml`)에 각각 하드코딩되어 있다. 업그레이드 시 한쪽만 바꾸면 CI와 배포 환경이 어긋난다.

## 목표

Node 버전을 한 파일에서 관리한다.

## 변경 대상

1. **신규** `.nvmrc` — 내용: `22.12.0` (한 줄).
2. `.github/workflows/ci.yml`, `.github/workflows/deploy.yml` — `setup-node` 스텝 변경:

```yaml
        with:
          node-version-file: .nvmrc
          cache: npm
```

3. (선택) `package.json`에 `"engines": { "node": ">=22.12.0" }` 추가 — 로컬에서 낮은 버전 사용 시 npm 경고.
4. `README.md` / `AGENTS.md`의 배포 노트에 `.nvmrc`가 기준임을 반영.

## 구현 단계

1. `.nvmrc` 생성.
2. 두 워크플로의 `node-version` → `node-version-file` 교체.
3. 문서 갱신.

## 검증

1. push 후 Actions 로그에서 setup-node가 `.nvmrc`의 버전을 읽어 22.12.0을 설치하는지 확인.
2. `npm run build` 정상 동작.

## 리스크 / 참고

- 없음. 1·3번 계획과 같은 파일을 수정하므로 워크플로 정비를 한 흐름에서 진행하면 편하다.
