import { DISPLAY_TIME_ZONE } from './listFilters.mjs';

/** @typedef {{ data: { pubDate?: Date|string, date?: Date|string, categories?: unknown } }} BlogStatsPost */

function getPostDate(post) {
	const value = post?.data?.pubDate ?? post?.data?.date;
	if (!value) return undefined;

	const date = value instanceof Date ? value : new Date(value);
	return Number.isFinite(date.valueOf()) ? date : undefined;
}

function getDateParts(date, timeZone) {
	if (!date) return undefined;

	const parts = new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: '2-digit',
		timeZone,
	}).formatToParts(date);
	const year = parts.find((part) => part.type === 'year')?.value;
	const month = parts.find((part) => part.type === 'month')?.value;

	return year && month ? { year, month } : undefined;
}

function getDefaultCategory(post) {
	const categories = post?.data?.categories;
	return Array.isArray(categories) ? categories[0] : categories;
}

/**
 * @param {BlogStatsPost[]|unknown} posts
 * @param {{ getCategory?: (post: BlogStatsPost) => unknown, timeZone?: string }} [options]
 */
export function buildBlogStats(posts, { getCategory, timeZone = DISPLAY_TIME_ZONE } = {}) {
	const safePosts = Array.isArray(posts) ? posts : [];
	const categoryCounts = new Map();
	const yearCounts = new Map();
	const monthCounts = new Map();
	let datedPosts = 0;

	for (const post of safePosts) {
		const rawCategory =
			typeof getCategory === 'function' ? getCategory(post) : getDefaultCategory(post);
		const category = typeof rawCategory === 'string' ? rawCategory.trim() : '';
		if (category) {
			categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
		}

		const dateParts = getDateParts(getPostDate(post), timeZone);
		if (!dateParts) continue;

		datedPosts += 1;
		yearCounts.set(dateParts.year, (yearCounts.get(dateParts.year) ?? 0) + 1);
		const monthKey = `${dateParts.year}-${dateParts.month}`;
		monthCounts.set(monthKey, (monthCounts.get(monthKey) ?? 0) + 1);
	}

	return {
		totalPosts: safePosts.length,
		datedPosts,
		undatedPosts: safePosts.length - datedPosts,
		categories: [...categoryCounts.entries()]
			.map(([key, count]) => ({ key, count }))
			.sort((left, right) => right.count - left.count || left.key.localeCompare(right.key, 'ko')),
		years: [...yearCounts.entries()]
			.map(([year, count]) => ({ year, count }))
			.sort((left, right) => right.year.localeCompare(left.year)),
		months: [...monthCounts.entries()]
			.map(([key, count]) => {
				const [year, month] = key.split('-');
				return { key, year, month, count };
			})
			.sort((left, right) => right.key.localeCompare(left.key)),
	};
}
