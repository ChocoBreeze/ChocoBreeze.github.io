import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	formatBenchmarkReport,
	getBenchmarkQueries,
	getCurrentIndexByteSummary,
	initializePagefind,
	PAGEFIND_ROOT_SELECTOR,
	PAGEFIND_CATEGORY_FILTER,
	sumFileSizes,
} from '../benchmark-search.mjs';

describe('search benchmark helpers', () => {
	it('uses representative Korean, ticker, code, and no-match queries', () => {
		assert.deepEqual(getBenchmarkQueries(), ['ETF', '반도체', 'IAU', 'git diff --cached', '🧿🦄']);
	});

	it('waits for the Node fallback instance to become ready before measuring', async () => {
		const calls = [];
		await initializePagefind({
			init: async () => calls.push('init'),
			options: async (options) => calls.push(options),
		});
		assert.deepEqual(calls, ['init', { mergeFilter: {} }]);
	});

	it('sums output files and formats a deterministic report', () => {
		assert.equal(sumFileSizes([{ bytes: 1024 }, { bytes: 2048 }]), 3072);
		assert.deepEqual(
			getCurrentIndexByteSummary([
				{ relativePath: 'search.json', bytes: 10 },
				{ relativePath: 'search\\etf.json', bytes: 20 },
				{ relativePath: 'search/quick.json', bytes: 3 },
				{ relativePath: 'code-search.json', bytes: 30 },
			]),
			{ total: 63, posts: 10, categories: 20, quick: 3, code: 30 },
		);
		const report = formatBenchmarkReport({
			pagefindVersion: '1.5.2',
			currentIndexBytes: { total: 63, posts: 10, categories: 20, quick: 3, code: 30 },
			pagefindBytes: 2048,
			pagefindInitialTransferBytes: 150,
			pagefindBootstrapBytes: 100,
			pagefindInitMs: 2.5,
			pagefindFirstResultMs: 5.5,
			queries: [
				{
					query: 'ETF',
					pagefindResultCount: 3,
					pagefindCategoryResultCount: 2,
					pagefindDurationMs: 3,
					transferBytes: 50,
					baseline: {
						posts: {
							resultCount: 5,
							topResults: [{ title: 'ETF post', snippet: '기준 스니펫' }],
							durationMs: 1,
						},
						category: { resultCount: 2, topResults: [] },
						code: { resultCount: 1, topResults: [] },
					},
					pagefindTopResults: [{ title: 'ETF page', snippet: 'Pagefind 스니펫' }],
					pagefindCategoryTopResults: [],
				},
			],
		});

		assert.equal(PAGEFIND_ROOT_SELECTOR, '.post-body');
		assert.deepEqual(PAGEFIND_CATEGORY_FILTER, { category: 'ETF' });
		assert.match(report, /Pagefind: 1\.5\.2/);
		assert.match(report, /\| ETF \| 5 \| 2 \| 1 \| 3 \| 2 \|/);
		assert.match(report, /ETF post/);
		assert.match(report, /기준 스니펫/);
		assert.match(report, /Pagefind 스니펫/);
		assert.match(report, /Pagefind initial transfer/);
		assert.match(report, /not a replacement decision/);
	});
});
