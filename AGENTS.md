# Agent Guide

## Purpose

This repository is an Astro-based personal blog. The root `README.md` documents project usage, while this file captures project-specific working rules for automated agents and contributors.

## Stack

- Astro 6
- Content collections via `src/content.config.ts`
- Markdown-first content in `src/content/blog`
- GitHub Pages deployment via `.github/workflows/deploy.yml`

## Working Rules

- Prefer small, focused changes.
- Do not edit generated output in `.astro/` or `dist/`.
- Keep existing category and route conventions intact.
- When changing layouts or routes, verify that category pages and individual post pages still resolve.
- If a change affects deployment, keep the GitHub Actions workflow aligned with Astro's supported Node version.
- Keep content changes, UI/layout changes, validation changes, and deployment changes in separate commits when practical.

## Content Model

All posts are loaded from `src/content/blog/**/*.{md,mdx}`.

Supported frontmatter is defined in `src/content.config.ts`.

Common fields:

- `title`: required
- `slug`: optional, but recommended when the filename contains spaces, Korean text, or special characters
- `description`: optional
- `pubDate`: preferred publish date field; use full ISO 8601 with timezone, such as `2026-01-16T00:00:00+09:00`
- `updatedDate`: optional
- `categories`: optional, string or string array
- `tags`: optional
- `pinned`: optional, default `false`
- `order`: optional, useful for ordered series

Legacy Jekyll-style fields such as `date` and `image` are also accepted, but new posts should prefer the Astro-side fields (`pubDate`, `heroImage`).

For new posts, prefer including at least `title`, `description`, `pubDate`, and `categories`.

## Content Security Checks

Before committing new or edited posts, check for:

- API keys, bearer tokens, access tokens, and credential-looking strings.
- Local absolute paths, including Windows paths, Unix home paths, and `file://` URIs.
- Temporary hosted asset URLs or private upload links.
- Personal file names, machine names, internal project paths, or private notes that should not be public.
- Markdown or HTML syntax that renders visibly, such as unmatched `**` or unclosed inline tags.

## Category Conventions

`src/data/blogCategories.ts` (`BLOG_CATEGORIES`) is the single source of truth for the category keys, labels, and routes — do not maintain a parallel list here. If a post is intended to appear in a category page, make sure its `categories` frontmatter normalizes (via `normalizeCategory()`) to one of the keys defined there.

## ETF Classification Rules

- When creating, moving, or reorganizing ETF posts, follow `docs/etf/etf-content-guide.md`.
- Use `docs/etf/미국상장_ETF_분류_기준_Codex용_v2.md` as the detailed reference for U.S.-listed ETF classification.
- Do not place agent guides, classification references, or other non-post Markdown files under `src/content/blog`, because all Markdown files there are treated as blog posts.

## Post Placement

Current content is grouped physically under `src/content/blog` by topic, for example:

- `Semiconductor/...`
- `Reports/...`
- `Programming/...`
- `Problem Solving/...`
- `Market Brief/...`

Preserve the existing folder style unless there is an explicit request to reorganize content.

## Market Brief Prompts

- When creating Market Brief posts, check `docs/market-brief-prompts.md` for the current Daily and Weekly prompt rules.
- Daily Brief uses the revised prompt from 2026-05-19 posts onward.
- Weekly Brief uses the revised prompt from 2026-05-30 posts onward.

## Image Management

- Follow `docs/image-management.md` when adding or reorganizing images.
- Prefer post-local `images/` folders for images used by a single post.
- Use `public/images/` for shared site-level or cross-post assets.
- Avoid personal device filenames, local absolute paths, `file://` URLs, temporary upload links, and private CDN links.
- Add meaningful alt text to Markdown images.

## Routing Notes

- Post URLs are generated from `post.data.slug || post.id`.
- Category list pages live at each category's `href` in `src/data/blogCategories.ts` (`/etf`, `/economics`, `/semiconductor`, `/cs`, `/programming`, `/problem-solving`, `/reports`, `/market-brief`).

When adding or editing posts, avoid changes that would silently break these routes.

## Related Posts Notes

- Individual post previous/next links and `같이 읽기 좋은 글` cards are implemented in `src/pages/blog/[...slug].astro`.
- The current logic is category-and-order based, not tag similarity or content similarity based.
- See `docs/blog-routing-and-related-posts.md` before changing this behavior.

## Commands

Run from repository root:

- `npm run dev`
- `npm run check:content`
- `npm run check`
- `npm run build`
- `npm run preview`

Use `npm run check:content` for post-only changes. Use `npm run check` and `npm run build` after meaningful code, layout, route, or CI changes.

## Code Review Checklist

Use this checklist before committing non-trivial changes.

## Review Focus

- Confirm the diff matches the user request and does not include unrelated edits.
- Check category pages, individual post pages, RSS, sitemap, and search when content routing or frontmatter changes.
- Check dark mode readability when changing shared surfaces, Markdown styles, cards, navigation, forms, or color tokens.
- Check mobile readability for post detail pages, category lists, search results, and table-heavy posts.
- Check long headings, long titles, tables, code blocks, and table-of-contents overflow in article layouts.
- Check Korean UI copy for clarity and consistency.
- Check external links for safe behavior when link rendering logic changes.

## Validation

- Run `npm run check:content` after adding or editing posts.
- Run `npm run check` after Astro, TypeScript, content schema, or component changes.
- Run `npm run build` after meaningful UI, layout, routing, search, RSS, sitemap, or CI changes.
- Manually inspect affected pages in a browser when changing visual layout, dark mode, or responsive behavior.

## Commit Gate

- Summarize notable behavior or content changes before committing.
- List verification commands and their results.
- List skipped checks with the reason.
- Fix concrete review findings before committing unless the user chooses to defer them.
- Commit only relevant files for the current task.

## Deployment Notes

GitHub Pages deployment currently uses:

- `withastro/action@v5`
- `node-version: 22.12.0`

Keep deployment on Node `22.12.0+` for Astro 6 compatibility.

## Recommended Workflow

1. Inspect the target post, route, or layout before editing.
2. If adding a post, place it in the appropriate `src/content/blog/...` folder.
3. Use a stable `slug` when the filename is not URL-friendly.
4. Run `npm run build` after meaningful changes.
5. Summarize any assumptions, especially around category naming, route behavior, or deployment compatibility.
