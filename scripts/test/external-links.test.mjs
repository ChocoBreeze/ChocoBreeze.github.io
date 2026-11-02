import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { after, before, describe, it } from 'node:test';

import {
	checkUrl,
	checkUrls,
	classifyResult,
	extractExternalLinks,
	toRequestUrl,
	trimUrl,
} from '../lib/external-links.mjs';

describe('extractExternalLinks', () => {
	it('finds Markdown, angle, bare and HTML links with line numbers', () => {
		const content = [
			'---',
			"heroImage: 'https://example.com/hero.png'",
			'---',
			'',
			'[출처](https://a.example/x) 와 <https://b.example/y>',
			'본문 https://c.example/z. 그리고 <a href="https://d.example/?a=1&amp;b=2">d</a>',
		].join('\n');

		assert.deepEqual(extractExternalLinks(content), [
			{ url: 'https://a.example/x', line: 5 },
			{ url: 'https://b.example/y', line: 5 },
			{ url: 'https://c.example/z', line: 6 },
			{ url: 'https://d.example/?a=1&b=2', line: 6 },
		]);
	});

	it('skips fenced code blocks and inline code but keeps the text after them', () => {
		const content = [
			'```bash',
			'curl https://code.example/in-fence',
			'```',
			'`https://code.example/inline` 다음 https://real.example/after',
			'~~~~',
			'https://code.example/tilde',
			'~~~~',
		].join('\n');

		assert.deepEqual(extractExternalLinks(content), [
			{ url: 'https://real.example/after', line: 4 },
		]);
	});
});

describe('trimUrl', () => {
	it('drops sentence punctuation and unbalanced closing brackets', () => {
		assert.equal(trimUrl('https://a.example/x).'), 'https://a.example/x');
		assert.equal(trimUrl('https://a.example/x**'), 'https://a.example/x');
		assert.equal(trimUrl('https://a.example/fund.pdf)[^2]'), 'https://a.example/fund.pdf');
		assert.equal(trimUrl('https://a.example/x](https://b.example/y)'), 'https://a.example/x');
		assert.equal(
			trimUrl('https://en.wikipedia.org/wiki/Foo_(bar)'),
			'https://en.wikipedia.org/wiki/Foo_(bar)',
		);
	});
});

describe('classifyResult', () => {
	it('separates broken links from blocked or uncertain ones', () => {
		const url = 'https://a.example/x';
		assert.equal(classifyResult({ url, status: 404 }), 'broken');
		assert.equal(classifyResult({ url, status: 410 }), 'broken');
		assert.equal(classifyResult({ url, errorCode: 'ENOTFOUND' }), 'broken');
		assert.equal(classifyResult({ url, errorCode: 'ECONNREFUSED' }), 'broken');
		assert.equal(classifyResult({ url, status: 403 }), 'check');
		assert.equal(classifyResult({ url, status: 429 }), 'check');
		assert.equal(classifyResult({ url, status: 503 }), 'check');
		assert.equal(classifyResult({ url, errorCode: 'TIMEOUT' }), 'check');
	});

	it('does not trust 404 from sites that send it to every automated request', () => {
		assert.equal(
			classifyResult({ url: 'https://www.acmicpc.net/problem/1420', status: 404 }),
			'check',
		);
	});

	it('treats a redirect to another site as moved and within the site as ok', () => {
		const url = 'https://a.example/x';
		assert.equal(classifyResult({ url, status: 200, finalUrl: 'https://www.a.example/y' }), 'ok');
		assert.equal(classifyResult({ url, status: 200, finalUrl: 'https://b.example/x' }), 'moved');
	});

	it('requests a URL without its fragment', () => {
		assert.equal(toRequestUrl('https://a.example/x#section'), 'https://a.example/x');
	});
});

describe('checkUrl against a local server', () => {
	let server;
	let base;
	let otherBase;
	// Requests being answered right now, overall and per Host header.
	let inFlight;
	const resetInFlight = () => {
		inFlight = { current: 0, max: 0, byHost: new Map() };
	};
	resetInFlight();

	before(async () => {
		server = createServer((req, res) => {
			const host = req.headers.host.split(':')[0];
			const hostCount = inFlight.byHost.get(host) ?? { current: 0, max: 0 };
			inFlight.byHost.set(host, hostCount);
			for (const counter of [inFlight, hostCount]) {
				counter.current += 1;
				counter.max = Math.max(counter.max, counter.current);
			}
			const done = (status, headers = {}) => {
				setTimeout(() => {
					inFlight.current -= 1;
					hostCount.current -= 1;
					res.writeHead(status, headers).end(req.method === 'GET' ? 'body' : undefined);
				}, 50);
			};

			if (req.url === '/ok') return done(200);
			if (req.url === '/gone') return done(410);
			if (req.url === '/missing') return done(404);
			if (req.url === '/blocked') return done(403);
			if (req.url === '/error') return done(500);
			if (req.url === '/head-not-allowed') return done(req.method === 'HEAD' ? 405 : 200);
			if (req.url === '/same-host-redirect') return done(301, { location: '/ok' });
			if (req.url === '/other-host-redirect') return done(301, { location: `${otherBase}/ok` });
			if (req.url === '/loop') return done(302, { location: '/loop' });
			if (req.url === '/slow') return; // never answers
			return done(404);
		});
		await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
		const { port } = server.address();
		base = `http://127.0.0.1:${port}`;
		otherBase = `http://localhost:${port}`;
	});

	after(() => {
		server.closeAllConnections();
		server.close();
	});

	it('classifies each kind of response', async () => {
		const kindOf = async (path, options) => (await checkUrl(`${base}${path}`, options)).kind;

		assert.equal(await kindOf('/ok'), 'ok');
		assert.equal(await kindOf('/gone'), 'broken');
		assert.equal(await kindOf('/missing'), 'broken');
		assert.equal(await kindOf('/blocked'), 'check');
		assert.equal(await kindOf('/error'), 'check');
		assert.equal(await kindOf('/head-not-allowed'), 'ok');
		assert.equal(await kindOf('/same-host-redirect'), 'ok');
		assert.equal(await kindOf('/other-host-redirect'), 'moved');
		assert.equal(await kindOf('/slow', { timeoutMs: 200 }), 'check');

		const loop = await checkUrl(`${base}/loop`);
		assert.equal(loop.errorCode, 'REDIRECT_LOOP');
		assert.equal(loop.kind, 'check');
	});

	it('reports a refused connection as broken', async () => {
		const closed = createServer();
		await new Promise((resolve) => closed.listen(0, '127.0.0.1', resolve));
		const { port } = closed.address();
		await new Promise((resolve) => closed.close(resolve));

		const result = await checkUrl(`http://127.0.0.1:${port}/`);
		assert.equal(result.errorCode, 'ECONNREFUSED');
		assert.equal(result.kind, 'broken');
	});

	it('works on hosts in parallel but sends one request at a time per host', async () => {
		// The earlier /slow request never completes, so count from zero here.
		resetInFlight();
		const paths = ['/ok', '/gone', '/blocked', '/error'];
		const urls = [base, otherBase].flatMap((origin) => paths.map((path) => `${origin}${path}`));

		const results = await checkUrls(urls, { concurrency: 4, hostGapMs: 0 });

		assert.equal(results.length, 8);
		assert.equal(inFlight.byHost.get('127.0.0.1').max, 1);
		assert.equal(inFlight.byHost.get('localhost').max, 1);
		assert.equal(inFlight.max, 2);
	});
});
