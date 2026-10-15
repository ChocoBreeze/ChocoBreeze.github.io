import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';
import path from 'node:path';

import {
	buildSeriesList,
	buildSeriesNavigation,
	findSeries,
	getSeriesPosts,
	sortSeriesPosts,
} from '../../src/lib/series.mjs';
import { createContentFixture } from './helpers/content-fixture.mjs';

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
		const fixture = createContentFixture();
		const relativeFile = `__review-series-scaffold-${process.pid}.md`;
		const expectedPath = path.join(fixture.contentDir, relativeFile);

		try {
			assert.equal(existsSync(expectedPath), false);
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
					'--related-slugs',
					'related-one, related-two',
					'--prerequisite-slugs',
					'prerequisite-one, prerequisite-two',
					'--file',
					relativeFile,
				],
				{ cwd: process.cwd(), env: fixture.env, encoding: 'utf8' },
			);

			assert.equal(result.status, 0, result.stderr);
			const content = readFileSync(expectedPath, 'utf8');
			assert.equal((content.match(/^series:/gm) ?? []).length, 1);
			assert.equal((content.match(/^seriesSlug:/gm) ?? []).length, 1);
			assert.equal((content.match(/^seriesOrder:/gm) ?? []).length, 1);
			assert.equal((content.match(/^relatedSlugs:/gm) ?? []).length, 1);
			assert.equal((content.match(/^prerequisiteSlugs:/gm) ?? []).length, 1);
			assert.match(content, /^series: "Fixture series"$/m);
			assert.match(content, /^seriesSlug: "fixture-series"$/m);
			assert.match(content, /^seriesOrder: 2$/m);
			assert.match(content, /^relatedSlugs: \["related-one", "related-two"\]$/m);
			assert.match(content, /^prerequisiteSlugs: \["prerequisite-one", "prerequisite-two"\]$/m);
		} finally {
			fixture.cleanup();
		}
	});
});

describe('buildSeriesList', () => {
	it('groups posts by series slug and keeps reading order', () => {
		const list = buildSeriesList([
			post('second', 2),
			post('first', 1),
			post('other', 1, { series: 'ETF 기초', seriesSlug: 'etf-basics' }),
		]);

		assert.deepEqual(
			list.map((series) => series.slug),
			['etf-basics', 'git-commands'],
		);
		const gitSeries = list.find((series) => series.slug === 'git-commands');
		assert.deepEqual(
			gitSeries.posts.map((entry) => entry.id),
			['first', 'second'],
		);
		assert.equal(gitSeries.count, 2);
		assert.equal(gitSeries.name, 'Git 명령어');
	});

	it('sorts series by their most recent post', () => {
		const list = buildSeriesList([
			post('old', 1, { pubDate: '2026-01-01T00:00:00+09:00' }),
			post('new', 1, {
				series: 'ETF 기초',
				seriesSlug: 'etf-basics',
				pubDate: '2026-05-01T00:00:00+09:00',
			}),
		]);

		assert.deepEqual(
			list.map((series) => series.slug),
			['etf-basics', 'git-commands'],
		);
	});

	it('excludes drafts and posts with no series slug', () => {
		const list = buildSeriesList([
			post('live', 1),
			post('draft', 2, { draft: true }),
			{ id: 'loose', data: { title: 'Loose', pubDate: new Date('2026-01-01') } },
		]);

		assert.equal(list.length, 1);
		assert.deepEqual(
			list[0].posts.map((entry) => entry.id),
			['live'],
		);
	});

	it('falls back to the slug when no post carries a display name', () => {
		const list = buildSeriesList([
			{
				id: 'only',
				data: {
					title: 'Only',
					seriesSlug: 'git-commands',
					seriesOrder: 1,
					pubDate: new Date('2026-01-01T00:00:00+09:00'),
				},
			},
		]);

		assert.equal(list[0].name, 'git-commands');
	});

	it('collects the first and last publication dates and the categories', () => {
		const list = buildSeriesList([
			post('first', 1, { pubDate: '2026-01-01T00:00:00+09:00' }),
			post('second', 2, {
				pubDate: '2026-03-01T00:00:00+09:00',
				categories: ['Computer Science'],
			}),
		]);

		assert.equal(list[0].firstDate.toISOString().slice(0, 10), '2025-12-31');
		assert.equal(list[0].latestDate.toISOString().slice(0, 10), '2026-02-28');
		assert.deepEqual(list[0].categories, ['Programming', 'Computer Science']);
	});

	it('returns an empty list for no posts', () => {
		assert.deepEqual(buildSeriesList(), []);
	});
});

describe('findSeries', () => {
	it('finds a series by slug and returns undefined otherwise', () => {
		const posts = [post('first', 1)];

		assert.equal(findSeries(posts, 'git-commands').count, 1);
		assert.equal(findSeries(posts, 'missing'), undefined);
	});
});
