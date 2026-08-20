import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	getListFilterOptions,
	getPostYear,
	matchesListFilters,
	normalizePostTags,
} from '../../src/lib/listFilters.mjs';

describe('getPostYear', () => {
	it('uses pubDate before the legacy date field', () => {
		assert.equal(
			getPostYear({ data: { pubDate: new Date('2026-03-01'), date: new Date('2025-03-01') } }),
			'2026',
		);
	});

	it('falls back to the legacy date field', () => {
		assert.equal(getPostYear({ data: { date: new Date('2025-03-01') } }), '2025');
	});

	it('uses the display timezone at a year boundary', () => {
		assert.equal(getPostYear({ data: { pubDate: new Date('2026-01-01T00:00:00+09:00') } }), '2026');
	});

	it('returns an empty value for missing or invalid dates', () => {
		assert.equal(getPostYear({ data: {} }), '');
		assert.equal(getPostYear({ data: { pubDate: 'not-a-date' } }), '');
	});
});

describe('getListFilterOptions', () => {
	it('collects unique years and tags in display order', () => {
		assert.deepEqual(
			getListFilterOptions([
				{ data: { pubDate: new Date('2025-01-01'), tags: ['AI', 'ETF'] } },
				{ data: { pubDate: new Date('2026-01-01'), tags: ['ETF', 'Robotics'] } },
				{ data: { pubDate: new Date('2025-04-01'), tags: null } },
			]),
			{ years: ['2026', '2025'], tags: ['AI', 'ETF', 'Robotics'] },
		);
	});
});

describe('normalizePostTags', () => {
	it('trims tags and removes empty values', () => {
		assert.deepEqual(normalizePostTags([' ETF ', '  ', 'AI']), ['ETF', 'AI']);
	});
});

describe('matchesListFilters', () => {
	const post = { year: '2026', tags: ['AI', 'ETF'], difficulty: 'Medium' };

	it('accepts every item when no filters are selected', () => {
		assert.equal(matchesListFilters(post, {}), true);
	});

	it('applies the year filter', () => {
		assert.equal(matchesListFilters(post, { year: '2026' }), true);
		assert.equal(matchesListFilters(post, { year: '2025' }), false);
	});

	it('applies the tag filter', () => {
		assert.equal(matchesListFilters(post, { tag: 'ETF' }), true);
		assert.equal(matchesListFilters(post, { tag: 'Semiconductor' }), false);
	});

	it('applies the difficulty filter', () => {
		assert.equal(matchesListFilters(post, { difficulty: 'Medium' }), true);
		assert.equal(matchesListFilters(post, { difficulty: 'Hard' }), false);
	});

	it('requires both filters to match', () => {
		assert.equal(matchesListFilters(post, { year: '2026', tag: 'ETF' }), true);
		assert.equal(matchesListFilters(post, { year: '2025', tag: 'ETF' }), false);
		assert.equal(
			matchesListFilters(post, { year: '2026', tag: 'ETF', difficulty: 'Medium' }),
			true,
		);
		assert.equal(matchesListFilters(post, { year: '2026', tag: 'ETF', difficulty: 'Hard' }), false);
	});
});
