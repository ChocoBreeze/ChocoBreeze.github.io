import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

import {
	addUniqueSearchMarker,
	createSyntheticPagefindSite,
} from '../benchmark-pagefind-scale.mjs';

function createFixture() {
	const root = mkdtempSync(join(tmpdir(), 'pagefind-scale-test-'));
	const sourceDirectory = join(root, 'source');
	const targetDirectory = join(root, 'synthetic');
	const sourceItems = [
		{ t: 'ETF guide', d: 'ETF content', c: 'ETF', s: 'etf/guide' },
		{ t: 'Report', d: 'Report content', c: 'reports', s: 'reports/guide' },
	];
	const quickItems = sourceItems.map(({ t, d, c, s }) => ({ t, d, c, s }));
	mkdirSync(join(sourceDirectory, 'search'), { recursive: true });
	for (const item of sourceItems) {
		const pagePath = join(sourceDirectory, 'blog', ...item.s.split('/'), 'index.html');
		mkdirSync(join(pagePath, '..'), { recursive: true });
		const filter = item.c === 'ETF' ? '<span data-pagefind-filter="category:ETF">ETF</span>' : '';
		writeFileSync(pagePath, `<main class="post-body">${filter}${item.d}</main>`);
	}
	writeFileSync(join(sourceDirectory, 'search.json'), JSON.stringify(sourceItems));
	writeFileSync(join(sourceDirectory, 'search', 'quick.json'), JSON.stringify(quickItems));
	writeFileSync(join(sourceDirectory, 'search', 'etf.json'), JSON.stringify([sourceItems[0]]));
	writeFileSync(join(sourceDirectory, 'search', 'reports.json'), JSON.stringify([sourceItems[1]]));
	writeFileSync(join(sourceDirectory, 'code-search.json'), '[]');
	return { root, sourceDirectory, targetDirectory, sourceItems };
}

test('synthetic Pagefind site preserves body/filter HTML and creates unique indexed routes', (t) => {
	const fixture = createFixture();
	t.after(() => rmSync(fixture.root, { recursive: true, force: true }));

	const result = createSyntheticPagefindSite({
		sourceDirectory: fixture.sourceDirectory,
		targetDirectory: fixture.targetDirectory,
		targetCount: 4,
	});
	const fullIndex = JSON.parse(readFileSync(join(fixture.targetDirectory, 'search.json'), 'utf8'));
	const etfIndex = JSON.parse(
		readFileSync(join(fixture.targetDirectory, 'search', 'etf.json'), 'utf8'),
	);
	const quickIndex = JSON.parse(
		readFileSync(join(fixture.targetDirectory, 'search', 'quick.json'), 'utf8'),
	);
	const slugs = fullIndex.map(({ s }) => s);

	assert.deepEqual(result, { sourceCount: 2, targetCount: 4, copiedHtmlCount: 4 });
	assert.equal(new Set(slugs).size, 4);
	assert.equal(etfIndex.length, 2);
	assert.equal(quickIndex.length, 4);
	const copiedHtml = readFileSync(
		join(fixture.targetDirectory, 'blog', 'etf', 'guide', 'index.html'),
		'utf8',
	);
	assert.ok(copiedHtml.includes('ETF content'));
	assert.ok(copiedHtml.includes('<span data-pagefind-filter="category:ETF">ETF</span>'));
	assert.match(copiedHtml, /search-scale-marker-00001/);
	assert.match(
		readFileSync(
			join(fixture.targetDirectory, 'blog', 'etf', 'guide--scale-1', 'index.html'),
			'utf8',
		),
		/data-pagefind-filter="category:ETF"/,
	);
	for (const slug of slugs) {
		assert.ok(
			readdirSync(join(fixture.targetDirectory, 'blog', ...slug.split('/'))).includes('index.html'),
		);
	}
});

test('synthetic search marker is inserted inside post body without changing original text', () => {
	const html = '<main><div class="post-body"><p>Original content</p></div></main>';
	const result = addUniqueSearchMarker(html, 'scale-marker-1');
	assert.match(result, /<p>Original content<\/p> <span>scale-marker-1<\/span> <\/div>/);
	assert.throws(
		() => addUniqueSearchMarker(html, 'invalid marker'),
		/letters, numbers, and hyphens/,
	);
});

test('synthetic Pagefind site rejects targets smaller than the source corpus', (t) => {
	const fixture = createFixture();
	t.after(() => rmSync(fixture.root, { recursive: true, force: true }));
	assert.throws(
		() =>
			createSyntheticPagefindSite({
				sourceDirectory: fixture.sourceDirectory,
				targetDirectory: fixture.targetDirectory,
				targetCount: 1,
			}),
		/at least the source count/,
	);
});

test('synthetic Pagefind site rejects a source index with missing blog HTML', (t) => {
	const fixture = createFixture();
	t.after(() => rmSync(fixture.root, { recursive: true, force: true }));
	rmSync(join(fixture.sourceDirectory, 'blog', 'reports'), { recursive: true, force: true });
	assert.throws(
		() =>
			createSyntheticPagefindSite({
				sourceDirectory: fixture.sourceDirectory,
				targetDirectory: fixture.targetDirectory,
				targetCount: 4,
			}),
		/HTML is missing/,
	);
});
