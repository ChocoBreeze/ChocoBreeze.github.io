const DEFAULT_RESULT_LIMIT = 8;

export function normalizeQuickSearchQuery(value) {
	return typeof value === 'string' ? value.normalize('NFKC').trim().toLowerCase() : '';
}

function normalizeCategories(value) {
	if (Array.isArray(value)) {
		return value
			.filter((category) => typeof category === 'string')
			.map((category) => category.trim())
			.filter(Boolean);
	}

	return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function createQuickSearchIndex(posts) {
	return posts
		.map((post) => {
			const data = post?.data;
			const title = typeof data?.title === 'string' ? data.title.trim() : '';
			const slug = typeof data?.slug === 'string' && data.slug.trim() ? data.slug.trim() : post?.id;

			if (!title || typeof slug !== 'string' || !slug.trim()) return undefined;

			return {
				t: title,
				d: typeof data.description === 'string' ? data.description.trim() : undefined,
				c: normalizeCategories(data.categories),
				s: slug.trim(),
			};
		})
		.filter(Boolean);
}

export function isQuickSearchItem(item) {
	return Boolean(
		item && typeof item === 'object' && typeof item.t === 'string' && typeof item.s === 'string',
	);
}

function includesQuery(value, query) {
	return typeof value === 'string' && normalizeQuickSearchQuery(value).includes(query);
}

function getCategoryText(category) {
	if (Array.isArray(category)) return category.join(' ');
	return typeof category === 'string' ? category : '';
}

export function searchQuickIndex(items, value, limit = DEFAULT_RESULT_LIMIT) {
	const query = normalizeQuickSearchQuery(value);
	if (query.length < 2 || !Array.isArray(items)) return [];

	const resultLimit = Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_RESULT_LIMIT;
	return items
		.filter(isQuickSearchItem)
		.map((item) => {
			let score = 0;
			if (includesQuery(item.t, query)) score += 100;
			if (includesQuery(getCategoryText(item.c), query)) score += 30;
			if (includesQuery(item.d, query)) score += 20;
			return { item, score };
		})
		.filter((result) => result.score > 0)
		.sort((a, b) => b.score - a.score || a.item.t.localeCompare(b.item.t, 'ko'))
		.slice(0, resultLimit);
}
