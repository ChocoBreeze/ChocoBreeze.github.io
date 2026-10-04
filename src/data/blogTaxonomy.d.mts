export const BLOG_CATEGORY_KEYS: readonly [
	'ETF',
	'Economics',
	'Semiconductor',
	'Computer Science',
	'Programming',
	'Problem_Solving',
	'Reports',
	'Market Brief',
];

export type BlogCategoryKey = (typeof BLOG_CATEGORY_KEYS)[number];

export const BLOG_CATEGORY_ALIASES: Readonly<Record<string, BlogCategoryKey>>;
export function normalizeBlogCategoryAlias(category: unknown): BlogCategoryKey | undefined;
export function getBlogCategoryFolder(category: string): string | undefined;
export function slugifyBlogCategoryKey(category: unknown): string | undefined;
