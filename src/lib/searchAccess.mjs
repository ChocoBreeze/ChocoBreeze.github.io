export const DEFAULT_SEARCH_INDEX_PATH = '/search.json';
export const CODE_SEARCH_INDEX_PATH = '/code-search.json';
export const MIN_SEARCH_QUERY_LENGTH = 2;

export function normalizeSearchAccessQuery(value) {
	return typeof value === 'string' ? value.trim() : '';
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
