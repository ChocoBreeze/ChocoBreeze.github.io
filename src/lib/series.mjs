function getSeriesOrder(post) {
	const order = post?.data?.seriesOrder;
	return typeof order === 'number' && Number.isFinite(order) ? order : Number.POSITIVE_INFINITY;
}

function getPostDate(post) {
	const date = post?.data?.pubDate ?? post?.data?.date;
	return date instanceof Date ? date.valueOf() : new Date(date ?? 0).valueOf();
}

function getPostKey(post) {
	return post?.data?.slug || post?.id || '';
}

export function sortSeriesPosts(posts) {
	return [...posts].sort((a, b) => {
		const orderA = getSeriesOrder(a);
		const orderB = getSeriesOrder(b);
		if (orderA !== orderB) {
			return orderA - orderB;
		}

		const dateDifference = getPostDate(a) - getPostDate(b);
		if (dateDifference !== 0) {
			return dateDifference;
		}

		return getPostKey(a).localeCompare(getPostKey(b));
	});
}

export function getSeriesPosts(posts, currentPost) {
	const seriesSlug = currentPost?.data?.seriesSlug;
	if (!seriesSlug || currentPost?.data?.draft) {
		return [];
	}

	return sortSeriesPosts(
		posts.filter((post) => !post.data.draft && post.data.seriesSlug === seriesSlug),
	);
}

export function buildSeriesNavigation(posts, currentPost) {
	const seriesPosts = getSeriesPosts(posts, currentPost);
	const currentIndex = seriesPosts.findIndex((post) => post.id === currentPost?.id);
	if (currentIndex < 0) {
		return undefined;
	}

	const toItem = (post) =>
		post
			? {
					id: post.id,
					title: post.data.title,
					slug: getPostKey(post),
				}
			: undefined;

	return {
		name: currentPost.data.series || currentPost.data.seriesSlug,
		current: currentIndex + 1,
		total: seriesPosts.length,
		previous: toItem(seriesPosts[currentIndex - 1]),
		next: toItem(seriesPosts[currentIndex + 1]),
	};
}
