import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildFeedbackIssueUrl, buildHeadingUrl } from '../../src/lib/postActions.mjs';

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
