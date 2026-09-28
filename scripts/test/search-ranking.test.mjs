import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	getMatchSnippet,
	getSearchScore,
	searchIndexedItems,
} from '../../src/lib/searchRanking.mjs';

describe('search ranking', () => {
	it('keeps title and tag weighting consistent for benchmark results', () => {
		const titleMatch = { t: 'IAU', g: [], e: '', x: '', h: [], c: 'ETF' };
		const tagMatch = { t: 'Gold', g: ['IAU'], e: '', x: '', h: [], c: 'ETF' };

		assert.equal(getSearchScore(titleMatch, 'iau'), 60);
		assert.equal(getSearchScore(tagMatch, 'iau'), 25);
		assert.equal(searchIndexedItems([tagMatch, titleMatch], 'IAU')[0].item, titleMatch);
	});

	it('uses the same body boundary candidates for snippets and scoring', () => {
		const item = { t: 'Post', d: '', g: [], h: [], c: 'ETF', e: 'prefix...', x: 'query suffix' };

		assert.equal(getSearchScore(item, 'query'), 12);
		assert.match(getMatchSnippet(item, 'query'), /query/);
	});

	it('matches normalized Unicode in body text and highlights the original characters', () => {
		const item = {
			t: 'Spring guide',
			d: '',
			g: [],
			h: [],
			c: 'Programming',
			e: 'Use ＳＰＲＩＮＧ here',
			x: '',
		};

		assert.equal(getSearchScore(item, 'spring'), 60 + 12);
		assert.equal(searchIndexedItems([item], 'ＳＰＲＩＮＧ')[0].score, 72);
		assert.match(getMatchSnippet(item, 'spring'), /ＳＰＲＩＮＧ/);
	});

	it('refreshes prepared search fields when an indexed item changes', () => {
		const item = {
			t: 'Original title',
			d: 'Original description',
			g: [],
			h: [],
			c: 'Programming',
			e: 'Original body phrase',
			x: '',
		};

		assert.equal(searchIndexedItems([item], 'original').length, 1);
		item.t = 'Updated title';
		item.d = 'Updated description';
		item.e = 'Updated body phrase';
		assert.equal(searchIndexedItems([item], 'original').length, 0);
		const updated = searchIndexedItems([item], 'updated');
		assert.equal(updated.length, 1);
		assert.match(updated[0].snippet, /Updated description/);
	});

	it('invalidates prepared category, tag, and heading arrays after in-place edits', () => {
		const item = {
			t: 'Topic overview',
			d: '',
			g: ['oldtag'],
			h: ['Old heading'],
			c: ['Old category'],
			e: '',
			x: '',
		};

		assert.equal(searchIndexedItems([item], 'oldtag').length, 1);
		item.g[0] = 'newtag';
		item.h[0] = 'New heading';
		item.c[0] = 'New category';

		assert.equal(searchIndexedItems([item], 'oldtag').length, 0);
		assert.equal(searchIndexedItems([item], 'newtag')[0].score, 25);
		assert.equal(searchIndexedItems([item], 'new heading')[0].score, 20);
		assert.equal(searchIndexedItems([item], 'new category')[0].score, 15);
	});
});
