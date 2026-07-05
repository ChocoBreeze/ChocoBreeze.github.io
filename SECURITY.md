# Security Notes

This project is a static Astro blog deployed to GitHub Pages.

## Dependency Audit

Last checked: 2026-07-06

Command:

```sh
npm audit
```

Current known audit result:

- 8 vulnerabilities (1 low, 5 moderate, 2 high).
- `astro` (high): XSS via unescaped spread props, Host header SSRF in prerendered error page fetch.
- `esbuild` 0.27.3–0.28.0 (moderate): arbitrary file read on Windows dev server.
- `js-yaml` 4.0.0–4.1.1 (moderate): quadratic-complexity DoS via merge key aliases.
- `vite` 7.0.0–7.3.3 (high): NTLMv2 hash disclosure via UNC path, `server.fs.deny` bypass on Windows.
- `yaml` chain (moderate): stack overflow via deeply nested YAML — `@astrojs/language-server` → `volar-service-yaml` → `yaml-language-server` → `yaml`.
- `npm audit fix` claims to resolve all items without `--force`.

Decision:

- `astro`, `esbuild`, `js-yaml`, `vite` issues are in the dev/build toolchain, not in generated static site runtime.
- Re-run `npm audit fix` after verifying Astro version compatibility to check if safe to apply.
- The `yaml` chain continues to affect `@astrojs/check` dev tooling only.

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
