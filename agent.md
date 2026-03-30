# Agent Guide

## Purpose

This repository is an Astro-based personal blog. The root `README.md` is still close to the Astro starter template, so this file is the project-specific guide for automated agents and contributors.

## Stack

- Astro 5
- Content collections via `src/content.config.ts`
- Markdown-first content in `src/content/blog`

## Working Rules

- Prefer small, focused changes.
- Do not edit generated output in `.astro/` or `dist/`.
- Keep existing category and route conventions intact.
- When changing layouts or routes, verify that category pages and individual post pages still resolve.

## Content Model

All posts are loaded from `src/content/blog/**/*.{md,mdx}`.

Supported frontmatter is defined in `src/content.config.ts`.

Common fields:

- `title`: required
- `slug`: optional, but recommended when the filename contains spaces, Korean text, or special characters
- `description`: optional
- `pubDate`: preferred publish date field
- `updatedDate`: optional
- `categories`: optional, string or string array
- `tags`: optional
- `pinned`: optional, default `false`
- `order`: optional, useful for ordered series

Legacy Jekyll-style fields such as `date` and `image` are also accepted, but new posts should prefer the Astro-side fields (`pubDate`, `heroImage`).

## Category Conventions

Keep category values aligned with `src/data/blogCategories.ts`.

Known categories:

- `ETF`
- `Semiconductor`
- `Computer Science`
- `Programming`
- `Problem_Solving`
- `Reports`

If a post is intended to appear in a category page, make sure its `categories` frontmatter normalizes to one of the values above.

## Post Placement

Current content is grouped physically under `src/content/blog` by topic, for example:

- `Semiconductor/...`
- `Reports/...`
- `Programming/...`
- `Problem Solving/...`

Preserve the existing folder style unless there is an explicit request to reorganize content.

## Routing Notes

- Post URLs are generated from `post.data.slug || post.id`.
- Category list pages exist under:
  - `/etf`
  - `/semiconductor`
  - `/cs`
  - `/programming`
  - `/problem-solving`
  - `/reports`

When adding or editing posts, avoid changes that would silently break these routes.

## Commands

Run from repository root:

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run astro -- check`

Use `npm run build` as the default verification step after meaningful content or layout changes.

## Recommended Workflow

1. Inspect the target post, route, or layout before editing.
2. If adding a post, place it in the appropriate `src/content/blog/...` folder.
3. Use a stable `slug` when the filename is not URL-friendly.
4. Run `npm run build` after meaningful changes.
5. Summarize any assumptions, especially around category naming or route behavior.
