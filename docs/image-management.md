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

## Image Size

`npm run check:content` warns about any image over 1 MiB (`MAX_IMAGE_BYTES` in
`scripts/lib/content-rules.mjs`), and the pre-commit hook warns about the oversized images in the
commit itself. `node scripts/check-content.mjs --report-oversized-images` lists them.

`npm run optimize:images` re-encodes the files that are over the limit, in place:

- A PNG is quantised to a 256-colour palette. Exported infographics and screenshots are usually
  stored almost uncompressed, so this typically removes two thirds of the file while keeping text
  crisp.
- A JPEG photo is resized to at most 1600 pixels wide and re-encoded with mozjpeg. Files under
  `public/images/` are served byte-for-byte, so their pixel dimensions matter as much as their
  weight; 1600 covers the 1020-pixel post hero and the 1200-pixel Open Graph card on a
  high-density display.

A file is only rewritten when the new encoding saves at least 15% and still measures as visually
identical (PSNR of at least 38 dB against the original). Anything else is reported and left alone,
so running the script twice changes nothing. Pass `--dry-run` to see what it would do, or specific
paths to limit it to those files. Rules and thresholds live in `scripts/lib/image-optimizer.mjs`.

Astro re-encodes post-local Markdown images for delivery, so for those the source size is a
repository-weight question rather than a reader-transfer one. A raw HTML `<img>` is not processed,
and neither is anything under `public/`.

## Unused Assets

`npm run check:content` reports how many asset files under `src/content/blog/**/images/` and
`public/images/` no post or page references. References are collected from Markdown images,
Markdown links to image files, HTML `<img src>`, the `heroImage`/`image` frontmatter fields, and
`/images/...` paths used by site source files.

- `node scripts/check-content.mjs --report-unused-assets` lists every unreferenced asset.
- `node scripts/check-content.mjs --prune-unused-assets 2> /dev/null` prints only the paths, so the
  list can be piped into a deletion command.
- Nothing is deleted automatically. Remove confirmed files in a separate content commit.
- To keep an unreferenced file on purpose, add it to `retain` in
  `scripts/lib/unused-asset-allowlist.json`. An entry ending with `/` keeps a whole folder.

When a staged commit touches a post, the pre-commit hook reports only the unreferenced assets in
that post's own `images/` folder, so adding an image and forgetting to reference it is caught right
away.

## Review

- Run `npm run check:content` after adding or editing post images.
- Run `npm run build` when changing image references used by pages, layouts, or shared assets.
- Run `npm run optimize:images` when `check:content` reports an oversized image.
- Check the unused-asset count in the `check:content` output before committing new images.
