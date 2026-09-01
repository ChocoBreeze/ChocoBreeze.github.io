import {
	normalizePostAssetClass,
	normalizePostStrategy,
	normalizePostTicker,
} from './listFilters.mjs';

export const MAX_COMPARE_ETFS = 4;

function getPostHref(post) {
	const slug = post?.data?.slug || post?.id;
	return typeof slug === 'string' && slug.trim() ? `/blog/${slug}/` : '';
}

function normalizeValue(value) {
	return typeof value === 'string' ? value.trim() : '';
}

export function createComparableEtfs(posts) {
	const byTicker = new Map();

	for (const post of Array.isArray(posts) ? posts : []) {
		const ticker = normalizePostTicker(post?.data?.ticker);
		const href = getPostHref(post);
		const title = normalizeValue(post?.data?.title);
		if (!ticker || !href || !title || byTicker.has(ticker)) {
			continue;
		}

		byTicker.set(ticker, {
			ticker,
			title,
			href,
			issuer: normalizeValue(post?.data?.issuer),
			assetClass: normalizePostAssetClass(post?.data?.assetClass),
			strategy: normalizePostStrategy(post?.data?.strategy),
			exposure: normalizeValue(post?.data?.exposure),
			leverage: normalizeValue(post?.data?.leverage),
			incomeStyle: normalizeValue(post?.data?.incomeStyle),
		});
	}

	return [...byTicker.values()].sort(
		(left, right) =>
			left.ticker.localeCompare(right.ticker, 'en') || left.title.localeCompare(right.title, 'ko'),
	);
}

export function getEtfComparisonCoverage(posts, comparableEtfs) {
	const total = Array.isArray(posts) ? posts.length : 0;
	const comparable = Array.isArray(comparableEtfs) ? comparableEtfs.length : 0;

	return {
		total,
		comparable,
		percentage: total > 0 ? Math.round((comparable / total) * 100) : 0,
	};
}

export function parseCompareTickers(value, max = MAX_COMPARE_ETFS) {
	const limit = Number.isInteger(max) && max > 0 ? max : MAX_COMPARE_ETFS;
	const values = Array.isArray(value) ? value : [value];
	const tickers = [];

	for (const item of values) {
		if (typeof item !== 'string') continue;

		for (const token of item.split(',')) {
			const ticker = normalizePostTicker(token);
			if (ticker && !tickers.includes(ticker)) {
				tickers.push(ticker);
			}
			if (tickers.length >= limit) return tickers;
		}
	}

	return tickers;
}

export function selectComparableEtfs(entries, tickers, max = MAX_COMPARE_ETFS) {
	const limit = Number.isInteger(max) && max > 0 ? max : MAX_COMPARE_ETFS;
	const normalizedTickers = parseCompareTickers(tickers, Number.MAX_SAFE_INTEGER);
	const entriesByTicker = new Map(
		(Array.isArray(entries) ? entries : []).map((entry) => [
			normalizePostTicker(entry?.ticker),
			entry,
		]),
	);

	return normalizedTickers
		.map((ticker) => entriesByTicker.get(ticker))
		.filter((entry) => entry !== undefined)
		.slice(0, limit);
}
