# Security Notes

This project is a static Astro blog deployed to GitHub Pages.

## Dependency Audit

Last checked: 2026-11-18

Command:

```sh
npm audit
```

Current known audit result (2026-11-18, after updating Astro to 7.4.12):

- 1 unique high advisory, shown by `npm audit` as 14 high package entries because every package that depends on it is listed: [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), picomatch ReDoS through repeated extglobs, affecting `<= 4.0.7` with no patched release. It is excepted below.
- Dependency paths (`npm ls picomatch`): `astro` → `picomatch@4.0.7` directly and through `vite`, `tinyglobby` → `fdir`, and `@astrojs/internal-helpers` (also reached from `@astrojs/mdx` and `@astrojs/markdown-remark`); `astro` → `unstorage` → `anymatch` → `picomatch@2.3.2`.
- Updating Astro from 7.3.5 to 7.4.12 resolved GHSA-mh32-jxcr-mh9f (low, fixed in 7.4.5) and GHSA-r3h5-4585-7x3w (medium, fixed in 7.4.7; the affected image endpoint belongs to `@astrojs/node`, which this site does not use).
- Still open and below the gate: the moderate satori SVG escaping advisory (GHSA-wx4j-mvgx-mqwp; the fix is a breaking satori major, and satori only renders this repository's post titles into OG cards) and the low KaTeX advisories described in the 2026-10-08 review.

Previous result (2026-09-27, after the Astro 7 migration):

- 0 vulnerabilities.
- Astro was upgraded to the 7.x line and Sharp to 0.35.4 to resolve advisories that could not be fixed within the previous major-version ranges.
- `@astrojs/mdx` and `@astrojs/markdown-remark` were upgraded with Astro. The Markdown pipeline explicitly keeps the existing unified, remark, and rehype configuration.
- `npm audit fix` first updated compatible transitive dependencies. The remaining Astro and Sharp advisories required major-version updates and were resolved in the subsequent compatibility migration.

Audit disposition:

- The pre-update audit summary recorded 17 vulnerable package entries (1 low, 7 moderate, 8 high, 1 critical). Those counts were package findings, not unique advisories.
- The original JSON report with advisory IDs and dependency paths was not retained in the repository. I have not reconstructed or guessed those IDs. The post-update audit is clean, so there are no outstanding advisory paths to track; preserve the JSON output on future non-zero audits to make each disposition traceable.
- Astro 7.3.5, `@astrojs/mdx` 7.0.3, `@astrojs/markdown-remark` 7.3.0, and Sharp 0.35.4 are the installed versions from the resolved upgrade. The build and checks passed on this combination.

Decision:

- CI and the Pages deployment workflow run `npm run check:audit` after installation. It reads `npm audit --json` and fails on any high or critical advisory that is not excepted in `scripts/lib/audit-policy.mjs`; low and moderate findings remain visible in `npm audit` for triage. `npm audit --audit-level=high` alone cannot ignore one advisory, so an unpatched advisory would otherwise block every deploy.
- A temporary exception must name the advisory, affected dependency path, reason, owner, and review date. Keep exception expiry visible here and remove it after a fix is available. An exception past its expiry date blocks again, and `check:audit` reports an exception that no longer matches any advisory.

Current exceptions:

| Advisory | Package | Reason | Owner | Expires |
|---|---|---|---|---|
| [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) | picomatch `<= 4.0.7` | No patched release. picomatch only runs at build time and in dev tooling, matching glob patterns this repository defines, so site visitors cannot supply a pattern. | Repository owner | 2027-01-31 |
- This static GitHub Pages site has no Astro server runtime. Build-time image processing, content handling, and generated HTML still belong to the security review; static hosting does not make those paths irrelevant.

## Recheck Guidance

Run the full dependency audit after package updates:

```sh
npm audit
npm run check:audit
npm view @astrojs/check version dependencies --json
```

Prefer non-breaking fixes first. If a major upgrade is needed, follow the framework migration guide and verify compatibility before updating. Then run:

```sh
npm test
npm run check:content
npm run check
npm run build
```
