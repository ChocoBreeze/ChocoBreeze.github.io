import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { checkBuildArtifacts } from '../check-build-artifacts.mjs';

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

function check(fixture) {
	return checkBuildArtifacts({
		contentDir: fixture.contentDir,
		distDir: fixture.distDir,
		siteTitle: 'ChocoBreeze',
	});
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
