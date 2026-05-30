# Publishing Checklist

Use this checklist before publishing a new or edited post.

## Before Writing

- Choose the target folder under `src/content/blog`.
- Pick a category that exists in `src/data/blogCategories.ts`.
- Use `templates/post.md` for new posts.
- For a generated draft, use `npm run new:post`.
- Prefer a stable `slug` when the filename contains spaces, Korean text, or special characters.

## Draft Generation

Use the generator when you want a frontmatter-ready draft without manually creating folders.

```powershell
npm run new:post -- --title "PowerShell 개인 명령어 설정 가이드" --category Programming --date 2026-05-30 --slug programming/powershell-profile-guide
```

For Market Brief drafts, the title, category, slug, and monthly folder are generated from the date.

```powershell
npm run new:post -- --type market-daily --date 2026-05-30
npm run new:post -- --type market-weekly --date 2026-05-30
```

If a file already exists, the generator stops instead of overwriting it.

## Content Review

- Check that `title`, `description`, `pubDate`, and `categories` are present.
- Use full ISO 8601 with timezone for `pubDate`, for example `2026-01-16T00:00:00+09:00`.
- Remove API keys, bearer tokens, local absolute paths, private upload URLs, and personal machine paths.
- Confirm links point to public pages or local assets that exist.
- Check Markdown syntax for visible `**`, unclosed inline HTML tags, broken tables, and code fences.
- Add meaningful alt text to Markdown images.
- Follow `docs/image-management.md` when adding or reorganizing images.

## Validation

- Run `npm run check:content` after post-only changes.
- Run `npm run check` and `npm run build` after layout, route, search, RSS, sitemap, or component changes.
- Manually preview affected pages when changing visual layout, dark mode, or mobile behavior.

## Commit

- Commit only files related to the current change.
- Use a message that describes the user-visible outcome.
