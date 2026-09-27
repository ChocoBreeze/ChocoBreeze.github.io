import { DEFAULT_SEARCH_INDEX_PATH } from './searchAccess.mjs';

export function readSearchState(search, validCategoryPaths = [DEFAULT_SEARCH_INDEX_PATH]) {
	const params = new URLSearchParams(search);
	const requestedCategory = params.get('category');

	return {
		query: params.get('q') ?? '',
		mode: params.get('mode') === 'code' ? 'code' : 'post',
		categoryPath:
			requestedCategory && validCategoryPaths.includes(requestedCategory)
				? requestedCategory
				: DEFAULT_SEARCH_INDEX_PATH,
	};
}

export function serializeSearchState({
	query = '',
	mode = 'post',
	categoryPath = DEFAULT_SEARCH_INDEX_PATH,
}) {
	const params = new URLSearchParams();
	if (String(query).trim()) params.set('q', String(query));
	if (mode === 'code') params.set('mode', 'code');
	if (categoryPath && categoryPath !== DEFAULT_SEARCH_INDEX_PATH) {
		params.set('category', categoryPath);
	}
	const search = params.toString();
	return search ? `?${search}` : '';
}
