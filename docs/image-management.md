# Image Management

Use this guide when adding or reorganizing images.

## Placement

- Put post-specific images next to the post in an `images/` folder, for example `src/content/blog/Reports/26년 2월/images/chart.png`.
- Use `public/images/` only for shared assets that are reused across multiple posts or site-level pages.
- Keep generated build output such as `dist/` and `.astro/` out of image management work.

## Naming

- Prefer lowercase ASCII filenames with hyphens, for example `hbm-package-map.png`.
- Avoid spaces, parentheses, screenshots with timestamps, and personal device filenames.
- Keep source files only when they are intentionally public and useful for future edits.

## Markdown Usage

- Reference post-local images with relative paths, for example `![HBM package diagram](./images/hbm-package-map.png)`.
- Add meaningful alt text to every Markdown image.
- Avoid absolute local paths, `file://` URLs, temporary upload links, and private CDN links.

## Review

- Run `npm run check:content` after adding or editing post images.
- Run `npm run build` when changing image references used by pages, layouts, or shared assets.
- Confirm large images are reasonably compressed before committing.
