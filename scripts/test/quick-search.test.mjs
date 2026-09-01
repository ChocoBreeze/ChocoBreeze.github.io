import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	createQuickSearchIndex,
	isQuickSearchItem,
	normalizeQuickSearchQuery,
	searchQuickIndex,
} from '../../src/lib/quickSearch.mjs';

describe('quick search index', () => {
	it('normalizes query whitespace and width', () => {
		assert.equal(normalizeQuickSearchQuery('  ＥＴＦ  '), 'etf');
		assert.equal(normalizeQuickSearchQuery('a'), 'a');
		assert.equal(normalizeQuickSearchQuery(null), '');
	});

	it('keeps only compact post metadata and falls back to the post id', () => {
		assert.deepEqual(
			createQuickSearchIndex([
				{
					id: 'folder/post-id',
					data: {
						title: 'ETF Guide',
						description: 'A short guide',
						categories: [' ETF ', 'Other'],
						slug: 'custom-slug',
						tags: ['not included'],
					},
				},
				{ id: 'legacy-post', data: { title: 'Legacy', categories: 'Reports' } },
			]),
			[
				{ t: 'ETF Guide', d: 'A short guide', c: ['ETF', 'Other'], s: 'custom-slug' },
				{ t: 'Legacy', d: undefined, c: 'Reports', s: 'legacy-post' },
			],
		);
	});
});

describe('searchQuickIndex', () => {
	const items = [
		{ t: 'ETF Basics', d: 'Learn the basics', c: 'ETF', s: 'etf-basics' },
		{ t: 'Market Brief', d: 'ETF market update', c: 'Market Brief', s: 'market-brief' },
		{ t: 'Git Commands', d: 'Programming notes', c: 'Programming', s: 'git-commands' },
	];

	it('requires two characters and ranks title matches first', () => {
		assert.deepEqual(searchQuickIndex(items, 'e'), []);
		assert.deepEqual(
			searchQuickIndex(items, 'ETF').map(({ item }) => item.s),
			['etf-basics', 'market-brief'],
		);
	});

	it('limits results and ignores malformed entries', () => {
		const manyItems = Array.from({ length: 10 }, (_, index) => ({
			t: `Post ${index}`,
			d: 'common query',
			s: `post-${index}`,
		}));
		assert.equal(searchQuickIndex([...manyItems, { t: 'broken' }, null], 'common').length, 8);
		assert.equal(isQuickSearchItem({ t: 'Post', s: 'post' }), true);
		assert.equal(isQuickSearchItem({ t: 'Post' }), false);
	});
});
