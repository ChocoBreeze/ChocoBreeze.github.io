# Security Notes

This project is a static Astro blog deployed to GitHub Pages.

## Dependency Audit

Last checked: 2026-05-21

Command:

```sh
npm audit --json
```

Current known audit result:

- 5 moderate vulnerabilities remain.
- The remaining chain is `@astrojs/check` -> `@astrojs/language-server` -> `volar-service-yaml` -> `yaml-language-server` -> `yaml`.
- `npm audit fix --force` currently proposes downgrading `@astrojs/check` to `0.9.2`.

Decision:

- Do not apply the forced downgrade while this project uses Astro 6.
- Keep `@astrojs/check` on the latest compatible release and re-check when a newer `@astrojs/check` or `@astrojs/language-server` release is available.
- The remaining issue affects development tooling, not generated static site runtime code.

## Recheck Guidance

Run dependency audit after package updates:

```sh
npm audit
npm view @astrojs/check version dependencies --json
```

If `npm audit fix` can resolve the remaining items without `--force`, prefer applying it and then run:

```sh
npm run check
npm run build
```
