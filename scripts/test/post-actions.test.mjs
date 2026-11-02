import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	buildCitationText,
	buildFeedbackIssueUrl,
	buildHeadingUrl,
	buildHistoryUrl,
} from '../../src/lib/postActions.mjs';

describe('buildCitationText', () => {
	it('builds a Markdown citation with the display date and canonical URL', () => {
		assert.equal(
			buildCitationText({
				title: 'ETF 비교: 나스닥 100',
				siteTitle: 'ChocoBreeze',
				date: '2026-01-16T00:00:00+09:00',
				pageUrl: 'https://chocobreeze.github.io/blog/qqq/',
			}),
			'> ETF 비교: 나스닥 100\n> ChocoBreeze · 2026년 1월 16일\n> https://chocobreeze.github.io/blog/qqq/',
		);
	});

	it('keeps a citation usable when the publication date is unavailable', () => {
		assert.equal(
			buildCitationText({
				title: '레거시 글',
				siteTitle: 'ChocoBreeze',
				date: 'not-a-date',
				pageUrl: 'https://chocobreeze.github.io/blog/legacy/',
			}),
			'> 레거시 글\n> ChocoBreeze\n> https://chocobreeze.github.io/blog/legacy/',
		);
	});
});

describe('buildFeedbackIssueUrl', () => {
	it('encodes the post title and canonical URL in the issue form', () => {
		const issueUrl = new URL(
			buildFeedbackIssueUrl('ETF 비교: 나스닥 100', 'https://chocobreeze.github.io/blog/qqq/'),
		);

		assert.equal(issueUrl.hostname, 'github.com');
		assert.equal(issueUrl.searchParams.get('title'), 'Blog feedback: ETF 비교: 나스닥 100');
		assert.equal(
			issueUrl.searchParams.get('body'),
			'Page URL: https://chocobreeze.github.io/blog/qqq/\n\nFeedback: ',
		);
	});
});

describe('buildHistoryUrl', () => {
	const COMMITS = 'https://github.com/ChocoBreeze/ChocoBreeze.github.io/commits/main/';

	it('encodes spaces, ampersands and parentheses in each path segment', () => {
		assert.equal(
			buildHistoryUrl(
				'src/content/blog/ETF/Defense Industry/ITA/ITA (iShares U.S. Aerospace & Defense ETF).md',
			),
			`${COMMITS}src/content/blog/ETF/Defense%20Industry/ITA/ITA%20(iShares%20U.S.%20Aerospace%20%26%20Defense%20ETF).md`,
		);
	});

	it('encodes Hangul and hash marks so the path survives as one URL path', () => {
		const url = new URL(buildHistoryUrl('src/content/blog/Reports/25년 12월/C# 정리.md'));

		assert.equal(url.hash, '');
		assert.equal(
			decodeURIComponent(url.pathname),
			'/ChocoBreeze/ChocoBreeze.github.io/commits/main/src/content/blog/Reports/25년 12월/C# 정리.md',
		);
	});

	it('normalizes Windows separators and a leading ./', () => {
		assert.equal(
			buildHistoryUrl('.\\src\\content\\blog\\Programming\\git-add.md'),
			`${COMMITS}src/content/blog/Programming/git-add.md`,
		);
	});

	it('returns undefined without a file path', () => {
		assert.equal(buildHistoryUrl(undefined), undefined);
		assert.equal(buildHistoryUrl(''), undefined);
	});
});

describe('buildHeadingUrl', () => {
	it('adds an encoded heading fragment to the page URL', () => {
		assert.equal(
			buildHeadingUrl('https://chocobreeze.github.io/blog/qqq/?view=full', '비용 구조'),
			'https://chocobreeze.github.io/blog/qqq/?view=full#%EB%B9%84%EC%9A%A9%20%EA%B5%AC%EC%A1%B0',
		);
	});

	it('returns the original page URL when the heading is empty', () => {
		assert.equal(
			buildHeadingUrl('https://chocobreeze.github.io/blog/qqq/', ''),
			'https://chocobreeze.github.io/blog/qqq/',
		);
	});
});
