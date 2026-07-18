# OG image font

`Pretendard-Bold.otf` is vendored here for build-time Open Graph image
generation (`src/lib/og.ts`). Satori needs the font bytes to lay out glyphs; it
embeds them as vector paths, so the rendered PNG is self-contained.

- **Font:** Pretendard v1.3.9, Bold
- **Author:** Kil Hyung-jin — https://github.com/orioncactus/pretendard
- **License:** SIL Open Font License 1.1 (see `OFL.txt`), which permits bundling
  and redistribution.
