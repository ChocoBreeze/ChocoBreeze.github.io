import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { countCoOccurringTags } from '../../src/lib/relatedTags.mjs';

const POST_TAGS = [
	['Git', 'CLI', 'Developer Tools'],
	['Git', 'CLI'],
	['Git', 'Version Control'],
	['ETF'],
];

describe('countCoOccurringTags', () => {
	it('returns co-occurring tags ordered by shared posts', () => {
		assert.deepEqual(countCoOccurringTags(POST_TAGS, 'Git'), [
			{ tag: 'CLI', sharedPosts: 2 },
			{ tag: 'Developer Tools', sharedPosts: 1 },
			{ tag: 'Version Control', sharedPosts: 1 },
		]);
	});

	it('never includes the tag itself', () => {
		assert.ok(countCoOccurringTags(POST_TAGS, 'Git').every((entry) => entry.tag !== 'Git'));
	});

	it('returns nothing for a tag that is alone on its posts', () => {
		assert.deepEqual(countCoOccurringTags(POST_TAGS, 'ETF'), []);
	});

	it('returns nothing for an unknown or empty tag', () => {
		assert.deepEqual(countCoOccurringTags(POST_TAGS, 'Missing'), []);
		assert.deepEqual(countCoOccurringTags(POST_TAGS, ''), []);
		assert.deepEqual(countCoOccurringTags(POST_TAGS), []);
	});

	it('counts a duplicated tag on one post once', () => {
		assert.deepEqual(countCoOccurringTags([['Git', 'CLI', 'CLI']], 'Git'), [
			{ tag: 'CLI', sharedPosts: 1 },
		]);
	});

	it('trims surrounding whitespace before comparing', () => {
		assert.deepEqual(countCoOccurringTags([[' Git ', ' CLI ']], 'Git'), [
			{ tag: 'CLI', sharedPosts: 1 },
		]);
	});

	it('ignores empty tag entries and non-array rows', () => {
		assert.deepEqual(countCoOccurringTags([['Git', '', undefined], undefined], 'Git'), []);
	});

	it('honors the limit and treats a bad limit as none', () => {
		assert.equal(countCoOccurringTags(POST_TAGS, 'Git', 1).length, 1);
		assert.deepEqual(countCoOccurringTags(POST_TAGS, 'Git', 0), []);
		assert.deepEqual(countCoOccurringTags(POST_TAGS, 'Git', Number.NaN), []);
	});

	it('breaks ties by tag name', () => {
		const related = countCoOccurringTags(POST_TAGS, 'Git');
		const tied = related.filter((entry) => entry.sharedPosts === 1).map((entry) => entry.tag);

		assert.deepEqual(tied, ['Developer Tools', 'Version Control']);
	});
});
