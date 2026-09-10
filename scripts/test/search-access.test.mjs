import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	CODE_SEARCH_INDEX_PATH,
	DEFAULT_SEARCH_INDEX_PATH,
	addSearchCacheVersion,
	getSearchIndexPath,
	normalizeSearchAccessQuery,
	shouldLoadSearchIndex,
} from '../../src/lib/searchAccess.mjs';

describe('search index access', () => {
	it('loads only after two non-whitespace characters', () => {
		assert.equal(normalizeSearchAccessQuery('  '), '');
		assert.equal(shouldLoadSearchIndex(''), false);
		assert.equal(shouldLoadSearchIndex(' 한 '), false);
		assert.equal(shouldLoadSearchIndex(' 한글 '), true);
	});

	it('chooses code, category, and safe fallback paths', () => {
		assert.equal(getSearchIndexPath('code', '/search/ETF.json'), CODE_SEARCH_INDEX_PATH);
		assert.equal(getSearchIndexPath('post', '/search/etf.json'), '/search/etf.json');
		assert.equal(getSearchIndexPath('post'), DEFAULT_SEARCH_INDEX_PATH);
		assert.equal(getSearchIndexPath('post', '/private/index.json'), DEFAULT_SEARCH_INDEX_PATH);
	});

	it('adds a deployment version without dropping existing query or hash values', () => {
		assert.equal(addSearchCacheVersion('/search.json', 'abc123'), '/search.json?v=abc123');
		assert.equal(
			addSearchCacheVersion('/search.json?mode=post#results', 'build 1'),
			'/search.json?mode=post&v=build%201#results',
		);
		assert.equal(addSearchCacheVersion('/search.json', '  '), '/search.json');
	});
});
