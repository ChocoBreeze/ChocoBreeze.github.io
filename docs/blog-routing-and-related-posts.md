# Blog Routing And Related Posts

This document records how individual blog post routes, previous/next links, and related posts currently work.

## Post Routes

Blog post pages are generated in `src/pages/blog/[...slug].astro`.

The public URL path uses:

```ts
post.data.slug || post.id
```

Use a stable `slug` in frontmatter when a filename contains spaces, Korean text, punctuation, or when the URL should not change if the file is renamed.

## Category Matching

Previous/next links are selected from posts in the same category. Related posts use the
same-category list only as their final fallback; they can also come from another category
when a series, an author-specified slug, or shared tags/topics provides a stronger match.

Category comparison currently normalizes `categories` like this:

- If `categories` is an array, only the first category is used.
- If `categories` is a string, that string is used.

This means `["Programming", "RAG"]` and `"Programming"` are treated as the same category, but secondary categories are not considered.

## Sort Order

Posts in the same category are sorted using this priority:

1. `pinned: true` posts first.
2. Lower `order` values first. Missing `order` is treated as `999`.
3. `pubDate` or legacy `date` ascending, from older posts to newer posts.

Because dates are ascending, the next post points toward a newer post in that category sequence.

## Previous And Next Posts

After sorting, the current post index is found by matching `post.id`.

- `prevPost` is the item immediately before the current post.
- `nextPost` is the item immediately after the current post.

These links are rendered below each article.

## Related Posts

Related posts are rendered as the `같이 읽기 좋은 글` section. The shared selector lives in
`src/lib/relatedPosts.mjs` and returns up to three published posts in this priority order:

1. Nearby posts in the same `seriesSlug`.
2. `relatedSlugs` in the current post's frontmatter order.
3. Posts sharing tags or topics, ranked by overlap (tags have greater weight than topics,
   then newer publication date).
4. Nearby posts from the current category as a final fallback.

The current post, drafts, previous/next posts, and series previous/next posts are excluded
from the related cards. Missing `relatedSlugs` targets are content-check errors. The field is
optional, so existing posts continue to use automatic matching without a bulk migration.

This is not text similarity or embedding-based recommendation. It is metadata-driven and
deterministic: series and manual links take precedence, then tags/topics, then category order.

## Change Checklist

When changing this logic, verify:

- Individual blog post pages still resolve.
- Category pages still list the expected posts.
- Previous and next links are correct for ordered series.
- Related post cards do not include the current post.
- Related post cards do not duplicate previous/next links.
- Related post cards omit drafts and honor `relatedSlugs` order.
- Unknown `relatedSlugs` targets fail `npm run check:content`.
- Long Korean titles fit on mobile.
