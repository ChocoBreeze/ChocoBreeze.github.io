# 9. Prettier 도입

## 배경

- 린트/포맷 도구가 없다. `.astro`/`.ts` 파일을 여러 세션·도구(Claude, Codex)로 편집하는 워크플로라 스타일이 조금씩 어긋나고 diff에 노이즈가 생긴다.
- 현재 코드는 탭 들여쓰기, 작은따옴표 사용이 지배적.

## 목표

Prettier로 코드 스타일을 자동 통일하되, **markdown 콘텐츠(블로그 글)는 포맷 대상에서 제외**한다 (글 본문을 도구가 재포맷하면 diff 오염·의도치 않은 렌더링 변화 위험).

## 변경 대상

1. `package.json` — devDependencies: `prettier`, `prettier-plugin-astro`. scripts: `"format": "prettier --write ."`, `"format:check": "prettier --check ."`.
2. **신규** `.prettierrc` — 기존 코드 스타일에 맞춤:

```json
{
  "useTabs": true,
  "singleQuote": true,
  "plugins": ["prettier-plugin-astro"]
}
```

3. **신규** `.prettierignore`:

```
dist/
.astro/
node_modules/
src/content/blog/
docs/
public/
package-lock.json
```

4. (선택) `ci.yml`에 `format:check` 스텝 추가 — 초기에는 넣지 않고 정착 후 추가 권장.

## 구현 단계

1. 의존성 설치, 설정 파일 작성.
2. `npm run format:check`로 현재 위반 규모 파악.
3. **일괄 포맷 커밋을 단독으로 수행** (다른 변경과 절대 섞지 않음 — blame 오염 최소화).
4. `npm run check` + `npm run build`로 포맷 후 동작 불변 확인.

## 검증

1. 일괄 포맷 diff를 훑어 의미 변경(문자열, JSX 구조)이 없는지 확인.
2. `npm run check` + `npm run build` 통과.
3. 주요 페이지 preview로 육안 확인.

## 리스크 / 참고

- 일괄 포맷 커밋이 git blame을 어지럽힌다 → `.git-blame-ignore-revs`에 해당 커밋 해시를 기록해 두면 완화된다.
- `src/content/blog/` 제외가 핵심. 실수로 포맷되면 412개 포스트 diff가 발생하므로 `.prettierignore`를 먼저 커밋한 뒤 포맷을 실행한다.
