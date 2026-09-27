import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { readSearchState, serializeSearchState } from '../../src/lib/searchState.mjs';

const categories = ['/search.json', '/search/etf.json', '/search/programming.json'];

describe('search URL state', () => {
	it('restores the query, mode, and an allowed category', () => {
		assert.deepEqual(
			readSearchState('?q=ETF%20guide&mode=post&category=%2Fsearch%2Fetf.json', categories),
			{ query: 'ETF guide', mode: 'post', categoryPath: '/search/etf.json' },
		);
	});

	it('falls back safely for invalid modes and categories', () => {
		assert.deepEqual(readSearchState('?mode=unknown&category=%2Fprivate.json', categories), {
			query: '',
			mode: 'post',
			categoryPath: '/search.json',
		});
	});

	it('serializes only non-default state and encodes the query', () => {
		assert.equal(serializeSearchState({}), '');
		assert.equal(
			serializeSearchState({
				query: ' ＳＰＲＩＮＧ ',
				mode: 'code',
				categoryPath: '/search/etf.json',
			}),
			'?q=+%EF%BC%B3%EF%BC%B0%EF%BC%B2%EF%BC%A9%EF%BC%AE%EF%BC%A7+&mode=code&category=%2Fsearch%2Fetf.json',
		);
	});
});
