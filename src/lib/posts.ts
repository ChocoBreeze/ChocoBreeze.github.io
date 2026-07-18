import { getCollection, type CollectionEntry } from 'astro:content';

type BlogPost = CollectionEntry<'blog'>;

// Drafts stay visible while developing (`astro dev`) so posts can be previewed
// across sessions, but are excluded from production builds (`astro build`) so a
// `draft: true` post never ships to any page, feed, or search index.
export function isPublished(post: BlogPost): boolean {
	return import.meta.env.DEV || !post.data.draft;
}

// Single source of truth for "which posts are live". Every page, feed, and
// search index must load posts through this instead of calling
// getCollection('blog') directly, otherwise drafts would leak into that surface.
export async function getPublishedPosts(): Promise<BlogPost[]> {
	return getCollection('blog', isPublished);
}
