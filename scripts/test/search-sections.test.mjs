import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	buildSearchSections,
	findAnchorForOffset,
	splitMarkdownSections,
} from '../../src/lib/searchSections.mjs';
import { getMatchAnchor, searchIndexedItems } from '../../src/lib/searchRanking.mjs';

const BODY = [
	'서문 문단입니다.',
	'',
	'## 첫 번째 절',
	'',
	'첫 절 본문 alpha 입니다.',
	'',
	'## 두 번째 절',
	'',
	'두 절 본문 bravo 입니다.',
	'',
].join('\n');

describe('splitMarkdownSections', () => {
	it('splits at ATX headings and pairs them with the rendered slugs in order', () => {
		const sections = splitMarkdownSections(BODY, ['first', 'second']);

		assert.deepEqual(
			sections.map((section) => section.anchor),
			[undefined, 'first', 'second'],
		);
		assert.ok(sections[1].markdown.includes('alpha'));
	});

	it('ignores heading-looking lines inside fenced code blocks', () => {
		const body = ['```md', '# not a heading', '```', '', '## real', '', 'body'].join('\n');
		const sections = splitMarkdownSections(body, ['real']);

		assert.deepEqual(
			sections.map((section) => section.anchor),
			[undefined, 'real'],
		);
	});

	it('handles tilde fences and nested backtick counts', () => {
		const body = ['~~~', '## inside tildes', '~~~', '', '## outside', 'text'].join('\n');
		const sections = splitMarkdownSections(body, ['outside']);

		assert.equal(sections.filter((section) => section.anchor).length, 1);
	});

	it('drops every anchor when the heading count disagrees with the rendered slugs', () => {
		// A setext heading is a heading to Astro but not to this splitter, so the
		// counts diverge and guessing would point at the wrong section.
		const sections = splitMarkdownSections(BODY, ['first', 'second', 'extra']);

		assert.deepEqual(
			sections.map((section) => section.anchor),
			[undefined, undefined, undefined],
		);
	});

	it('drops empty sections', () => {
		const sections = splitMarkdownSections('\n\n   \n', []);

		assert.deepEqual(sections, []);
	});
});

describe('buildSearchSections', () => {
	it('returns the full plain text with the offset of each heading section', () => {
		const { text, anchors } = buildSearchSections(BODY, ['first', 'second']);

		assert.ok(text.includes('서문 문단입니다.'));
		assert.ok(text.includes('alpha'));
		assert.ok(text.includes('bravo'));
		assert.equal(anchors.length, 2);
		assert.equal(anchors[0][1], 'first');
		assert.equal(anchors[1][1], 'second');
		assert.ok(anchors[0][0] < anchors[1][0]);
		assert.ok(text.slice(anchors[1][0]).startsWith('두 번째 절'));
	});

	it('does not truncate a long body', () => {
		const long = `서문\n\n## 절\n\n${'가'.repeat(12000)}`;
		const { text } = buildSearchSections(long, ['section']);

		assert.ok(text.length > 11000);
	});

	it('returns no anchors for a body without headings', () => {
		const { text, anchors } = buildSearchSections('본문만 있습니다.', []);

		assert.equal(anchors.length, 0);
		assert.equal(text, '본문만 있습니다.');
	});
});

describe('findAnchorForOffset', () => {
	const anchors = [
		[10, 'one'],
		[50, 'two'],
	];

	it('returns the section the offset falls in', () => {
		assert.equal(findAnchorForOffset(anchors, 10), 'one');
		assert.equal(findAnchorForOffset(anchors, 49), 'one');
		assert.equal(findAnchorForOffset(anchors, 50), 'two');
		assert.equal(findAnchorForOffset(anchors, 999), 'two');
	});

	it('returns undefined before the first heading and for bad input', () => {
		assert.equal(findAnchorForOffset(anchors, 0), undefined);
		assert.equal(findAnchorForOffset(anchors, -1), undefined);
		assert.equal(findAnchorForOffset(undefined, 10), undefined);
		assert.equal(findAnchorForOffset(anchors, Number.NaN), undefined);
	});
});

describe('getMatchAnchor', () => {
	function item(overrides = {}) {
		const { text, anchors } = buildSearchSections(BODY, ['first', 'second']);
		return {
			t: '제목',
			d: '설명',
			e: text.slice(0, 20),
			x: text.slice(20),
			v: anchors,
			s: 'post',
			...overrides,
		};
	}

	it('returns the anchor of the section holding the body match', () => {
		assert.equal(getMatchAnchor(item(), 'bravo'), 'second');
		assert.equal(getMatchAnchor(item(), 'alpha'), 'first');
	});

	it('returns undefined when the match is before the first heading', () => {
		assert.equal(getMatchAnchor(item(), '서문'), undefined);
	});

	it('returns undefined without an anchor table or a query', () => {
		assert.equal(getMatchAnchor(item({ v: undefined }), 'bravo'), undefined);
		assert.equal(getMatchAnchor(item({ v: [] }), 'bravo'), undefined);
		assert.equal(getMatchAnchor(item(), ''), undefined);
	});

	it('returns undefined when the query matches no body text', () => {
		assert.equal(getMatchAnchor(item(), 'charlie'), undefined);
	});

	it('is resolved per rendered result rather than for the whole result set', () => {
		const results = searchIndexedItems([item()], 'bravo');

		assert.equal(results.length, 1);
		// Scanning a full body per match is costly, so the result set carries no
		// anchor; the caller resolves it for the results it renders.
		assert.equal(results[0].anchor, undefined);
		assert.equal(getMatchAnchor(results[0].item, 'bravo'), 'second');
	});
});
