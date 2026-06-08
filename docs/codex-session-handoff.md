# Codex Session Handoff

This document records project-specific Codex work history and handoff notes.
Use it as a compact reference when starting a new session. Keep persistent rules in `AGENTS.md`; keep completed work history and topic-specific context here.

## How To Use In A New Session

Do not paste this whole file unless the new task needs broad context.
Copy only the section that matches the next task.

For ETF work, the most useful starter context is:

```text
This session is for ETF content classification and cleanup.

Reference files:
- AGENTS.md
- docs/etf/etf-content-guide.md
- docs/etf/미국상장_ETF_분류_기준_Codex용_v2.md

Core rules:
- Leveraged/inverse and option-income structures take priority over the underlying sector.
- General semiconductor ETFs go under ETF/Semiconductor/{TICKER}.
- Leveraged semiconductor ETFs go under ETF/Leveraged Inverse/Semiconductor/{TICKER}.
- Nuclear and uranium ETFs go under ETF/Power Infrastructure/Nuclear and Uranium/{TICKER}.
- Run npm run check:content after post edits.
- Commit each ETF separately when requested.

Cleanup rules:
- Do not place guide/reference Markdown files under src/content/blog.
- Remove Perplexity logos, temporary hosted image comments, hidden spans, local filename footnotes, and generation artifacts.
- Add frontmatter and a clear ## ETF 분류 table.
- Add meaningful image alt text.
```

## ETF Content Classification

### Key Decisions

- ETF classification follows `docs/etf/etf-content-guide.md`.
- Detailed U.S.-listed ETF classification reference is `docs/etf/미국상장_ETF_분류_기준_Codex용_v2.md`.
- Classification priority used in practice:
  - Leveraged/inverse first.
  - Option-income / covered-call income first when applicable.
  - Then asset class, broad market, sector, theme, style/factor, or active strategy.
- `src/content/blog` must contain only blog posts. Do not place AGENTS files, guides, or classification references there.
- New ETF posts should include:
  - `title`
  - `description`
  - `pubDate`
  - `categories: "ETF"`
  - `tags`
  - `## ETF 분류`

### Current ETF Folder Decisions

- General semiconductor ETFs:
  - `src/content/blog/ETF/Semiconductor/{TICKER}/`
- Leveraged or inverse semiconductor ETFs:
  - `src/content/blog/ETF/Leveraged Inverse/Semiconductor/{TICKER}/`
- Nuclear and uranium ETFs:
  - `src/content/blog/ETF/Power Infrastructure/Nuclear and Uranium/{TICKER}/`
- Option-income ETFs:
  - `src/content/blog/ETF/Dividend Income/Option Income/...`

### ETF Cleanup Checklist

Before committing an ETF post, check for:

- Perplexity logo HTML such as `<img src="https://r2cdn.perplexity.ai/...">`
- Prompt/request headings such as `사용자 지정 지침`
- Generation text such as `Perfect...`, `Now I'll...`, or token-budget comments
- Temporary image comments using `ppl-ai-code-interpreter-files.s3.amazonaws.com`
- Hidden spans used only for unused references
- Local filename footnotes such as `QTUM (...).md`
- Default image alt text such as `![alt text]`
- Local paths, `file://`, API keys, bearer tokens, and credential-looking strings
- Broken Markdown such as unmatched `**`

Validation command:

```powershell
npm run check:content
```

### ETF Work Completed In This Session

Semiconductor:

- `SOXQ` -> `ETF/Semiconductor/SOXQ`
- `SOXX` -> `ETF/Semiconductor/SOXX`
- `XSD` -> `ETF/Semiconductor/XSD`

Leveraged / inverse semiconductor:

- `SOXL` -> `ETF/Leveraged Inverse/Semiconductor/SOXL`
- `SOXS` -> `ETF/Leveraged Inverse/Semiconductor/SOXS`
- `USD` -> `ETF/Leveraged Inverse/Semiconductor/USD`

Nuclear and uranium:

- `NLR` -> `ETF/Power Infrastructure/Nuclear and Uranium/NLR`
- `URA` -> `ETF/Power Infrastructure/Nuclear and Uranium/URA`
- `URNJ` -> `ETF/Power Infrastructure/Nuclear and Uranium/URNJ`
- `URNM` -> `ETF/Power Infrastructure/Nuclear and Uranium/URNM`

Each listed ETF was cleaned, validated with `npm run check:content`, and committed separately.

## RAG Series

### Key Decisions

- RAG Day posts should not expose real API keys or local paths.
- API key examples should use placeholders such as:

```text
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
```

- Images should not be placed awkwardly before context. Prefer a short overview section such as `## 이번 주 한눈에 보기` before images.
- Source-code files can be kept alongside the post when they support the article, but the post should still explain the relevant code flow.

### Completed Work

- RAG Day1 through Day9 were reviewed and committed.
- Security-sensitive key examples were normalized.
- Images and code files were incorporated across the series.
- Day6 received an additional Week6 section and was committed.

### Notes For Future Work

- If adding more RAG posts, inspect Day1-Day9 for style consistency.
- Keep code snippets and downloadable source files aligned.
- Re-run `npm run check:content` after content edits.

## Market Brief

### Key Decisions

- Current Market Brief prompt rules live in `docs/market-brief-prompts.md`.
- Daily Brief uses the revised prompt from 2026-05-19 onward.
- Weekly Brief uses the revised prompt from 2026-05-30 onward.

### Completed Work

- Multiple May 2026 Daily Brief and Weekly Brief posts were written and committed.
- The prompt-change dates were documented in the Market Brief rules.

### Notes For Future Work

- Always state the market date clearly, including whether the report is Korea time or U.S. market close date.
- If the U.S. market was closed, write the report around the prior trading day and upcoming watch points.

## Semiconductor Beginner Series

### Key Decisions

- The beginner semiconductor series follows this structure:
  - One-sentence definition
  - Analogy
  - Real examples
  - Visual explanation
  - Market perspective
  - Beginner check question
- New entries should continue the numbering and use the day after the previous entry as the publish date.

### Completed Work

- Entries 51 through 70 were created and committed during earlier work.

### Notes For Future Work

- Check the latest existing number and date before adding the next entry.
- Preserve the beginner-friendly tone and quiz format.

## Programming / Shortcut Posts

### Completed Work

- PowerShell Profile Guide was created.
- ChatGPT Shortcuts post was created.
- Windows Terminal Shortcuts post was created.
- PowerShell Shortcuts post was created.
- Unnecessary public instructions such as "put the image at this filename" were removed from final posts.

### Notes For Future Work

- For one-image posts, `images/image.png` is acceptable.
- Use meaningful alt text.
- Avoid exposing personal local profile paths beyond generic examples.

## Search And Related Posts

### Key Decisions

- Related posts are implemented in `src/pages/blog/[...slug].astro`.
- Related post logic is category-and-order based, not semantic similarity based.
- See `docs/blog-routing-and-related-posts.md` before changing it.
- General search does not necessarily search every character of every full post body.
- A separate code-search path was added for code-oriented lookup needs.

### Notes For Future Work

- Do not merge code search into general search unless there is a clear UX reason.
- Keep search performance in mind before indexing full long posts and code blocks.

## General Workflow Notes

Recommended checks:

```powershell
git status --short
npm run check:content
```

Use `npm run check` and `npm run build` after meaningful code, layout, routing, search, RSS, sitemap, or CI changes.

Commit practices used in this project:

- Keep unrelated changes out of the commit.
- Commit individual ETF cleanup tasks separately when requested.
- Verify staged files with:

```powershell
git diff --cached --stat
git diff --cached --name-only
```

Known operational note:

- If `git add` and `git status` are run in parallel, `git status` may show stale untracked output. Re-run `git status --short` after staging.
