import { findSearchMatchRange, normalizeSearchAccessQuery } from './searchAccess.mjs';
import { getSearchTextCandidates } from './searchText.mjs';

function includesQuery(value, query) {
	return typeof value === 'string' && normalizeSearchAccessQuery(value).includes(query);
}

export function getCategoryLabel(categories) {
	if (Array.isArray(categories)) return categories[0] || 'Uncategorized';
	return categories || 'Uncategorized';
}

export function getSearchScore(item, query) {
	let score = 0;

	if (includesQuery(item.t, query)) score += 60;
	if (includesQuery(item.d, query)) score += 30;
	if (
		getSearchTextCandidates(item.e ?? '', item.x ?? '').some((source) =>
			includesQuery(source, query),
		)
	) {
		score += 12;
	}
	if (includesQuery(item.f, query)) score += 35;

	if ((item.g ?? []).some((tag) => includesQuery(tag, query))) {
		score += 25;
	}

	if ((item.h ?? []).some((heading) => includesQuery(heading, query))) {
		score += 20;
	}

	if (includesQuery(getCategoryLabel(item.c), query)) {
		score += 15;
	}

	return score;
}

export function getMatchSnippet(item, query) {
	const sources = [
		item.d,
		...(item.h ?? []),
		...getSearchTextCandidates(item.e ?? '', item.x ?? ''),
		item.f,
	];

	for (const source of sources) {
		if (!source) continue;

		const match = findSearchMatchRange(source, query);
		if (!match) continue;

		const contextLength = 90;
		const start = Math.max(0, match.start - contextLength);
		const end = Math.min(source.length, match.end + contextLength);
		const prefix = start > 0 ? '...' : '';
		const suffix = end < source.length ? '...' : '';
		return `${prefix}${source.slice(start, end).trim()}${suffix}`;
	}

	return item.d || item.e || '';
}

export function searchIndexedItems(items, value, { limit = Number.POSITIVE_INFINITY } = {}) {
	const query = normalizeSearchAccessQuery(value);
	if (query.length < 2) return [];

	return items
		.map((item) => ({
			item,
			score: getSearchScore(item, query),
			snippet: getMatchSnippet(item, query),
		}))
		.filter((result) => result.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit);
}
