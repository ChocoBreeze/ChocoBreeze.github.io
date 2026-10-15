import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	POST_REDIRECTS,
	findRedirectProblems,
	getRedirectSourcePaths,
	normalizeRedirectPath,
	toAstroRedirects,
} from '../../src/data/postRedirects.mjs';

function redirect(from, to) {
	return { from, to, since: '2026-10-16', reason: 'test' };
}

describe('normalizeRedirectPath', () => {
	it('adds the leading and trailing slash', () => {
		assert.equal(normalizeRedirectPath('blog/old-post'), '/blog/old-post/');
	});

	it('keeps an already normalized path unchanged', () => {
		assert.equal(normalizeRedirectPath('/blog/old-post/'), '/blog/old-post/');
	});

	it('returns an empty string for a missing value', () => {
		assert.equal(normalizeRedirectPath(undefined), '');
		assert.equal(normalizeRedirectPath('   '), '');
	});
});

describe('toAstroRedirects', () => {
	it('maps normalized sources to normalized targets', () => {
		assert.deepEqual(toAstroRedirects([redirect('blog/a/a', '/blog/a')]), {
			'/blog/a/a/': '/blog/a/',
		});
	});

	it('is empty when there are no redirects', () => {
		assert.deepEqual(toAstroRedirects([]), {});
	});
});

describe('getRedirectSourcePaths', () => {
	it('returns the normalized source paths', () => {
		assert.deepEqual(getRedirectSourcePaths([redirect('blog/a/a', '/blog/a')]), ['/blog/a/a/']);
	});
});

describe('findRedirectProblems', () => {
	it('accepts a well-formed set', () => {
		assert.deepEqual(
			findRedirectProblems([
				redirect('/blog/a/a/', '/blog/a/'),
				redirect('/blog/b/b/', '/blog/b/'),
			]),
			[],
		);
	});

	it('rejects a redirect that points at itself', () => {
		const problems = findRedirectProblems([redirect('/blog/a/', '/blog/a/')]);
		assert.ok(problems.some((problem) => problem.includes('points at itself')));
	});

	it('rejects a duplicated source', () => {
		const problems = findRedirectProblems([
			redirect('/blog/a/a/', '/blog/a/'),
			redirect('/blog/a/a/', '/blog/other/'),
		]);
		assert.ok(problems.some((problem) => problem.includes('Duplicate redirect source')));
	});

	it('rejects a chain where a target is another source', () => {
		const problems = findRedirectProblems([
			redirect('/blog/a/', '/blog/b/'),
			redirect('/blog/b/', '/blog/c/'),
		]);
		assert.ok(problems.some((problem) => problem.includes('itself a redirect source')));
	});

	it('rejects an entry missing a side', () => {
		const problems = findRedirectProblems([{ from: '/blog/a/', to: '' }]);
		assert.ok(problems.some((problem) => problem.includes('needs both')));
	});
});

describe('POST_REDIRECTS', () => {
	it('is internally consistent', () => {
		assert.deepEqual(findRedirectProblems(POST_REDIRECTS), []);
	});

	it('records every redirect with a date and a reason', () => {
		for (const entry of POST_REDIRECTS) {
			assert.match(entry.since, /^\d{4}-\d{2}-\d{2}$/);
			assert.ok(entry.reason.trim().length > 0);
			assert.ok(entry.from.startsWith('/blog/'));
			assert.ok(entry.to.startsWith('/blog/'));
		}
	});
});
