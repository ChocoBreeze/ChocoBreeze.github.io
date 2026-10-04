// Shared category keys and normalization rules for the Astro site and Node scripts.
export const BLOG_CATEGORY_KEYS = Object.freeze([
	'ETF',
	'Economics',
	'Semiconductor',
	'Computer Science',
	'Programming',
	'Problem_Solving',
	'Reports',
	'Market Brief',
]);

export const BLOG_CATEGORY_ALIASES = Object.freeze({
	...Object.fromEntries(BLOG_CATEGORY_KEYS.map((key) => [key.toLowerCase(), key])),
	report: 'Reports',
	'problem solving': 'Problem_Solving',
	cs: 'Computer Science',
	'market brief': 'Market Brief',
	market_brief: 'Market Brief',
	'us market brief': 'Market Brief',
	economic: 'Economics',
	economy: 'Economics',
	macro: 'Economics',
	macroeconomics: 'Economics',
});

export function normalizeBlogCategoryAlias(category) {
	if (typeof category !== 'string') {
		return undefined;
	}

	const normalized = category.trim().toLowerCase();
	return Object.hasOwn(BLOG_CATEGORY_ALIASES, normalized)
		? BLOG_CATEGORY_ALIASES[normalized]
		: undefined;
}

export function getBlogCategoryFolder(category) {
	if (!BLOG_CATEGORY_KEYS.includes(category)) {
		return undefined;
	}

	return category.replaceAll('_', ' ');
}

// Feed and category-search endpoints share a stable slug derived from the canonical key.
// This is separate from BLOG_CATEGORIES.href, which may use a shorter page route such as /cs.
export function slugifyBlogCategoryKey(category) {
	if (!BLOG_CATEGORY_KEYS.includes(category)) {
		return undefined;
	}

	return category.toLowerCase().replace(/[\s_]+/g, '-');
}

const blogCategorySlugs = BLOG_CATEGORY_KEYS.map(slugifyBlogCategoryKey);
if (new Set(blogCategorySlugs).size !== BLOG_CATEGORY_KEYS.length) {
	throw new Error('BLOG_CATEGORY_KEYS must produce unique feed and search slugs.');
}
