import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildBlogStats } from '../../src/lib/blogStats.mjs';

function post(data = {}) {
	return { data };
}

describe('buildBlogStats', () => {
	it('groups categories and dates in the display timezone', () => {
		const stats = buildBlogStats(
			[
				post({ categories: 'ETF', pubDate: '2026-01-01T00:00:00+09:00' }),
				post({ categories: ['ETF'], pubDate: '2026-01-15T12:00:00+09:00' }),
				post({ categories: 'Programming', date: '2025-12-31T23:00:00+09:00' }),
			],
			{ timeZone: 'Asia/Seoul' },
		);

		assert.equal(stats.totalPosts, 3);
		assert.equal(stats.datedPosts, 3);
		assert.deepEqual(stats.categories, [
			{ key: 'ETF', count: 2 },
			{ key: 'Programming', count: 1 },
		]);
		assert.deepEqual(stats.years, [
			{ year: '2026', count: 2 },
			{ year: '2025', count: 1 },
		]);
		assert.deepEqual(stats.months, [
			{ key: '2026-01', year: '2026', month: '01', count: 2 },
			{ key: '2025-12', year: '2025', month: '12', count: 1 },
		]);
	});

	it('uses a category resolver and excludes invalid dates from date totals', () => {
		const stats = buildBlogStats(
			[
				post({ categories: 'raw', pubDate: 'invalid' }),
				post({ categories: 'raw', pubDate: '2024-02-29T00:00:00+09:00' }),
			],
			{ getCategory: (entry) => (entry.data.categories === 'raw' ? 'Resolved' : undefined) },
		);

		assert.equal(stats.undatedPosts, 1);
		assert.deepEqual(stats.categories, [{ key: 'Resolved', count: 2 }]);
		assert.deepEqual(stats.years, [{ year: '2024', count: 1 }]);
	});

	it('returns empty, deterministic results for malformed input', () => {
		assert.deepEqual(buildBlogStats(null), {
			totalPosts: 0,
			datedPosts: 0,
			undatedPosts: 0,
			categories: [],
			years: [],
			months: [],
		});
	});
});
