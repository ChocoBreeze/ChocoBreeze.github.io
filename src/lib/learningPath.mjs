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

function getPostReferenceSet(post) {
	return new Set(
		[post?.id, post?.data?.slug, post?.filePath]
			.map((reference) => normalizePostReference(reference))
			.filter(Boolean),
	);
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

/**
 * Resolve the published posts that explicitly list the current post as a
 * prerequisite. This is the one-hop reverse edge of the learning graph.
 *
 * @param {{ posts?: BlogPost[], currentPost?: BlogPost, limit?: number }} options
 * @returns {{ id: string, title: string, href: string }[]}
 */
export function getNextLearningPath({ posts = [], currentPost, limit = 3 } = {}) {
	if (!currentPost || currentPost.data?.draft) {
		return [];
	}

	const maxItems = Number.isInteger(limit) && limit > 0 ? limit : 0;
	if (maxItems === 0) {
		return [];
	}

	const currentReferences = getPostReferenceSet(currentPost);
	const seen = new Set([currentPost.id, getPostKey(currentPost)].filter(Boolean));
	const nextPosts = [];

	for (const post of posts) {
		if (post.data?.draft || post.id === currentPost.id) {
			continue;
		}

		const isNextPost = getList(post.data?.prerequisiteSlugs).some((reference) =>
			currentReferences.has(normalizePostReference(reference)),
		);
		if (!isNextPost) {
			continue;
		}

		const key = getPostKey(post);
		if (!key || seen.has(post.id) || seen.has(key)) {
			continue;
		}

		seen.add(post.id);
		seen.add(key);
		nextPosts.push({
			id: post.id,
			title: post.data.title,
			href: `/blog/${key}/`,
		});

		if (nextPosts.length >= maxItems) {
			break;
		}
	}

	return nextPosts;
}
