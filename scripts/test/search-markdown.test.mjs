import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { stripMarkdown } from '../../src/lib/searchMarkdown.mjs';

describe('stripMarkdown', () => {
	it('preserves prose between horizontal rules', () => {
		assert.equal(
			stripMarkdown('도입 문장\n\n---\n\nIDL 핵심검색어XYZ 정의\n\n---\n\n마무리 문장'),
			'도입 문장 IDL 핵심검색어XYZ 정의 마무리 문장',
		);
	});

	it('keeps table cell text while removing table syntax', () => {
		assert.equal(
			stripMarkdown('| 항목 | 설명 |\n| --- | --- |\n| 검색대상ABC | 본문 검색 |'),
			'항목 설명 검색대상ABC 본문 검색',
		);
	});

	it('omits fenced code and keeps inline code text', () => {
		assert.equal(
			stripMarkdown('문장 `inlineToken`\n\n```js\nsecretBlockToken()\n```\n\n끝'),
			'문장 inlineToken 끝',
		);
	});

	it('uses image alt text and link labels', () => {
		assert.equal(
			stripMarkdown('![도표 설명](chart.png) [링크 이름](https://example.com)'),
			'도표 설명 링크 이름',
		);
	});

	it('preserves punctuation that belongs to technical tokens', () => {
		assert.equal(
			stripMarkdown('`Problem_Solving` `foo_bar` `A|B` `~/.config`'),
			'Problem_Solving foo_bar A|B ~/.config',
		);
	});

	it('keeps visible HTML text and drops script and style contents', () => {
		assert.equal(
			stripMarkdown('<p>보이는 문장</p><script>hiddenToken()</script><style>.secret {}</style>'),
			'보이는 문장',
		);
	});
});
