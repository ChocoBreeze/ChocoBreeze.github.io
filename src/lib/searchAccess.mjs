export const DEFAULT_SEARCH_INDEX_PATH = '/search.json';
export const CODE_SEARCH_INDEX_PATH = '/code-search.json';
export const MIN_SEARCH_QUERY_LENGTH = 2;

export function normalizeSearchAccessQuery(value) {
	return typeof value === 'string' ? value.normalize('NFKC').trim().toLowerCase() : '';
}

export function findSearchMatchRange(value, query) {
	const source = String(value ?? '');
	const normalizedQuery = normalizeSearchAccessQuery(query);
	if (!normalizedQuery) return undefined;

	let normalizedSource = '';
	const sourceRanges = [];
	let sourceOffset = 0;
	for (const character of source) {
		const normalizedCharacter = character.normalize('NFKC').toLowerCase();
		for (let index = 0; index < normalizedCharacter.length; index += 1) {
			sourceRanges.push({ start: sourceOffset, end: sourceOffset + character.length });
		}
		normalizedSource += normalizedCharacter;
		sourceOffset += character.length;
	}

	const matchIndex = normalizedSource.indexOf(normalizedQuery);
	if (matchIndex === -1) return undefined;
	return {
		start: sourceRanges[matchIndex].start,
		end: sourceRanges[matchIndex + normalizedQuery.length - 1].end,
	};
}

export function shouldLoadSearchIndex(value) {
	return normalizeSearchAccessQuery(value).length >= MIN_SEARCH_QUERY_LENGTH;
}

export function addSearchCacheVersion(path, version) {
	const normalizedVersion = typeof version === 'string' ? version.trim() : '';
	if (!normalizedVersion) return path;

	const hashIndex = path.indexOf('#');
	const pathAndQuery = hashIndex === -1 ? path : path.slice(0, hashIndex);
	const hash = hashIndex === -1 ? '' : path.slice(hashIndex);
	const separator = pathAndQuery.includes('?') ? '&' : '?';

	return `${pathAndQuery}${separator}v=${encodeURIComponent(normalizedVersion)}${hash}`;
}

export function getSearchIndexPath(mode, categoryPath = DEFAULT_SEARCH_INDEX_PATH) {
	if (mode === 'code') {
		return CODE_SEARCH_INDEX_PATH;
	}

	if (
		categoryPath === DEFAULT_SEARCH_INDEX_PATH ||
		/^\/search\/[a-z0-9-]+\.json$/.test(categoryPath)
	) {
		return categoryPath;
	}

	return DEFAULT_SEARCH_INDEX_PATH;
}
