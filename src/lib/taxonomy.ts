import type { CollectionEntry } from 'astro:content';
import { getPostDate, toList } from './rss';

type BlogPost = CollectionEntry<'blog'>;

export function slugifyTaxonomyValue(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[()[\]{}]/g, '')
		.replace(/[&+]/g, '-')
		.replace(/[^\p{L}\p{N}_-]+/gu, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

export function sortPostsByDateDesc(posts: BlogPost[]) {
	return [...posts].sort((a, b) => getPostDate(b).valueOf() - getPostDate(a).valueOf());
}

export function getPostTags(post: BlogPost) {
	return toList(post.data.tags).filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
}

export function getTagGroups(posts: BlogPost[]) {
	const groups = new Map<string, BlogPost[]>();

	for (const post of posts) {
		for (const tag of getPostTags(post)) {
			const normalizedTag = tag.trim();
			const existing = groups.get(normalizedTag) ?? [];
			existing.push(post);
			groups.set(normalizedTag, existing);
		}
	}

	return [...groups.entries()]
		.map(([tag, taggedPosts]) => ({
			tag,
			slug: slugifyTaxonomyValue(tag),
			posts: sortPostsByDateDesc(taggedPosts),
		}))
		.filter((group) => group.slug.length > 0)
		.sort((a, b) => a.tag.localeCompare(b.tag, 'ko'));
}

export function getArchiveGroups(posts: BlogPost[]) {
	const groups = new Map<string, BlogPost[]>();

	for (const post of posts) {
		const date = getPostDate(post);
		if (date.valueOf() === 0) {
			continue;
		}

		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const key = `${year}-${month}`;
		const existing = groups.get(key) ?? [];
		existing.push(post);
		groups.set(key, existing);
	}

	return [...groups.entries()]
		.map(([key, archivePosts]) => {
			const [year, month] = key.split('-');
			return {
				key,
				year,
				month,
				label: `${year}년 ${month}월`,
				posts: sortPostsByDateDesc(archivePosts),
			};
		})
		.sort((a, b) => b.key.localeCompare(a.key));
}
