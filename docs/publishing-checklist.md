# Publishing Checklist

Use this checklist before publishing a new or edited post.

## Before Writing

- Choose the target folder under `src/content/blog`.
- Pick a category that exists in `src/data/blogCategories.ts`.
- Use `templates/post.md` for new posts.
- Prefer a stable `slug` when the filename contains spaces, Korean text, or special characters.

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
