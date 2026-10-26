import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';

import remarkTickerLinks, {
	EXCLUDED_TICKERS,
	buildTickerRouteMap,
} from '../../src/lib/remarkTickerLinks.mjs';
import { createContentFixture } from './helpers/content-fixture.mjs';

function writePost(contentDir, relativeFile, frontmatter) {
	const filePath = path.join(contentDir, relativeFile);
	mkdirSync(path.dirname(filePath), { recursive: true });
	writeFileSync(filePath, `---\n${frontmatter}\n---\n\nBody\n`);
}

async function withEtfFixture(run) {
	const fixture = createContentFixture();
	try {
		writePost(fixture.contentDir, 'ETF/QQQ/QQQ.md', 'title: QQQ\nticker: QQQ\nslug: etf/qqq');
		writePost(fixture.contentDir, 'ETF/QQQM.md', "title: QQQM\nticker: 'QQQM'\nslug: etf/qqqm");
		writePost(fixture.contentDir, 'ETF/Smart Grid/GRID.md', 'title: GRID\nticker: GRID');
		writePost(fixture.contentDir, 'ETF/USD.md', 'title: USD\nticker: USD\nslug: etf/usd');
		writePost(
			fixture.contentDir,
			'ETF/DRFT.md',
			'title: Draft\nticker: DRFT\nslug: etf/drft\ndraft: true',
		);
		return await run(fixture.contentDir);
	} finally {
		fixture.cleanup();
	}
}

async function render(contentDir, markdown, frontmatter = { categories: ['Market Brief'] }) {
	const processor = await createMarkdownProcessor({
		remarkPlugins: [remarkMath, [remarkTickerLinks, { contentDir, includeDrafts: false }]],
		syntaxHighlight: false,
	});
	const result = await processor.render(markdown, { frontmatter });
	return result.code;
}

describe('buildTickerRouteMap', () => {
	it('maps tickers to trailing-slash post URLs from slug or path', async () => {
		await withEtfFixture((contentDir) => {
			const routes = buildTickerRouteMap(contentDir);

			assert.equal(routes.get('QQQ'), '/blog/etf/qqq/');
			assert.equal(routes.get('QQQM'), '/blog/etf/qqqm/');
			assert.equal(routes.get('GRID'), '/blog/etf/smart-grid/grid/');
		});
	});

	it('leaves out excluded tickers, and drafts unless asked', async () => {
		await withEtfFixture((contentDir) => {
			assert.ok(EXCLUDED_TICKERS.includes('USD'));
			assert.equal(buildTickerRouteMap(contentDir).has('USD'), false);
			assert.equal(buildTickerRouteMap(contentDir).has('DRFT'), false);
			assert.equal(buildTickerRouteMap(contentDir, { includeDrafts: true }).has('DRFT'), true);
		});
	});

	it('drops a ticker claimed by two posts', async () => {
		await withEtfFixture((contentDir) => {
			writePost(contentDir, 'ETF/QQQ-copy.md', 'title: Copy\nticker: QQQ');

			assert.equal(buildTickerRouteMap(contentDir).has('QQQ'), false);
		});
	});
});

describe('remarkTickerLinks', () => {
	it('links only the first mention of each ticker', async () => {
		await withEtfFixture(async (contentDir) => {
			const html = await render(contentDir, 'QQQ와 GRID가 올랐고, QQQ는 다시 언급됩니다.');

			assert.equal(html.match(/<a /g)?.length, 2);
			assert.match(
				html,
				/<a href="\/blog\/etf\/qqq\/">QQQ<\/a>와 <a href="\/blog\/etf\/smart-grid\/grid\/">GRID<\/a>/,
			);
			assert.match(html, /, QQQ는 다시/);
		});
	});

	it('matches whole uppercase tickers next to Korean text and punctuation only', async () => {
		await withEtfFixture(async (contentDir) => {
			const html = await render(contentDir, 'QQQM 비중, qqq 소문자, QQQ_X 표기, (QQQ).');

			assert.match(html, /<a href="\/blog\/etf\/qqqm\/">QQQM<\/a> 비중/);
			assert.match(html, /qqq 소문자/);
			assert.match(html, /QQQ_X 표기/);
			assert.match(html, /\(<a href="\/blog\/etf\/qqq\/">QQQ<\/a>\)/);
		});
	});

	it('skips headings, links, code, math and raw HTML but links inside tables and HTML tags', async () => {
		await withEtfFixture(async (contentDir) => {
			const markdown = [
				'## QQQ 동향',
				'',
				'[QQQ 공식](https://example.com/qqq) `QQQ` $QQQ$',
				'',
				'```',
				'GRID',
				'```',
				'',
				'| 티커 | 설명 |',
				'| --- | --- |',
				'| <strong>GRID</strong> | QQQ 추종 |',
			].join('\n');
			const html = await render(contentDir, markdown);

			assert.match(html, /<h2[^>]*>QQQ 동향<\/h2>/);
			assert.match(html, /<a href="https:\/\/example.com\/qqq">QQQ 공식<\/a>/);
			assert.match(html, /<code>QQQ<\/code>/);
			assert.match(html, /<strong><a href="\/blog\/etf\/smart-grid\/grid\/">GRID<\/a><\/strong>/);
			assert.match(html, /<td><a href="\/blog\/etf\/qqq\/">QQQ<\/a> 추종<\/td>/);
		});
	});

	it('leaves excluded tickers and other categories alone', async () => {
		await withEtfFixture(async (contentDir) => {
			assert.doesNotMatch(await render(contentDir, 'USD 강세'), /<a /);
			assert.doesNotMatch(await render(contentDir, 'QQQ 소개', { categories: ['ETF'] }), /<a /);
			assert.match(
				await render(contentDir, 'QQQ 소개', { categories: 'market brief' }),
				/<a href="\/blog\/etf\/qqq\/">/,
			);
		});
	});
});
