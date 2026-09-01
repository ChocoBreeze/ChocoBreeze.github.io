import { normalizePostReference } from './postReferences.mjs';

/** @typedef {import('astro:content').CollectionEntry<'blog'>} BlogPost */

function getList(value) {
	return Array.isArray(value) ? value : value ? [value] : [];
}

function getPostKey(post) {
	return post?.data?.slug || post?.id || '';
}

function buildReferenceIndex(posts) {
	const index = new Map();
	for (const post of posts) {
		for (const reference of [post.id, post.data?.slug, post.filePath]) {
			const normalized = normalizePostReference(reference);
			if (normalized) {
				index.set(normalized, post);
			}
		}
	}
	return index;
}

/**
 * Resolve the explicitly ordered prerequisite posts for a published post.
 * Unknown, draft, duplicate, and self-references are omitted defensively; the
 * content checker reports unknown references during authoring.
 *
 * @param {{ posts?: BlogPost[], currentPost?: BlogPost }} options
 * @returns {{ id: string, title: string, href: string }[]}
 */
export function getLearningPath({ posts = [], currentPost } = {}) {
	if (!currentPost || currentPost.data?.draft) {
		return [];
	}

	const postIndex = buildReferenceIndex(posts);
	const seen = new Set([currentPost.id, getPostKey(currentPost)].filter(Boolean));
	const prerequisites = [];

	for (const reference of getList(currentPost.data?.prerequisiteSlugs)) {
		const post = postIndex.get(normalizePostReference(reference));
		if (!post || post.data?.draft) {
			continue;
		}

		const key = getPostKey(post);
		if (!key || seen.has(post.id) || seen.has(key)) {
			continue;
		}

		seen.add(post.id);
		seen.add(key);
		prerequisites.push({
			id: post.id,
			title: post.data.title,
			href: `/blog/${key}/`,
		});
	}

	return prerequisites;
}
