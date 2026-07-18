# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Start local dev server
npm run build         # Production build (output: ./dist)
npm run preview       # Preview the built site locally
npm run check         # TypeScript/Astro type-check
npm run check:content # Validate all blog post frontmatter and content quality
npm run new:post      # Scaffold a new blog post (see below)
```

### Scaffolding new posts

```bash
# Generic post
npm run new:post -- --title "My Post" --category Programming --date 2026-06-29 --slug programming/my-post

# Market brief shorthand types
npm run new:post -- --type market-daily --date 2026-06-29
npm run new:post -- --type market-weekly --date 2026-06-29
```

Omitting `--date` defaults to today in Asia/Seoul time. Omitting `--slug` auto-generates one from the title.

## Architecture

This is an **Astro 6** static site (GitHub Pages) with MDX support, remark-math/rehype-katex for LaTeX, and no UI framework.

### Content model

All blog content lives in `src/content/blog/`, organized into category subfolders. The single Astro content collection `blog` (`src/content.config.ts`) loads all `.md` / `.mdx` files from that directory.

Required frontmatter fields: `title`, and either `pubDate` (full ISO 8601 with timezone: `"2026-06-29T00:00:00+09:00"`) or legacy `date`.

Optional but important fields: `categories`, `slug`, `description`, `tags`, `difficulty`, `topics`, `pinned`, `order`, `draft`.

Legacy Jekyll fields (`date`, `image`) are still accepted by the schema, but new posts should use `pubDate` and `heroImage`.

**Drafts:** a post with `draft: true` is visible while running `npm run dev` (for cross-session preview) but is excluded from every production build — no page, feed, sitemap, or search entry. This is enforced in one place: `src/lib/posts.ts` (`getPublishedPosts()` / `isPublished()`). **Any page, feed, or search index that lists posts must load them through `getPublishedPosts()`, never `getCollection('blog')` directly** — a raw `getCollection` call would leak drafts into that surface. Note `check:content` still validates draft files (frontmatter, duplicate routes/titles), so a draft must have valid frontmatter to be committed.

### Categories

Defined in `src/data/blogCategories.ts` as `BLOG_CATEGORIES`. Each category maps to a page route (e.g. `ETF` → `/etf`). The `normalizeCategory()` function handles alias variants (e.g. `"cs"` → `"Computer Science"`). Finance categories (`ETF`, `Economics`, `Reports`, `Market Brief`) and Computing categories (`Computer Science`, `Programming`, `Problem_Solving`) are grouped in the nav under `/finance` and `/computing` index pages; `Semiconductor` is a standalone top-level nav item.

Physical folder names under `src/content/blog/` can differ from category keys (folder `Problem Solving` ↔ key `Problem_Solving`). Never place non-post markdown (guides, references, notes) under `src/content/blog/` — every `.md`/`.mdx` file there becomes a published post.

### URL / slug resolution

A post's URL is `/blog/<slug>` where `<slug>` is the frontmatter `slug` field if present, otherwise derived from the file path relative to `src/content/blog/` with each path segment slugified. Always set an explicit `slug` in frontmatter to keep stable URLs.

### Page structure

- `src/layouts/BlogPost.astro` — single post layout. Renders a 3-column grid (sidebar | prose | TOC) with a sticky right-hand table of contents (visible ≥ 1400 px), image lightbox, back-to-top button, related posts, and prev/next navigation within the same category.
- `src/layouts/BlogListLayout.astro` — category index page layout.
- Category index pages at `src/pages/<category-slug>/index.astro` each call `BlogListLayout`.
- `src/components/BlogSidebar.astro` — left nav showing all categories; highlights the active one.

### Search & RSS

- `src/pages/search.json.ts` and `src/pages/search/[category].json.ts` emit JSON search indexes (built via `src/lib/searchIndex.ts`).
- `src/pages/code-search.json.ts` emits a code-only search index (`src/lib/codeSearchIndex.ts`).
- RSS feeds: `/rss.xml` (all posts) and `/rss/<category>.xml` per category, implemented in `src/lib/rss.js`.

### Content quality checks (`npm run check:content`)

`scripts/check-content.mjs` validates every markdown file for:
- Required frontmatter (`title`, date field)
- `pubDate` must be full ISO 8601 with timezone
- Category value must match a known key or alias
- No duplicate post routes or duplicate titles
- No absolute local paths or secret patterns in content
- Missing image alt text, unbalanced bold markers

CI runs this check on every pull request (`check:content` → `astro check` → `build`), and the deploy workflow reruns it before publishing. A versioned git pre-commit hook (`scripts/hooks/pre-commit`, activated via `core.hooksPath` by the `prepare` npm script on `npm install`) also runs `check-content.mjs` against any staged `.md`/`.mdx` files, so a commit with a broken post will fail — fix the reported errors rather than bypassing the hook.

### Deployment

Push to `main` triggers GitHub Actions (`deploy.yml`) which builds with `npm run build` and deploys `./dist` to GitHub Pages. The workflow pins Node 22.12.0; keep it on Node 22.12+ for Astro 6 compatibility.

## Operational guides

- `AGENTS.md` — working rules for this repo: review checklist, commit gate (separate commits for content vs. UI vs. validation vs. deployment changes), content security checks.
- `docs/market-brief-prompts.md` — current Daily/Weekly Market Brief prompt rules (also driven by the `/market-daily` and `/market-weekly` slash commands in `.claude/commands/`).
- `docs/etf/etf-content-guide.md` and `docs/etf/미국상장_ETF_분류_기준_Codex용_v2.md` — ETF post placement and U.S.-listed ETF classification rules.
- `docs/image-management.md` — post-local `images/` folders for single-post images; `public/images/` for shared assets.
- `docs/blog-routing-and-related-posts.md` — read before changing prev/next or related-posts logic in `src/pages/blog/[...slug].astro` (category-and-order based, not similarity based).
