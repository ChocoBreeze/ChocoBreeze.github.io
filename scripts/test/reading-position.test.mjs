import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	MAX_ENTRIES,
	getResumeOffer,
	parseStore,
	recordPosition,
} from '../../src/lib/readingPosition.mjs';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-10-27T00:00:00+09:00');

describe('recordPosition', () => {
	it('keeps an earlier record when the reader is still near the top', () => {
		const store = { '/blog/a/': { progress: 0.4, savedAt: NOW - DAY } };

		assert.equal(recordPosition(store, '/blog/a/', { progress: 0.05 }, NOW), store);
	});

	it('saves progress with the current heading', () => {
		assert.deepEqual(
			recordPosition({}, '/blog/a/', { progress: 0.42, heading: '비용 구조' }, NOW),
			{
				'/blog/a/': { progress: 0.42, heading: '비용 구조', savedAt: NOW },
			},
		);
	});

	it('forgets a post once it is read to the end', () => {
		const store = { '/blog/a/': { progress: 0.4, savedAt: NOW - DAY } };

		assert.deepEqual(recordPosition(store, '/blog/a/', { progress: 0.96 }, NOW), {});
	});

	it('keeps only the newest records', () => {
		let store = {};
		for (let index = 0; index < MAX_ENTRIES + 2; index += 1) {
			store = recordPosition(store, `/blog/${index}/`, { progress: 0.5 }, NOW + index);
		}

		assert.equal(Object.keys(store).length, MAX_ENTRIES);
		assert.equal(store['/blog/0/'], undefined);
		assert.equal(store['/blog/1/'], undefined);
		assert.ok(store[`/blog/${MAX_ENTRIES + 1}/`]);
	});
});

describe('parseStore', () => {
	it('treats broken or unexpected values as an empty store', () => {
		assert.deepEqual(parseStore('{not json', NOW), {});
		assert.deepEqual(parseStore('[1, 2]', NOW), {});
		assert.deepEqual(parseStore(null, NOW), {});
	});

	it('drops malformed and expired entries', () => {
		const raw = JSON.stringify({
			'/blog/fresh/': { progress: 0.5, savedAt: NOW - DAY },
			'/blog/old/': { progress: 0.5, savedAt: NOW - 91 * DAY },
			'/blog/bad/': { progress: 'half', savedAt: NOW },
			'/blog/heading/': { progress: 0.5, heading: 3, savedAt: NOW },
		});

		assert.deepEqual(Object.keys(parseStore(raw, NOW)), ['/blog/fresh/']);
	});
});

describe('getResumeOffer', () => {
	it('offers a recent mid-post position', () => {
		const entry = { progress: 0.5, heading: '정리', savedAt: NOW - DAY };

		assert.equal(getResumeOffer({ '/blog/a/': entry }, '/blog/a/', NOW), entry);
	});

	it('offers nothing without a record, after expiry, or outside the useful range', () => {
		assert.equal(getResumeOffer({}, '/blog/a/', NOW), undefined);
		assert.equal(
			getResumeOffer({ '/blog/a/': { progress: 0.5, savedAt: NOW - 91 * DAY } }, '/blog/a/', NOW),
			undefined,
		);
		assert.equal(
			getResumeOffer({ '/blog/a/': { progress: 0.97, savedAt: NOW } }, '/blog/a/', NOW),
			undefined,
		);
		assert.equal(
			getResumeOffer({ '/blog/a/': { progress: 0.02, savedAt: NOW } }, '/blog/a/', NOW),
			undefined,
		);
	});
});
