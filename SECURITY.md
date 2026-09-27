# Security Notes

This project is a static Astro blog deployed to GitHub Pages.

## Dependency Audit

Last checked: 2026-09-27

Command:

```sh
npm audit
```

Current known audit result (`npm audit` after the dependency update):

- 0 vulnerabilities.
- Astro was upgraded to the 7.x line and Sharp to 0.35.4 to resolve advisories that could not be fixed within the previous major-version ranges.
- `@astrojs/mdx` and `@astrojs/markdown-remark` were upgraded with Astro. The Markdown pipeline explicitly keeps the existing unified, remark, and rehype configuration.
- `npm audit fix` first updated compatible transitive dependencies. The remaining Astro and Sharp advisories required major-version updates and were resolved in the subsequent compatibility migration.

Audit disposition:

- The pre-update audit summary recorded 17 vulnerable package entries (1 low, 7 moderate, 8 high, 1 critical). Those counts were package findings, not unique advisories.
- The original JSON report with advisory IDs and dependency paths was not retained in the repository. I have not reconstructed or guessed those IDs. The post-update audit is clean, so there are no outstanding advisory paths to track; preserve the JSON output on future non-zero audits to make each disposition traceable.
- Astro 7.3.5, `@astrojs/mdx` 7.0.3, `@astrojs/markdown-remark` 7.3.0, and Sharp 0.35.4 are the installed versions from the resolved upgrade. The build and checks passed on this combination.

Decision:

- CI and the Pages deployment workflow run `npm audit --audit-level=high` after installation. High and critical findings block validation and deployment; low and moderate findings remain visible in the audit output for triage.
- A temporary exception must name the advisory, affected dependency path, reason, owner, and review date. Keep exception expiry visible here and remove it after a fix is available. There are currently no exceptions.
- This static GitHub Pages site has no Astro server runtime. Build-time image processing, content handling, and generated HTML still belong to the security review; static hosting does not make those paths irrelevant.

## Recheck Guidance

Run the full dependency audit after package updates:

```sh
npm audit
npm view @astrojs/check version dependencies --json
```

Prefer non-breaking fixes first. If a major upgrade is needed, follow the framework migration guide and verify compatibility before updating. Then run:

```sh
npm test
npm run check:content
npm run check
npm run build
```
