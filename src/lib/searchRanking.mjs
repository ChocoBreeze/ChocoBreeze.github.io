import { findSearchMatchRange, normalizeSearchAccessQuery } from './searchAccess.mjs';
import { findAnchorForOffset } from './searchSections.mjs';
import { getSearchTextCandidates } from './searchText.mjs';

const preparedItemCache = new WeakMap();

function normalizeText(value) {
	return typeof value === 'string' ? normalizeSearchAccessQuery(value) : '';
}

function normalizeOptionalText(value) {
	return typeof value === 'string' ? normalizeSearchAccessQuery(value) : undefined;
}

function snapshotValue(value) {
	return Array.isArray(value) ? [...value] : value;
}

function matchesSnapshot(value, snapshot) {
	if (!Array.isArray(snapshot)) return Object.is(value, snapshot);
	return (
		Array.isArray(value) &&
		value.length === snapshot.length &&
		value.every((entry, index) => Object.is(entry, snapshot[index]))
	);
}

function prepareSearchItem(item) {
	const cached = preparedItemCache.get(item);
	if (
		cached &&
		['t', 'd', 'e', 'x', 'f', 'c', 'g', 'h'].every((key) =>
			matchesSnapshot(item[key], cached.snapshot[key]),
		)
	) {
		return cached;
	}

	const bodyCandidates = getSearchTextCandidates(item.e ?? '', item.x ?? '');
	const headings = item.h ?? [];
	const tags = item.g ?? [];
	const snippetSources = [item.d, ...headings, ...bodyCandidates, item.f].filter(Boolean);
	const prepared = {
		snapshot: Object.fromEntries(
			['t', 'd', 'e', 'x', 'f', 'c', 'g', 'h'].map((key) => [key, snapshotValue(item[key])]),
		),
		title: normalizeOptionalText(item.t),
		description: normalizeOptionalText(item.d),
		bodyCandidates: bodyCandidates.map(normalizeText),
		file: normalizeOptionalText(item.f),
		tags: tags.map(normalizeOptionalText),
		headings: headings.map(normalizeOptionalText),
		category: normalizeText(getCategoryLabel(item.c)),
		snippetSources: snippetSources.map((source) => ({ source, normalized: normalizeText(source) })),
	};
	preparedItemCache.set(item, prepared);
	return prepared;
}

export function getCategoryLabel(categories) {
	if (Array.isArray(categories)) return categories[0] || 'Uncategorized';
	return categories || 'Uncategorized';
}

export function getSearchScore(item, query) {
	const prepared = prepareSearchItem(item);
	const normalizedQuery = normalizeSearchAccessQuery(query);
	let score = 0;

	if (prepared.title?.includes(normalizedQuery)) score += 60;
	if (prepared.description?.includes(normalizedQuery)) score += 30;
	if (prepared.bodyCandidates.some((source) => source.includes(normalizedQuery))) score += 12;
	if (prepared.file?.includes(normalizedQuery)) score += 35;

	if (prepared.tags.some((tag) => tag?.includes(normalizedQuery))) {
		score += 25;
	}

	if (prepared.headings.some((heading) => heading?.includes(normalizedQuery))) {
		score += 20;
	}

	if (prepared.category.includes(normalizedQuery)) {
		score += 15;
	}

	return score;
}

export function getMatchSnippet(item, query) {
	const normalizedQuery = normalizeSearchAccessQuery(query);
	for (const { source, normalized } of prepareSearchItem(item).snippetSources) {
		if (!normalized.includes(normalizedQuery)) continue;

		const match = findSearchMatchRange(source, normalizedQuery);
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

/**
 * Returns the heading anchor of the section a body match falls in, so a result
 * can link into the post instead of its top (plan 28).
 *
 * The offset is measured in the same body text the index stores section offsets
 * against. The excerpt boundary trims whitespace, so an offset can be off by a
 * character or two — immaterial next to section length, but it means an anchor
 * is never claimed for a match outside the body.
 *
 * Locating a match inside a full body is costly, so callers resolve anchors only
 * for the results they actually render, never for the whole result set.
 */
export function getMatchAnchor(item, query) {
	const anchors = item?.v;
	if (!Array.isArray(anchors) || anchors.length === 0) {
		return undefined;
	}

	const normalizedQuery = normalizeSearchAccessQuery(query);
	if (!normalizedQuery) {
		return undefined;
	}

	// The prepared body text is already normalized and cached, so this is a plain
	// indexOf. Normalization can shift an offset by a character or two, which is
	// immaterial against section lengths.
	for (const candidate of prepareSearchItem(item).bodyCandidates) {
		const offset = candidate.indexOf(normalizedQuery);
		if (offset >= 0) {
			return findAnchorForOffset(anchors, offset);
		}
	}

	return undefined;
}

export function searchIndexedItems(items, value, { limit = Number.POSITIVE_INFINITY } = {}) {
	const query = normalizeSearchAccessQuery(value);
	if (query.length < 2) return [];

	return items
		.map((item) => ({
			item,
			score: getSearchScore(item, query),
		}))
		.filter((result) => result.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((result) => ({ ...result, snippet: getMatchSnippet(result.item, query) }));
}
