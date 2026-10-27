import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
	checkBuildArtifacts,
	findExternalAssetReferencesInHtml,
	findLiteralBoldMarkersInHtml,
	measureBuildGroups,
} from '../check-build-artifacts.mjs';
import { checkBuildBudgets } from '../lib/build-budgets.mjs';

function writeFile(root, relativePath, content) {
	const filePath = path.join(root, relativePath);
	mkdirSync(path.dirname(filePath), { recursive: true });
	writeFileSync(filePath, content);
}

function createFixture() {
	const rootDir = mkdtempSync(path.join(os.tmpdir(), 'chocobreeze-build-artifacts-'));
	const contentDir = path.join(rootDir, 'content');
	const distDir = path.join(rootDir, 'dist');
	mkdirSync(contentDir, { recursive: true });
	mkdirSync(distDir, { recursive: true });

	writeFile(
		contentDir,
		'live.md',
		'---\ntitle: Live post\nslug: live-post\n---\nLive post body.\n',
	);
	writeFile(contentDir, 'Archive/derived.md', '---\ntitle: Derived post\n---\nDerived body.\n');
	writeFile(
		contentDir,
		'draft.md',
		'---\ntitle: Draft post\nslug: draft-post\ndraft: true\n---\nDraft body.\n',
	);

	const html = (title, body = '') =>
		`<!doctype html><html><head><title>${title}</title></head><body>${body}</body></html>`;
	writeFile(
		distDir,
		'index.html',
		html(
			'ChocoBreeze',
			'<a href="/blog/live-post/">Live</a><a href="/blog/archive/derived/">Derived</a>',
		),
	);
	writeFile(distDir, 'blog/live-post/index.html', html('Live post | ChocoBreeze'));
	writeFile(distDir, 'blog/archive/derived/index.html', html('Derived post | ChocoBreeze'));
	writeFile(distDir, 'search.json', JSON.stringify([{ s: 'live-post' }, { s: 'archive/derived' }]));
	writeFile(distDir, 'search/quick.json', JSON.stringify([{ s: 'live-post' }]));
	writeFile(
		distDir,
		'rss.xml',
		'<rss><channel><item><link>https://chocobreeze.github.io/blog/live-post/</link></item></channel></rss>',
	);
	writeFile(
		distDir,
		'sitemap-0.xml',
		'<urlset><url><loc>https://chocobreeze.github.io/blog/live-post/</loc></url><url><loc>https://chocobreeze.github.io/blog/archive/derived/</loc></url></urlset>',
	);

	return {
		contentDir,
		distDir,
		cleanup() {
			rmSync(rootDir, { recursive: true, force: true });
		},
	};
}

function check(fixture, redirects = []) {
	return checkBuildArtifacts({
		contentDir: fixture.contentDir,
		distDir: fixture.distDir,
		siteTitle: 'ChocoBreeze',
		redirects,
	});
}

// Mirrors the page Astro generates for a configured redirect in a static build.
function redirectPage(to) {
	return [
		'<!doctype html>',
		`<title>Redirecting to: ${to}</title>`,
		`<meta http-equiv="refresh" content="0;url=${to}">`,
		'<meta name="robots" content="noindex">',
		`<link rel="canonical" href="https://chocobreeze.github.io${to}">`,
		`<body><a href="${to}">Redirecting</a></body>`,
	].join('');
}

describe('checkBuildArtifacts', () => {
	it('accepts published routes, live indexes, feeds, sitemap links, and one title suffix', (t) => {
		const fixture = createFixture();
		t.after(fixture.cleanup);

		const result = check(fixture);

		assert.deepEqual(result.issues, []);
		assert.equal(result.publishedPostCount, 2);
		assert.equal(result.draftPostCount, 1);
		assert.equal(result.htmlPageCount, 3);
	});

	it('reports a published source post with no generated page', (t) => {
		const fixture = createFixture();
		t.after(fixture.cleanup);
		rmSync(path.join(fixture.distDir, 'blog/live-post'), { recursive: true, force: true });

		const result = check(fixture);

		assert.ok(result.issues.some((issue) => issue.includes('Published post route is missing')));
	});

	it('detects draft pages and draft entries leaked into search and feeds', (t) => {
		const fixture = createFixture();
		t.after(fixture.cleanup);
		writeFile(
			fixture.distDir,
			'blog/draft-post/index.html',
			'<!doctype html><html><head><title>Draft post | ChocoBreeze</title></head></html>',
		);
		writeFile(
			fixture.distDir,
			'search.json',
			JSON.stringify([{ s: 'live-post' }, { s: 'archive/derived' }, { s: 'draft-post' }]),
		);
		writeFile(
			fixture.distDir,
			'rss.xml',
			'<rss><item><link>https://chocobreeze.github.io/blog/draft-post/</link></item></rss>',
		);

		const result = check(fixture);

		assert.ok(result.issues.some((issue) => issue.includes('Draft post route leaked')));
		assert.ok(result.issues.some((issue) => issue.includes('Draft post is referenced')));
	});

	it('reports links to blog routes that are not published', (t) => {
		const fixture = createFixture();
		t.after(fixture.cleanup);
		writeFile(
			fixture.distDir,
			'index.html',
			'<!doctype html><html><head><title>ChocoBreeze</title></head><body><a href="/blog/missing/">Missing</a></body></html>',
		);

		const result = check(fixture);

		assert.ok(result.issues.some((issue) => issue.includes('missing or unpublished post')));
	});

	it('reports duplicate title elements and repeated site-name suffixes', (t) => {
		const fixture = createFixture();
		t.after(fixture.cleanup);
		writeFile(
			fixture.distDir,
			'blog/live-post/index.html',
			'<!doctype html><html><head><title>Live | ChocoBreeze | ChocoBreeze</title><title>Again</title></head></html>',
		);

		const result = check(fixture);

		assert.ok(result.issues.some((issue) => issue.includes('Expected exactly one <title>')));
		assert.ok(result.issues.some((issue) => issue.includes('duplicated site-name suffix')));
	});

	it('requires non-home pages to include their page title before the site name', (t) => {
		const fixture = createFixture();
		t.after(fixture.cleanup);
		writeFile(
			fixture.distDir,
			'blog/live-post/index.html',
			'<!doctype html><html><head><title>ChocoBreeze</title></head></html>',
		);

		const result = check(fixture);

		assert.ok(
			result.issues.some((issue) => issue.includes('missing or duplicated site-name suffix')),
		);
	});
});

describe('checkBuildArtifacts redirects', () => {
	const redirect = {
		from: '/blog/archive/derived/derived/',
		to: '/blog/archive/derived/',
		since: '2026-10-16',
		reason: 'test',
	};

	it('accepts a generated redirect page without applying the site-title rule', (t) => {
		const fixture = createFixture();
		t.after(fixture.cleanup);
		writeFile(
			fixture.distDir,
			'blog/archive/derived/derived/index.html',
			redirectPage(redirect.to),
		);

		const result = check(fixture, [redirect]);

		assert.deepEqual(result.issues, []);
	});

	it('reports a redirect whose page was not generated', (t) => {
		const fixture = createFixture();
		t.after(fixture.cleanup);

		const result = check(fixture, [redirect]);

		assert.ok(result.issues.some((issue) => issue.includes('Redirect source is missing')));
	});

	it('reports a redirect page that points somewhere else', (t) => {
		const fixture = createFixture();
		t.after(fixture.cleanup);
		writeFile(
			fixture.distDir,
			'blog/archive/derived/derived/index.html',
			redirectPage('/blog/live-post/'),
		);

		const result = check(fixture, [redirect]);

		assert.ok(result.issues.some((issue) => issue.includes('does not point at')));
	});

	it('reports a redirect page missing robots noindex or a canonical link', (t) => {
		const fixture = createFixture();
		t.after(fixture.cleanup);
		writeFile(
			fixture.distDir,
			'blog/archive/derived/derived/index.html',
			'<!doctype html><title>Redirecting to: /blog/archive/derived/</title><meta http-equiv="refresh" content="0;url=/blog/archive/derived/">',
		);

		const result = check(fixture, [redirect]);

		assert.ok(result.issues.some((issue) => issue.includes('missing robots noindex')));
		assert.ok(result.issues.some((issue) => issue.includes('missing a canonical link')));
	});

	it('reports a redirect whose target page does not exist', (t) => {
		const fixture = createFixture();
		t.after(fixture.cleanup);
		const missingTarget = { ...redirect, to: '/blog/gone/' };
		writeFile(
			fixture.distDir,
			'blog/archive/derived/derived/index.html',
			redirectPage(missingTarget.to),
		);

		const result = check(fixture, [missingTarget]);

		assert.ok(result.issues.some((issue) => issue.includes('Redirect target is missing')));
	});
});

describe('findExternalAssetReferencesInHtml', () => {
	it('reports a stylesheet loaded from a blocked host', () => {
		const html = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">';

		const issues = findExternalAssetReferencesInHtml(html, 'index.html');

		assert.equal(issues.length, 1);
		assert.ok(issues[0].includes('fonts.googleapis.com'));
		assert.ok(issues[0].includes('index.html'));
	});

	it('reports a script loaded from a CDN', () => {
		const html = '<script src="https://cdn.jsdelivr.net/npm/katex/dist/katex.min.js"></script>';

		assert.equal(findExternalAssetReferencesInHtml(html, 'page.html').length, 1);
	});

	it('accepts same-origin assets', () => {
		const html = [
			'<link rel="stylesheet" href="/katex/katex.min.css">',
			'<script src="/_astro/app.js"></script>',
			'<link rel="canonical" href="https://chocobreeze.github.io/blog/post/">',
		].join('');

		assert.deepEqual(findExternalAssetReferencesInHtml(html, 'page.html'), []);
	});

	it('ignores an external link that is not an asset tag', () => {
		const html = '<a href="https://fonts.googleapis.com/specimen/Inter">Inter</a>';

		assert.deepEqual(findExternalAssetReferencesInHtml(html, 'page.html'), []);
	});

	it('honors a custom host list', () => {
		const html = '<link rel="stylesheet" href="https://example.com/a.css">';

		assert.equal(findExternalAssetReferencesInHtml(html, 'page.html', ['example.com']).length, 1);
		assert.deepEqual(findExternalAssetReferencesInHtml(html, 'page.html', []), []);
	});
});

describe('findLiteralBoldMarkersInHtml', () => {
	const page = (body) => `<html><body><nav>**menu**</nav><article>${body}</article></body></html>`;

	it('reports bold markers left as literal text before a Korean particle', () => {
		const html = page('<p>지수는 **-0.9%**였고 핵심은 **&quot;AI 수요&quot;**입니다.</p>');

		const issues = findLiteralBoldMarkersInHtml(html, 'blog/post/index.html');

		assert.equal(issues.length, 1);
		assert.ok(issues[0].includes('blog/post/index.html'));
		assert.ok(issues[0].includes('2 found'));
	});

	it('reports bold markers wrapped around inline code', () => {
		const html = page('<p>바로 **<code>git worktree</code>**다.</p>');

		assert.equal(findLiteralBoldMarkersInHtml(html, 'page.html').length, 1);
	});

	it('accepts rendered bold and asterisks inside code, math and outside the article', () => {
		const html = page(
			[
				'<p><strong>-0.9%</strong>였습니다.</p>',
				'<pre><code>x = a ** b ** c</code></pre>',
				'<p><code>**kwargs</code>와 <code>**args**</code></p>',
				'<span class="katex"><math><annotation encoding="application/x-tex">a**b**</annotation></math></span>',
				'<p>2 ** 3 = 8</p>',
			].join(''),
		);

		assert.deepEqual(findLiteralBoldMarkersInHtml(html, 'page.html'), []);
	});
});

describe('checkBuildBudgets', () => {
	const budgets = [
		{ key: 'bundle', label: 'bundled assets', total: 1000, measured: 800 },
		{ key: 'og', label: 'OG cards', perPost: 100, measured: 900 },
	];

	it('accepts a build inside every budget', () => {
		const issues = checkBuildBudgets(
			[
				{ key: 'bundle', bytes: 900, fileCount: 2 },
				{ key: 'og', bytes: 900, fileCount: 9 },
			],
			10,
			budgets,
		);

		assert.deepEqual(issues, []);
	});

	it('reports a total budget that is exceeded', () => {
		const issues = checkBuildBudgets([{ key: 'bundle', bytes: 1200, fileCount: 2 }], 10, [
			budgets[0],
		]);

		assert.equal(issues.length, 1);
		assert.ok(issues[0].includes('bundle'));
		assert.ok(issues[0].includes('too much'));
	});

	it('scales a per-post budget with the post count', () => {
		const measurement = [{ key: 'og', bytes: 1500, fileCount: 15 }];

		assert.deepEqual(checkBuildBudgets(measurement, 20, [budgets[1]]), []);
		assert.equal(checkBuildBudgets(measurement, 10, [budgets[1]]).length, 1);
	});

	it('reports a budgeted group that is missing from the build', () => {
		const issues = checkBuildBudgets([], 10, [budgets[0]]);

		assert.equal(issues.length, 1);
		assert.ok(issues[0].includes('missing from the build'));
	});

	it('reports a budget that defines no limit', () => {
		const issues = checkBuildBudgets([{ key: 'x', bytes: 1, fileCount: 1 }], 10, [
			{ key: 'x', label: 'x', measured: 1 },
		]);

		assert.equal(issues.length, 1);
		assert.ok(issues[0].includes('neither a total nor a per-post limit'));
	});

	it('treats a zero post count as one post', () => {
		assert.deepEqual(
			checkBuildBudgets([{ key: 'og', bytes: 100, fileCount: 1 }], 0, [budgets[1]]),
			[],
		);
	});
});

describe('measureBuildGroups', () => {
	it('measures a directory group and a single-file group', (t) => {
		const fixture = createFixture();
		t.after(fixture.cleanup);

		const measurements = measureBuildGroups(fixture.distDir, [
			{ key: 'blog', label: 'post pages', total: 1, measured: 1 },
			{ key: 'search.json', label: 'search index', total: 1, measured: 1 },
			{ key: 'missing-group', label: 'absent', total: 1, measured: 1 },
		]);

		const blog = measurements.find((entry) => entry.key === 'blog');
		const search = measurements.find((entry) => entry.key === 'search.json');
		const missing = measurements.find((entry) => entry.key === 'missing-group');

		assert.ok(blog.fileCount >= 2);
		assert.ok(blog.bytes > 0);
		assert.equal(search.fileCount, 1);
		assert.ok(search.bytes > 0);
		assert.equal(missing.missing, true);
		assert.equal(missing.bytes, 0);
	});
});
