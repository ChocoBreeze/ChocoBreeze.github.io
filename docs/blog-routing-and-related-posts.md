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

Previous/next links and related posts are selected only from posts in the same category.

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

Related posts are rendered as the `같이 읽기 좋은 글` section.

Current behavior:

- Use posts from the same category sequence.
- Exclude the current post.
- Exclude the previous post.
- Exclude the next post.
- Take up to 3 posts around the current post position.

This is not tag similarity, text similarity, or embedding-based recommendation. It is category-and-order based.

## Known Limitation

The current implementation filters out current/previous/next posts and then slices using the original current index. Because the array length changes after filtering, the selected related posts can be slightly offset from the intended "nearby posts" window.

If this logic is improved later, prefer this behavior:

1. Build same-category sorted posts.
2. Find the current post index.
3. Select nearby candidates around that index.
4. Exclude current/previous/next posts.
5. Fill up to 3 posts, with a predictable fallback such as latest same-category posts.

## Change Checklist

When changing this logic, verify:

- Individual blog post pages still resolve.
- Category pages still list the expected posts.
- Previous and next links are correct for ordered series.
- Related post cards do not include the current post.
- Related post cards do not duplicate previous/next links.
- Long Korean titles fit on mobile.
