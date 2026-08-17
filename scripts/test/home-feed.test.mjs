import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildHomeFeed, sortPostsByDate } from '../../src/lib/homeFeed.mjs';

function post(id, options = {}) {
	return {
		id,
		data: {
			title: options.title ?? id,
			pubDate: options.date ? new Date(options.date) : undefined,
			categories: options.categories ?? [],
			pinned: options.pinned ?? false,
		},
	};
}

describe('sortPostsByDate', () => {
	it('uses title and id tie-breakers when dates are equal or missing', () => {
		const sorted = sortPostsByDate([
			post('missing-b', { title: '같은 글' }),
			post('dated', { title: '최신 글', date: '2026-08-01T00:00:00+09:00' }),
			post('missing-a', { title: '같은 글' }),
			post('dated-old', { title: '오래된 글', date: '2025-08-01T00:00:00+09:00' }),
		]);

		assert.deepEqual(
			sorted.map((item) => item.id),
			['dated', 'dated-old', 'missing-a', 'missing-b'],
		);
	});
});

describe('buildHomeFeed', () => {
	it('removes featured posts from the recent section', () => {
		const posts = [
			post('pinned', { pinned: true, date: '2026-08-03T00:00:00+09:00' }),
			post('recent', { date: '2026-08-02T00:00:00+09:00' }),
			post('older', { date: '2026-08-01T00:00:00+09:00' }),
		];
		const groups = [{ key: 'empty', categories: ['Unused'] }];

		const feed = buildHomeFeed(posts, groups);

		assert.deepEqual(
			feed.featured.map((item) => item.id),
			['pinned'],
		);
		assert.deepEqual(
			feed.recent.map((item) => item.id),
			['recent', 'older'],
		);
	});

	it('selects canonical categories through the supplied normalizer', () => {
		const posts = [
			...Array.from({ length: 6 }, (_, index) =>
				post(`recent-${index}`, {
					date: `2026-08-${String(10 - index).padStart(2, '0')}T00:00:00+09:00`,
				}),
			),
			post('finance', { categories: ['reports'], date: '2026-08-02T00:00:00+09:00' }),
		];
		const groups = [{ key: 'finance', categories: ['Reports'] }];
		const normalize = (value) => (value === 'reports' ? 'Reports' : value);

		const feed = buildHomeFeed(posts, groups, normalize);

		assert.deepEqual(
			feed.categorySections[0].posts.map((item) => item.id),
			['finance'],
		);
	});

	it('keeps empty category groups safe', () => {
		const feed = buildHomeFeed([post('one')], [{ key: 'empty', categories: ['Missing'] }]);

		assert.deepEqual(feed.categorySections[0].posts, []);
	});
});
