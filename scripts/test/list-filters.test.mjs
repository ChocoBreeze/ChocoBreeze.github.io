import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	getListFilterOptions,
	getPostYear,
	getTopicSummary,
	matchesListFilters,
	normalizePostAssetClass,
	normalizePostPlatform,
	normalizeSearchQuery,
	normalizePostTags,
	normalizePostTopics,
	normalizeProblemNumber,
	normalizePostStrategy,
	normalizePostTicker,
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
			{
				years: ['2026', '2025'],
				tags: ['AI', 'ETF', 'Robotics'],
				platforms: [],
				problemNumbers: [],
				assetClasses: [],
				strategies: [],
			},
		);
	});
});

describe('normalizePostTags', () => {
	it('trims tags and removes empty values', () => {
		assert.deepEqual(normalizePostTags([' ETF ', '  ', 'AI']), ['ETF', 'AI']);
	});
});

describe('normalizePostTopics', () => {
	it('trims topics and removes empty values', () => {
		assert.deepEqual(normalizePostTopics([' Array ', '  ', 'Graph']), ['Array', 'Graph']);
	});
});

describe('problem-solving metadata normalization', () => {
	it('trims platforms and validates positive problem numbers', () => {
		assert.equal(normalizePostPlatform(' LeetCode '), 'LeetCode');
		assert.equal(normalizePostPlatform(null), '');
		assert.equal(normalizeProblemNumber(1234), '1234');
		assert.equal(normalizeProblemNumber('0'), '');
		assert.equal(normalizeProblemNumber('not-a-number'), '');
	});

	it('collects platform and problem number options in stable order', () => {
		assert.deepEqual(
			getListFilterOptions([
				{ data: { platform: 'LeetCode', problemNumber: 200 } },
				{ data: { platform: ' Baekjoon ', problemNumber: 1 } },
				{ data: { platform: 'LeetCode', problemNumber: 50 } },
			]),
			{
				years: [],
				tags: [],
				platforms: ['Baekjoon', 'LeetCode'],
				problemNumbers: ['1', '50', '200'],
				assetClasses: [],
				strategies: [],
			},
		);
	});
});

describe('normalizeSearchQuery', () => {
	it('trims and lowercases search text', () => {
		assert.equal(normalizeSearchQuery('  QQQ ETF  '), 'qqq etf');
		assert.equal(normalizeSearchQuery(null), '');
		assert.equal(normalizeSearchQuery('IAU'), 'iau');
	});
});

describe('ETF metadata normalization', () => {
	it('normalizes stable ETF fields for filters and cards', () => {
		assert.equal(normalizePostTicker(' qqq '), 'QQQ');
		assert.equal(normalizePostAssetClass(' Equity '), 'Equity');
		assert.equal(normalizePostStrategy(' Index '), 'Index');
	});

	it('collects stable ETF filter options', () => {
		assert.deepEqual(
			getListFilterOptions([
				{ data: { assetClass: 'Equity', strategy: 'Index' } },
				{ data: { assetClass: ' Commodity ', strategy: 'Physical' } },
			]),
			{
				years: [],
				tags: [],
				platforms: [],
				problemNumbers: [],
				assetClasses: ['Commodity', 'Equity'],
				strategies: ['Index', 'Physical'],
			},
		);
	});
});

describe('getTopicSummary', () => {
	it('can exclude pinned posts from filter counts', () => {
		assert.deepEqual(
			getTopicSummary(
				[
					{ data: { pinned: true, topics: ['Pinned Only', 'Array'] } },
					{ data: { pinned: false, topics: ['Array', 'Graph'] } },
				],
				{ excludePinned: true },
			),
			[
				['Array', 1],
				['Graph', 1],
			],
		);
	});
});

describe('matchesListFilters', () => {
	const post = {
		year: '2026',
		tags: ['AI', 'ETF'],
		difficulty: 'Medium',
		topics: ['Array', 'Graph'],
		platform: 'LeetCode',
		problemNumber: '1234',
		assetClass: 'Equity',
		strategy: 'Index',
		search: 'QQQ Nasdaq-100',
	};

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

	it('applies the topic filter', () => {
		assert.equal(matchesListFilters(post, { topic: 'Graph' }), true);
		assert.equal(matchesListFilters(post, { topic: 'String' }), false);
	});

	it('applies platform and problem number filters', () => {
		assert.equal(matchesListFilters(post, { platform: 'LeetCode' }), true);
		assert.equal(matchesListFilters(post, { platform: 'Baekjoon' }), false);
		assert.equal(matchesListFilters(post, { problemNumber: '1234' }), true);
		assert.equal(matchesListFilters(post, { problemNumber: '1' }), false);
	});

	it('matches normalized search text', () => {
		assert.equal(matchesListFilters(post, { search: ' qqq ' }), true);
		assert.equal(matchesListFilters(post, { search: 'sp500' }), false);
		assert.equal(matchesListFilters({ search: 'IAU iShares Gold Trust' }, { search: 'iau' }), true);
	});

	it('applies ETF asset class and strategy filters', () => {
		assert.equal(matchesListFilters(post, { assetClass: 'Equity' }), true);
		assert.equal(matchesListFilters(post, { assetClass: 'Commodity' }), false);
		assert.equal(matchesListFilters(post, { strategy: 'Index' }), true);
		assert.equal(matchesListFilters(post, { strategy: 'Physical' }), false);
	});

	it('requires both filters to match', () => {
		assert.equal(matchesListFilters(post, { year: '2026', tag: 'ETF' }), true);
		assert.equal(matchesListFilters(post, { year: '2025', tag: 'ETF' }), false);
		assert.equal(
			matchesListFilters(post, { year: '2026', tag: 'ETF', difficulty: 'Medium' }),
			true,
		);
		assert.equal(matchesListFilters(post, { year: '2026', tag: 'ETF', difficulty: 'Hard' }), false);
		assert.equal(
			matchesListFilters(post, {
				year: '2026',
				tag: 'ETF',
				difficulty: 'Medium',
				topic: 'Graph',
			}),
			true,
		);
		assert.equal(
			matchesListFilters(post, {
				year: '2026',
				tag: 'ETF',
				difficulty: 'Medium',
				topic: 'String',
			}),
			false,
		);
		assert.equal(
			matchesListFilters(post, {
				platform: 'LeetCode',
				problemNumber: '1234',
			}),
			true,
		);
	});
});
