import { BLOG_CATEGORIES, normalizeCategory } from '../data/blogCategories';

export const MAX_FEED_ITEMS = 50;

const CATEGORY_FEED_SLUGS = {
	ETF: 'etf',
	Economics: 'economics',
	Semiconductor: 'semiconductor',
	'Computer Science': 'computer-science',
	Programming: 'programming',
	Problem_Solving: 'problem-solving',
	Reports: 'reports',
	'Market Brief': 'market-brief',
};

export function getPostDate(post) {
	return post.data.pubDate || post.data.date || new Date(0);
}

export function getPostHref(post) {
	return `/blog/${post.data.slug || post.id}/`;
}

export function sortPostsByDateDesc(posts) {
	return posts.sort((a, b) => getPostDate(b).valueOf() - getPostDate(a).valueOf());
}

export function toList(value) {
	if (Array.isArray(value)) {
		return value;
	}

	return value ? [value] : [];
}

export function getFeedCategories(post) {
	const categories = toList(post.data.categories).map(normalizeCategory).filter(Boolean);
	const tags = toList(post.data.tags).filter(Boolean);
	return [...new Set([...categories, ...tags])];
}

export function getFeedItems(posts, maxItems = MAX_FEED_ITEMS) {
	return sortPostsByDateDesc([...posts])
		.slice(0, maxItems)
		.map((post) => ({
			title: post.data.title,
			pubDate: getPostDate(post),
			description: post.data.description,
			link: getPostHref(post),
			categories: getFeedCategories(post),
		}));
}

export function getCategoryFeedPath(category) {
	const normalized = normalizeCategory(category);
	const slug = normalized ? CATEGORY_FEED_SLUGS[normalized] : undefined;
	return slug ? `/rss/${slug}.xml` : undefined;
}

export function getCategoryByFeedSlug(slug) {
	return BLOG_CATEGORIES.find(({ key }) => CATEGORY_FEED_SLUGS[key] === slug);
}

export function postMatchesCategory(post, category) {
	return toList(post.data.categories).map(normalizeCategory).includes(category);
}
