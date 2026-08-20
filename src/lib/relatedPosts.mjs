import { getSeriesPosts } from './series.mjs';
import { normalizePostReference } from './postReferences.mjs';

/** @typedef {import('astro:content').CollectionEntry<'blog'>} RelatedPost */

function getPostKey(post) {
	return post?.data?.slug || post?.id || '';
}

function getPostDate(post) {
	const value = post?.data?.pubDate ?? post?.data?.date;
	const timestamp = value instanceof Date ? value.valueOf() : new Date(value ?? 0).valueOf();
	return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getList(value) {
	return Array.isArray(value) ? value : value ? [value] : [];
}

function normalizeToken(value) {
	return String(value).trim().toLocaleLowerCase();
}

function getTokens(post, fieldName) {
	return new Set(getList(post?.data?.[fieldName]).map(normalizeToken).filter(Boolean));
}

function isEligible(post, excludedKeys) {
	if (!post || post.data?.draft) {
		return false;
	}

	return !excludedKeys.has(post.id) && !excludedKeys.has(getPostKey(post));
}

function addCandidates(result, seenKeys, candidates, excludedKeys, limit) {
	for (const candidate of candidates) {
		if (result.length >= limit) {
			break;
		}

		const key = getPostKey(candidate);
		if (!key || seenKeys.has(key) || !isEligible(candidate, excludedKeys)) {
			continue;
		}

		seenKeys.add(key);
		result.push(candidate);
	}
}

function getOverlapScore(currentPost, candidate) {
	const currentTags = getTokens(currentPost, 'tags');
	const candidateTags = getTokens(candidate, 'tags');
	const currentTopics = getTokens(currentPost, 'topics');
	const candidateTopics = getTokens(candidate, 'topics');

	const tagScore = [...candidateTags].filter((tag) => currentTags.has(tag)).length;
	const topicScore = [...candidateTopics].filter((topic) => currentTopics.has(topic)).length;
	return tagScore * 2 + topicScore;
}

/**
 * @param {{
 *   posts?: RelatedPost[],
 *   currentPost?: RelatedPost,
 *   categoryPosts?: RelatedPost[],
 *   excludedIds?: (string | undefined)[],
 *   limit?: number,
 * }} options
 * @returns {RelatedPost[]}
 */
export function getRelatedPosts({
	posts = [],
	currentPost,
	categoryPosts = posts,
	excludedIds = [],
	limit = 3,
} = {}) {
	const numericLimit = Number(limit);
	if (!currentPost || !Number.isFinite(numericLimit) || numericLimit <= 0) {
		return [];
	}

	const normalizedLimit = Math.floor(numericLimit);
	const excludedKeys = new Set(
		[currentPost.id, getPostKey(currentPost), ...excludedIds]
			.filter(Boolean)
			.map((value) => String(value)),
	);
	const result = [];
	const seenKeys = new Set();

	const seriesPosts = getSeriesPosts(posts, currentPost);
	const seriesIndex = seriesPosts.findIndex((post) => post.id === currentPost.id);
	const seriesCandidates = seriesPosts
		.map((post, index) => ({ post, index }))
		.filter(({ post }) => post.id !== currentPost.id)
		.sort((a, b) => {
			const distanceA = seriesIndex < 0 ? a.index : Math.abs(a.index - seriesIndex);
			const distanceB = seriesIndex < 0 ? b.index : Math.abs(b.index - seriesIndex);
			return distanceA - distanceB || a.index - b.index;
		})
		.map(({ post }) => post);
	addCandidates(result, seenKeys, seriesCandidates, excludedKeys, normalizedLimit);

	const postsByReference = new Map();
	for (const post of posts) {
		for (const reference of [post.id, post.data?.slug, post.filePath]) {
			const normalizedReference = normalizePostReference(reference);
			if (normalizedReference) {
				postsByReference.set(normalizedReference, post);
			}
		}
	}
	const manualCandidates = getList(currentPost.data?.relatedSlugs)
		.map((slug) => postsByReference.get(normalizePostReference(slug)))
		.filter(Boolean);
	addCandidates(result, seenKeys, manualCandidates, excludedKeys, normalizedLimit);

	const scoredCandidates = posts
		.filter((post) => isEligible(post, excludedKeys))
		.map((post) => ({ post, score: getOverlapScore(currentPost, post) }))
		.filter(({ score }) => score > 0)
		.sort(
			(a, b) =>
				b.score - a.score ||
				getPostDate(b.post) - getPostDate(a.post) ||
				getPostKey(a.post).localeCompare(getPostKey(b.post)),
		)
		.map(({ post }) => post);
	addCandidates(result, seenKeys, scoredCandidates, excludedKeys, normalizedLimit);

	const categoryIndex = categoryPosts.findIndex((post) => post.id === currentPost.id);
	const categoryCandidates = categoryPosts
		.map((post, index) => ({ post, index }))
		.filter(({ post }) => post.id !== currentPost.id)
		.sort((a, b) => {
			const distanceA = categoryIndex < 0 ? a.index : Math.abs(a.index - categoryIndex);
			const distanceB = categoryIndex < 0 ? b.index : Math.abs(b.index - categoryIndex);
			return distanceA - distanceB || a.index - b.index;
		})
		.map(({ post }) => post);
	addCandidates(result, seenKeys, categoryCandidates, excludedKeys, normalizedLimit);

	return result;
}
