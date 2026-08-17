function getPostId(post) {
	return String(post?.id ?? post?.data?.slug ?? post?.data?.title ?? '');
}

function getPostDateValue(post) {
	const date = post?.data?.pubDate ?? post?.data?.date;
	if (!date) return 0;

	const value = date instanceof Date ? date.getTime() : Date.parse(String(date));
	return Number.isFinite(value) ? value : 0;
}

function comparePostsByDateDesc(left, right) {
	const dateDifference = getPostDateValue(right) - getPostDateValue(left);
	if (dateDifference !== 0) return dateDifference;

	const titleDifference = String(left?.data?.title ?? '').localeCompare(
		String(right?.data?.title ?? ''),
		'ko',
		{ sensitivity: 'base', numeric: true },
	);
	if (titleDifference !== 0) return titleDifference;

	return getPostId(left).localeCompare(getPostId(right), 'en', { numeric: true });
}

function uniquePosts(posts) {
	const seen = new Set();

	return posts.filter((post) => {
		const id = getPostId(post);
		if (seen.has(id)) return false;
		seen.add(id);
		return true;
	});
}

function selectPosts(posts, predicate, limit, excludedIds = new Set()) {
	return posts
		.filter((post) => !excludedIds.has(getPostId(post)) && predicate(post))
		.sort(comparePostsByDateDesc)
		.slice(0, limit);
}

function getPostCategories(post, normalizeCategory) {
	const rawCategories = post?.data?.categories;
	const categories = Array.isArray(rawCategories)
		? rawCategories
		: rawCategories
			? [rawCategories]
			: [];

	return categories.map(normalizeCategory).filter(Boolean);
}

function addToUsed(posts, usedIds) {
	posts.forEach((post) => usedIds.add(getPostId(post)));
}

export function sortPostsByDate(posts) {
	return [...posts].sort(comparePostsByDateDesc);
}

export function buildHomeFeed(posts, groups, normalizeCategory = (value) => value) {
	const candidates = uniquePosts(Array.isArray(posts) ? posts : []);
	const usedIds = new Set();
	const featured = selectPosts(candidates, (post) => post?.data?.pinned === true, 3);
	addToUsed(featured, usedIds);

	const recent = selectPosts(candidates, () => true, 6, usedIds);
	addToUsed(recent, usedIds);

	const categorySections = groups.map((group) => {
		const categorySet = new Set(group.categories);
		const selected = selectPosts(
			candidates,
			(post) =>
				getPostCategories(post, normalizeCategory).some((category) => categorySet.has(category)),
			3,
			usedIds,
		);
		addToUsed(selected, usedIds);

		return { ...group, posts: selected };
	});

	return { featured, recent, categorySections };
}
