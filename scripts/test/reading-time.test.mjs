import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { estimateReadingTime } from '../../src/lib/readingTime.mjs';

describe('estimateReadingTime', () => {
	it('returns the minimum one minute for an empty post', () => {
		assert.deepEqual(estimateReadingTime(''), {
			minutes: 1,
			koreanCharacters: 0,
			words: 0,
			codeLines: 0,
		});
	});

	it('counts Korean characters at 500 characters per minute', () => {
		assert.equal(estimateReadingTime('가'.repeat(500)).minutes, 1);
		assert.equal(estimateReadingTime('가'.repeat(501)).minutes, 2);
	});

	it('counts Latin and numeric words at 200 words per minute', () => {
		const post = Array.from({ length: 200 }, (_, index) => `word${index}`).join(' ');

		assert.equal(estimateReadingTime(post).minutes, 1);
	});

	it('counts fenced code separately without double-counting its words', () => {
		const code = ['```js', ...Array.from({ length: 12 }, () => 'const value = 1;'), '```'].join(
			'\n',
		);

		assert.deepEqual(estimateReadingTime(code), {
			minutes: 1,
			koreanCharacters: 0,
			words: 0,
			codeLines: 12,
		});
	});

	it('ignores frontmatter when estimating prose', () => {
		const post = ['---', 'title: Hidden words', '---', '본문'].join('\n');

		assert.deepEqual(estimateReadingTime(post), {
			minutes: 1,
			koreanCharacters: 2,
			words: 0,
			codeLines: 0,
		});
	});
});
