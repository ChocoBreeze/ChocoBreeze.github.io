import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';
import path from 'node:path';

import { buildSeriesNavigation, getSeriesPosts, sortSeriesPosts } from '../../src/lib/series.mjs';

function post(id, seriesOrder, options = {}) {
	return {
		id,
		data: {
			title: options.title ?? id,
			categories: options.categories ?? 'Programming',
			series: options.series ?? 'Git 명령어',
			seriesSlug: options.seriesSlug ?? 'git-commands',
			seriesOrder,
			pubDate: new Date(options.pubDate ?? '2026-01-01T00:00:00+09:00'),
			draft: options.draft ?? false,
		},
	};
}

describe('series ordering', () => {
	it('sorts by series order and uses date/key as deterministic fallbacks', () => {
		const posts = [
			post('b', undefined, { pubDate: '2026-01-02T00:00:00+09:00' }),
			post('a', undefined, { pubDate: '2026-01-01T00:00:00+09:00' }),
			post('first', 1),
			post('duplicate-later', 2, { pubDate: '2026-01-02T00:00:00+09:00' }),
			post('duplicate-earlier', 2, { pubDate: '2026-01-01T00:00:00+09:00' }),
		];

		assert.deepEqual(
			sortSeriesPosts(posts).map((item) => item.id),
			['first', 'duplicate-earlier', 'duplicate-later', 'a', 'b'],
		);
	});

	it('excludes drafts and posts from another series', () => {
		const current = post('current', 1);
		const posts = [
			current,
			post('draft', 2, { draft: true }),
			post('other', 3, { seriesSlug: 'other-series' }),
		];

		assert.deepEqual(
			getSeriesPosts(posts, current).map((item) => item.id),
			['current'],
		);
	});
});

describe('buildSeriesNavigation', () => {
	const posts = [post('one', 1), post('two', 2), post('three', 3)];

	it('returns previous and next links for a middle post', () => {
		const navigation = buildSeriesNavigation(posts, posts[1]);

		assert.equal(navigation?.current, 2);
		assert.equal(navigation?.total, 3);
		assert.equal(navigation?.previous?.id, 'one');
		assert.equal(navigation?.next?.id, 'three');
	});

	it('omits the unavailable edge links', () => {
		const first = buildSeriesNavigation(posts, posts[0]);
		const last = buildSeriesNavigation(posts, posts[2]);

		assert.equal(first?.previous, undefined);
		assert.equal(first?.next?.id, 'two');
		assert.equal(last?.previous?.id, 'two');
		assert.equal(last?.next, undefined);
	});

	it('returns no navigation when series metadata is absent', () => {
		const standalone = post('standalone', undefined, { seriesSlug: '' });

		assert.equal(buildSeriesNavigation([standalone], standalone), undefined);
	});

	it('includes series posts from other categories', () => {
		const current = post('current', 1, { categories: 'Programming' });
		const otherCategory = post('other-category', 2, { categories: 'Semiconductor' });
		const navigation = buildSeriesNavigation([current, otherCategory], current);

		assert.equal(navigation?.total, 2);
		assert.equal(navigation?.next?.id, 'other-category');
	});
});

describe('new-post series options', () => {
	it('writes the series fields once when scaffolding a post', () => {
		const relativeFile = `__review-series-scaffold-${process.pid}.md`;
		const expectedPath = path.join(process.cwd(), 'src', 'content', 'blog', relativeFile);
		assert.equal(existsSync(expectedPath), false);

		try {
			const result = spawnSync(
				process.execPath,
				[
					'scripts/new-post.mjs',
					'--title',
					'Series scaffold fixture',
					'--category',
					'Programming',
					'--date',
					'2026-08-18',
					'--series',
					'Fixture series',
					'--series-slug',
					'fixture-series',
					'--series-order',
					'2',
					'--file',
					relativeFile,
				],
				{ cwd: process.cwd(), encoding: 'utf8' },
			);

			assert.equal(result.status, 0, result.stderr);
			const content = readFileSync(expectedPath, 'utf8');
			assert.equal((content.match(/^series:/gm) ?? []).length, 1);
			assert.equal((content.match(/^seriesSlug:/gm) ?? []).length, 1);
			assert.equal((content.match(/^seriesOrder:/gm) ?? []).length, 1);
			assert.match(content, /^series: "Fixture series"$/m);
			assert.match(content, /^seriesSlug: "fixture-series"$/m);
			assert.match(content, /^seriesOrder: 2$/m);
		} finally {
			rmSync(expectedPath, { force: true });
		}
	});
});
