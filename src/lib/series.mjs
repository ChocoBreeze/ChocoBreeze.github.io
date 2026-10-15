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

// --- Series listing (plan 27) --------------------------------------------

function getSeriesDisplayName(posts, seriesSlug) {
	// `series` is the display name and `seriesSlug` the identifier. If entries
	// disagree, the first non-empty name in series order wins so the hub shows a
	// stable label instead of whichever post happened to sort first by date.
	for (const post of posts) {
		const name = post?.data?.series;
		if (typeof name === 'string' && name.trim()) {
			return name.trim();
		}
	}

	return seriesSlug;
}

function getPostCategories(post) {
	const categories = post?.data?.categories;
	if (Array.isArray(categories)) {
		return categories.filter((category) => typeof category === 'string');
	}

	return typeof categories === 'string' ? [categories] : [];
}

/**
 * Groups published posts by `seriesSlug`.
 *
 * Returns one entry per series, each with its posts in reading order, sorted so
 * the most recently updated series comes first.
 */
export function buildSeriesList(posts = []) {
	const groups = new Map();

	for (const post of posts) {
		const seriesSlug = post?.data?.seriesSlug;
		if (!seriesSlug || post?.data?.draft) {
			continue;
		}

		const existing = groups.get(seriesSlug);
		if (existing) {
			existing.push(post);
		} else {
			groups.set(seriesSlug, [post]);
		}
	}

	return [...groups.entries()]
		.map(([seriesSlug, seriesPosts]) => {
			const ordered = sortSeriesPosts(seriesPosts);
			const dates = ordered.map((post) => getPostDate(post)).filter((value) => value > 0);

			return {
				slug: seriesSlug,
				name: getSeriesDisplayName(ordered, seriesSlug),
				posts: ordered,
				count: ordered.length,
				firstDate: dates.length > 0 ? new Date(Math.min(...dates)) : undefined,
				latestDate: dates.length > 0 ? new Date(Math.max(...dates)) : undefined,
				categories: [...new Set(ordered.flatMap((post) => getPostCategories(post)))],
			};
		})
		.sort((a, b) => {
			const latestA = a.latestDate?.valueOf() ?? 0;
			const latestB = b.latestDate?.valueOf() ?? 0;
			return latestB - latestA || a.name.localeCompare(b.name);
		});
}

export function findSeries(posts = [], seriesSlug) {
	return buildSeriesList(posts).find((series) => series.slug === seriesSlug);
}
