import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getSearchTextCandidates, getSearchTextSegment } from '../../src/lib/searchText.mjs';

describe('getSearchTextSegment', () => {
	it('returns no search segment when the excerpt contains the whole body', () => {
		assert.equal(getSearchTextSegment('short body'), '');
	});

	it('keeps the search segment separate after the excerpt boundary', () => {
		const plainText = 'A'.repeat(6000);
		const searchText = getSearchTextSegment(plainText);

		assert.equal(searchText, plainText.slice(480, 5000));
	});

	it('supports custom boundaries and trims the returned segment', () => {
		assert.equal(
			getSearchTextSegment('  0123456789  ', {
				excerptLength: 3,
				maxLength: 9,
			}),
			'123456',
		);
	});

	it('reconnects long queries that cross the excerpt boundary', () => {
		const excerpt = `${'A'.repeat(480)}...`;
		const searchText = 'B'.repeat(100);
		const query = `${'A'.repeat(20)}${'B'.repeat(100)}`;

		assert.equal(
			getSearchTextCandidates(excerpt, searchText).some((source) => source.includes(query)),
			true,
		);
	});

	it('preserves whitespace at the excerpt boundary', () => {
		const excerpt = `${'A'.repeat(479)}...`;
		const searchText = getSearchTextSegment(`${'A'.repeat(479)} ${'B'.repeat(100)}`);
		const candidates = getSearchTextCandidates(excerpt, searchText);

		assert.equal(candidates.length, 1);
		assert.equal(candidates[0].includes(`${'A'.repeat(479)}B`), false);
		assert.equal(candidates[0].includes(`${'A'.repeat(479)} B`), true);
	});

	it('does not create a duplicate segment for short bodies', () => {
		assert.deepEqual(getSearchTextCandidates('A'.repeat(480), ''), ['A'.repeat(480)]);
		assert.equal(getSearchTextSegment('A'.repeat(480)), '');
	});

	it('preserves literal ellipses in short excerpts', () => {
		assert.deepEqual(getSearchTextCandidates('A short post...', ''), ['A short post...']);
	});
});
