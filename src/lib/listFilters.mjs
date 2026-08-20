export const DISPLAY_TIME_ZONE = 'Asia/Seoul';

export function getPostYear(post) {
	const dateValue = post?.data?.pubDate ?? post?.data?.date;
	if (!dateValue) {
		return '';
	}

	const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
	if (!Number.isFinite(date.valueOf())) {
		return '';
	}

	const year = new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		timeZone: DISPLAY_TIME_ZONE,
	})
		.formatToParts(date)
		.find((part) => part.type === 'year')?.value;
	return year ?? '';
}

export function normalizePostTags(tags) {
	return Array.isArray(tags)
		? tags
				.filter((tag) => typeof tag === 'string')
				.map((tag) => tag.trim())
				.filter(Boolean)
		: [];
}

export function getListFilterOptions(posts) {
	const years = new Set();
	const tags = new Set();

	for (const post of posts) {
		const year = getPostYear(post);
		if (year) {
			years.add(year);
		}

		for (const tag of normalizePostTags(post?.data?.tags)) {
			tags.add(tag);
		}
	}

	return {
		years: [...years].sort((a, b) => Number(b) - Number(a)),
		tags: [...tags].sort((a, b) => a.localeCompare(b, 'ko')),
	};
}

export function matchesListFilters(item, filters = {}) {
	const year = filters.year ?? '';
	const tag = filters.tag ?? '';
	const difficulty = filters.difficulty ?? '';
	const tags = Array.isArray(item?.tags) ? item.tags : [];

	return (
		(!year || item?.year === year) &&
		(!tag || tags.includes(tag)) &&
		(!difficulty || item?.difficulty === difficulty)
	);
}
