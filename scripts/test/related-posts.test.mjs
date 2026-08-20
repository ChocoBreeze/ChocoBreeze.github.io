import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getRelatedPosts } from '../../src/lib/relatedPosts.mjs';

function post(id, options = {}) {
	return {
		id,
		data: {
			title: options.title ?? id,
			slug: options.slug,
			categories: options.categories ?? 'Programming',
			tags: options.tags,
			topics: options.topics,
			relatedSlugs: options.relatedSlugs,
			series: options.series,
			seriesSlug: options.seriesSlug,
			seriesOrder: options.seriesOrder,
			pubDate: new Date(options.pubDate ?? '2026-01-01T00:00:00+09:00'),
			draft: options.draft ?? false,
		},
		filePath: options.filePath,
	};
}

describe('getRelatedPosts', () => {
	it('prioritizes nearby posts in the same series', () => {
		const previous = post('previous', { series: 'Series', seriesSlug: 'series', seriesOrder: 1 });
		const current = post('current', { series: 'Series', seriesSlug: 'series', seriesOrder: 2 });
		const next = post('next', { series: 'Series', seriesSlug: 'series', seriesOrder: 3 });
		const later = post('later', { series: 'Series', seriesSlug: 'series', seriesOrder: 4 });

		assert.deepEqual(
			getRelatedPosts({
				posts: [previous, current, next, later],
				currentPost: current,
				categoryPosts: [previous, current, next, later],
				excludedIds: [previous.id, next.id],
			}).map((item) => item.id),
			['later'],
		);
	});

	it('keeps manual related slugs in author-specified order', () => {
		const manualTwo = post('manual-two', { categories: 'Reports' });
		const manualOne = post('manual-one', { categories: 'ETF' });
		const current = post('current', { relatedSlugs: ['manual-two', 'missing', 'manual-one'] });

		assert.deepEqual(
			getRelatedPosts({
				posts: [current, manualOne, manualTwo],
				currentPost: current,
				categoryPosts: [current],
			}).map((item) => item.id),
			['manual-two', 'manual-one'],
		);
	});

	it('resolves legacy posts by their source file path', () => {
		const legacy = post('programming/legacy-post', {
			filePath: 'src/content/blog/Programming/Legacy Post.md',
		});
		const current = post('current', { relatedSlugs: ['Programming/Legacy Post.md'] });

		assert.deepEqual(
			getRelatedPosts({
				posts: [current, legacy],
				currentPost: current,
				categoryPosts: [current],
			}).map((item) => item.id),
			['programming/legacy-post'],
		);
	});

	it('ranks tag and topic overlap before category fallback', () => {
		const current = post('current', { tags: ['AI', 'GPU'], topics: ['Memory'] });
		const tagAndTopic = post('tag-and-topic', { tags: ['AI'], topics: ['Memory'] });
		const tagOnly = post('tag-only', { tags: ['AI'] });
		const topicOnly = post('topic-only', { topics: ['Memory'] });

		assert.deepEqual(
			getRelatedPosts({
				posts: [current, topicOnly, tagOnly, tagAndTopic],
				currentPost: current,
				categoryPosts: [current, topicOnly, tagOnly, tagAndTopic],
			}).map((item) => item.id),
			['tag-and-topic', 'tag-only', 'topic-only'],
		);
	});

	it('fills remaining slots with nearby category posts', () => {
		const first = post('first');
		const current = post('current');
		const second = post('second');
		const third = post('third');

		assert.deepEqual(
			getRelatedPosts({
				posts: [first, current, second, third],
				currentPost: current,
				categoryPosts: [first, current, second, third],
			}).map((item) => item.id),
			['first', 'second', 'third'],
		);
	});

	it('never returns drafts or explicitly excluded posts', () => {
		const current = post('current');
		const excluded = post('excluded');
		const draft = post('draft', { draft: true });
		const available = post('available');

		assert.deepEqual(
			getRelatedPosts({
				posts: [current, excluded, draft, available],
				currentPost: current,
				categoryPosts: [current, excluded, draft, available],
				excludedIds: [excluded.id],
			}).map((item) => item.id),
			['available'],
		);
	});
});
