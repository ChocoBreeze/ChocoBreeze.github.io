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

export function normalizePostTopics(topics) {
	return Array.isArray(topics)
		? topics
				.filter((topic) => typeof topic === 'string')
				.map((topic) => topic.trim())
				.filter(Boolean)
		: [];
}

export function normalizePostPlatform(platform) {
	return typeof platform === 'string' ? platform.trim() : '';
}

export function normalizeProblemNumber(problemNumber) {
	const value = Number(problemNumber);
	return Number.isInteger(value) && value > 0 ? String(value) : '';
}

export function getTopicSummary(posts, { excludePinned = false } = {}) {
	const counts = new Map();

	for (const post of posts) {
		if (excludePinned && post?.data?.pinned) {
			continue;
		}

		for (const topic of normalizePostTopics(post?.data?.topics)) {
			counts.set(topic, (counts.get(topic) ?? 0) + 1);
		}
	}

	return [...counts].sort((a, b) => b[1] - a[1]);
}

export function getListFilterOptions(posts) {
	const years = new Set();
	const tags = new Set();
	const platforms = new Set();
	const problemNumbers = new Set();

	for (const post of posts) {
		const year = getPostYear(post);
		if (year) {
			years.add(year);
		}

		for (const tag of normalizePostTags(post?.data?.tags)) {
			tags.add(tag);
		}

		const platform = normalizePostPlatform(post?.data?.platform);
		if (platform) {
			platforms.add(platform);
		}

		const problemNumber = normalizeProblemNumber(post?.data?.problemNumber);
		if (problemNumber) {
			problemNumbers.add(problemNumber);
		}
	}

	return {
		years: [...years].sort((a, b) => Number(b) - Number(a)),
		tags: [...tags].sort((a, b) => a.localeCompare(b, 'ko')),
		platforms: [...platforms].sort((a, b) => a.localeCompare(b, 'en')),
		problemNumbers: [...problemNumbers].sort((a, b) => Number(a) - Number(b)),
	};
}

export function matchesListFilters(item, filters = {}) {
	const year = filters.year ?? '';
	const tag = filters.tag ?? '';
	const difficulty = filters.difficulty ?? '';
	const topic = filters.topic ?? '';
	const platform = filters.platform ?? '';
	const problemNumber = filters.problemNumber ?? '';
	const tags = Array.isArray(item?.tags) ? item.tags : [];
	const topics = Array.isArray(item?.topics) ? item.topics : [];

	return (
		(!year || item?.year === year) &&
		(!tag || tags.includes(tag)) &&
		(!difficulty || item?.difficulty === difficulty) &&
		(!topic || topics.includes(topic)) &&
		(!platform || item?.platform === platform) &&
		(!problemNumber || item?.problemNumber === problemNumber)
	);
}
