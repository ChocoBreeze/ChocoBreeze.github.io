import { createServer } from 'node:http';
import { cpus } from 'node:os';
import { readFileSync, statSync } from 'node:fs';
import { extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

import { buildSyntheticSearchIndex, getPercentile } from './benchmark-search-scale.mjs';

export const DEFAULT_BROWSER_WARM_SAMPLES = 30;
export const BROWSER_BENCHMARK_QUERIES = ['ETF', '반도체'];

const SEARCH_BENCHMARK_INIT = () => {
	const measurements = [];
	let pending = null;
	const attachObserver = () => {
		const resultsList = document.getElementById('results-list');
		if (!resultsList || resultsList.dataset.searchBenchmarkObserved === 'true') return;
		resultsList.dataset.searchBenchmarkObserved = 'true';
		new MutationObserver(() => {
			if (!pending || resultsList.children.length === 0) return;
			measurements.push({
				query: pending.query,
				durationMs: performance.now() - pending.startedAt,
				resultCount: resultsList.children.length,
			});
			pending = null;
		}).observe(resultsList, { childList: true });
	};

	document.addEventListener(
		'input',
		(event) => {
			if (event.target?.id !== 'search-input') return;
			pending = { query: event.target.value, startedAt: performance.now() };
		},
		true,
	);
	window.__searchBenchmark = { measurements };
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', attachObserver, { once: true });
	} else {
		attachObserver();
	}
};

function contentType(path) {
	return (
		{
			'.css': 'text/css; charset=utf-8',
			'.html': 'text/html; charset=utf-8',
			'.js': 'text/javascript; charset=utf-8',
			'.json': 'application/json; charset=utf-8',
			'.mjs': 'text/javascript; charset=utf-8',
			'.svg': 'image/svg+xml',
			'.wasm': 'application/wasm',
			'.webp': 'image/webp',
			'.woff': 'font/woff',
			'.woff2': 'font/woff2',
		}[extname(path)] ?? 'application/octet-stream'
	);
}

async function serveDirectory(directory) {
	const root = resolve(directory);
	const server = createServer((request, response) => {
		try {
			const requestedPath = decodeURIComponent(
				new URL(request.url ?? '/', 'http://127.0.0.1').pathname,
			);
			let absolutePath = resolve(root, `.${requestedPath}`);
			const pathFromRoot = relative(root, absolutePath);
			if (
				pathFromRoot === '..' ||
				pathFromRoot.startsWith(`..${sep}`) ||
				pathFromRoot.includes(':')
			) {
				response.writeHead(403).end();
				return;
			}
			if (statSync(absolutePath, { throwIfNoEntry: false })?.isDirectory()) {
				absolutePath = resolve(absolutePath, 'index.html');
			}
			const stats = statSync(absolutePath, { throwIfNoEntry: false });
			if (!stats?.isFile()) {
				response.writeHead(404).end();
				return;
			}
			response.writeHead(200, { 'Content-Type': contentType(absolutePath) });
			response.end(readFileSync(absolutePath));
		} catch {
			response.writeHead(404).end();
		}
	});
	await new Promise((resolveServer) => server.listen(0, '127.0.0.1', resolveServer));
	const address = server.address();
	if (!address || typeof address === 'string')
		throw new Error('Could not start benchmark site server');
	return {
		baseUrl: `http://127.0.0.1:${address.port}`,
		close: () =>
			new Promise((resolveServer, reject) =>
				server.close((error) => (error ? reject(error) : resolveServer())),
			),
	};
}

async function waitForMeasurement(page, priorCount) {
	await page.waitForFunction(
		(previousCount) => window.__searchBenchmark?.measurements.length > previousCount,
		priorCount,
		{ timeout: 15_000 },
	);
	return page.evaluate((index) => window.__searchBenchmark.measurements[index], priorCount);
}

async function searchAndMeasure(page, query) {
	const priorCount = await page.evaluate(() => window.__searchBenchmark.measurements.length);
	await page.locator('#search-input').fill(query);
	const measurement = await waitForMeasurement(page, priorCount);
	await page.waitForFunction(() =>
		document.querySelector('#results-count')?.textContent?.includes('개의 결과를 찾았습니다.'),
	);
	return measurement;
}

async function clearResults(page) {
	await page.locator('#search-input').fill('');
	await page.waitForFunction(() => document.querySelector('#results-list')?.children.length === 0);
}

async function collectMemory(cdp) {
	await cdp.send('HeapProfiler.collectGarbage');
	const [heap, performance] = await Promise.all([
		cdp.send('Runtime.getHeapUsage'),
		cdp.send('Performance.getMetrics'),
	]);
	const metrics = Object.fromEntries(performance.metrics.map(({ name, value }) => [name, value]));
	return {
		heapUsedBytes: heap.usedSize,
		domNodes: metrics.Nodes ?? Number.NaN,
	};
}

function summarizeWarmSamples(samples) {
	return {
		sampleCount: samples.length,
		resultCount: samples.at(-1)?.resultCount ?? 0,
		p50Ms: getPercentile(
			samples.map((sample) => sample.durationMs),
			50,
		),
		p95Ms: getPercentile(
			samples.map((sample) => sample.durationMs),
			95,
		),
	};
}

async function measureCorpus({
	baseUrl,
	index,
	interceptIndex,
	targetCount,
	warmSamples,
	browser,
}) {
	const context = await browser.newContext();
	const page = await context.newPage();
	await page.addInitScript(SEARCH_BENCHMARK_INIT);
	if (interceptIndex) {
		await page.route('**/search.json*', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(index),
			}),
		);
	}
	await page.goto(`${baseUrl}/search/`, { waitUntil: 'domcontentloaded' });
	await page.locator('#search-input').waitFor();
	const cdp = await context.newCDPSession(page);
	await Promise.all([cdp.send('HeapProfiler.enable'), cdp.send('Performance.enable')]);
	const baselineMemory = await collectMemory(cdp);

	const firstQuery = BROWSER_BENCHMARK_QUERIES[0];
	const cold = await searchAndMeasure(page, firstQuery);
	await clearResults(page);
	const residentMemory = await collectMemory(cdp);
	await searchAndMeasure(page, firstQuery);

	const warmByQuery = Object.fromEntries(BROWSER_BENCHMARK_QUERIES.map((query) => [query, []]));
	for (let sample = 0; sample < warmSamples; sample += 1) {
		for (const query of [...BROWSER_BENCHMARK_QUERIES.slice(1), firstQuery]) {
			warmByQuery[query].push(await searchAndMeasure(page, query));
		}
	}

	const broadResults = warmByQuery[firstQuery].at(-1);
	const broadMemory = await collectMemory(cdp);
	const payload = Buffer.byteLength(JSON.stringify(index));
	const result = {
		documents: targetCount,
		indexBytes: payload,
		cold: { query: cold.query, durationMs: cold.durationMs, resultCount: cold.resultCount },
		warm: Object.fromEntries(
			BROWSER_BENCHMARK_QUERIES.map((query) => [query, summarizeWarmSamples(warmByQuery[query])]),
		),
		broadResultCount: broadResults.resultCount,
		memory: {
			baselineHeapBytes: baselineMemory.heapUsedBytes,
			residentIndexHeapBytes: residentMemory.heapUsedBytes,
			broadResultsHeapBytes: broadMemory.heapUsedBytes,
			residentIndexHeapDeltaBytes: residentMemory.heapUsedBytes - baselineMemory.heapUsedBytes,
			broadResultsHeapDeltaBytes: broadMemory.heapUsedBytes - residentMemory.heapUsedBytes,
			baselineDomNodes: baselineMemory.domNodes,
			residentDomNodes: residentMemory.domNodes,
			broadResultsDomNodes: broadMemory.domNodes,
		},
	};
	await cdp.detach();
	await context.close();
	return result;
}

function formatBytes(value) {
	if (!Number.isFinite(value)) return 'n/a';
	const sign = value < 0 ? '−' : '';
	const absolute = Math.abs(value);
	return `${sign}${(absolute / 1024 / 1024).toFixed(2)} MiB`;
}

function formatBrowserReport({ generatedAt, browserVersion, environment, warmSamples, corpora }) {
	return [
		'# Browser search latency and memory benchmark',
		'',
		`- Generated: ${generatedAt}`,
		`- Browser: Chromium ${browserVersion}; ${environment.platform}/${environment.arch}; ${environment.cpu} (${environment.logicalCores} logical cores)`,
		`- Warm samples: ${warmSamples} per query; nearest-rank p50/p95; one untimed cache-warmup query; loopback server without network/CPU throttling.`,
		'- Cold is the first input from an empty page and includes JSON fetch, parse, ranking, and DOM creation. Warm samples are consecutive query-to-query edits with the selected index kept active. Input-to-DOM ends at the MutationObserver notification for the first non-empty result-list mutation.',
		'- Memory is Chromium CDP JavaScript heap after forced GC; it excludes browser process and native allocations. Resident index is measured with results cleared; broad result memory uses the full `ETF` result list rendered by the current UI.',
		'- Synthetic corpus entries repeat current search records with unique slugs. These are scale experiments, not a prediction of future corpus text or result distribution.',
		'',
		'| Documents | JSON | Cold ETF | ETF results | ETF warm p50/p95 | 반도체 results | 반도체 warm p50/p95 | Index heap delta | ETF result heap delta | DOM nodes: empty / index / ETF |',
		'| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
		...corpora.map((corpus) => {
			const etf = corpus.warm.ETF;
			const semiconductor = corpus.warm['반도체'];
			return `| ${corpus.documents.toLocaleString('en-US')} | ${corpus.indexBytes.toLocaleString('en-US')} B | ${corpus.cold.durationMs.toFixed(2)} ms | ${corpus.cold.resultCount} | ${etf.p50Ms.toFixed(2)} / ${etf.p95Ms.toFixed(2)} ms (${etf.sampleCount}) | ${semiconductor.resultCount} | ${semiconductor.p50Ms.toFixed(2)} / ${semiconductor.p95Ms.toFixed(2)} ms (${semiconductor.sampleCount}) | ${formatBytes(corpus.memory.residentIndexHeapDeltaBytes)} | ${formatBytes(corpus.memory.broadResultsHeapDeltaBytes)} | ${corpus.memory.baselineDomNodes.toFixed(0)} / ${corpus.memory.residentDomNodes.toFixed(0)} / ${corpus.memory.broadResultsDomNodes.toFixed(0)} |`;
		}),
		'',
		'## Memory samples',
		'',
		'| Documents | Baseline heap | Index resident heap | ETF results heap |',
		'| ---: | ---: | ---: | ---: |',
		...corpora.map(
			(corpus) =>
				`| ${corpus.documents.toLocaleString('en-US')} | ${formatBytes(corpus.memory.baselineHeapBytes)} | ${formatBytes(corpus.memory.residentIndexHeapBytes)} | ${formatBytes(corpus.memory.broadResultsHeapBytes)} |`,
		),
	].join('\n');
}

export async function runSearchBrowserBenchmark({
	siteDirectory = resolve(process.cwd(), 'dist'),
	targets,
	warmSamples = DEFAULT_BROWSER_WARM_SAMPLES,
	generatedAt = new Date().toISOString(),
} = {}) {
	if (!statSync(siteDirectory, { throwIfNoEntry: false })?.isDirectory()) {
		throw new Error(`Build output directory not found: ${siteDirectory}`);
	}
	if (!Number.isInteger(warmSamples) || warmSamples < 1)
		throw new Error('Warm sample count must be positive');
	const sourceIndex = JSON.parse(readFileSync(resolve(siteDirectory, 'search.json'), 'utf8'));
	if (!Array.isArray(sourceIndex) || sourceIndex.length === 0)
		throw new Error('Built search index is empty');
	const targetCounts = [...new Set(targets ?? [sourceIndex.length, 1000, 2000])]
		.filter((count) => count >= sourceIndex.length)
		.sort((a, b) => a - b);
	if (targetCounts.length === 0 || targetCounts.some((count) => !Number.isInteger(count))) {
		throw new Error(`Browser benchmark targets must be integers >= ${sourceIndex.length}`);
	}

	const server = await serveDirectory(siteDirectory);
	let browser;
	try {
		browser = await chromium.launch({ headless: true });
		const corpora = [];
		for (const targetCount of targetCounts) {
			const index =
				targetCount === sourceIndex.length
					? sourceIndex
					: buildSyntheticSearchIndex(sourceIndex, targetCount);
			const corpus = await measureCorpus({
				baseUrl: server.baseUrl,
				index,
				interceptIndex: targetCount !== sourceIndex.length,
				targetCount,
				warmSamples,
				browser,
			});
			if (corpus.cold.resultCount === 0 || corpus.warm['반도체'].resultCount === 0) {
				throw new Error(
					`Representative browser query returned no results at ${targetCount} documents`,
				);
			}
			corpora.push(corpus);
		}
		return formatBrowserReport({
			generatedAt,
			browserVersion: browser.version(),
			environment: {
				platform: process.platform,
				arch: process.arch,
				cpu: cpus()[0]?.model ?? 'unknown',
				logicalCores: cpus().length,
			},
			warmSamples,
			corpora,
		});
	} finally {
		try {
			await browser?.close();
		} finally {
			await server.close();
		}
	}
}

const currentFile = resolve(fileURLToPath(import.meta.url));
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
	try {
		const targets = process.argv[2]
			? process.argv[2].split(',').map((value) => Number(value.trim()))
			: undefined;
		const warmSamples = process.argv[3] ? Number(process.argv[3]) : undefined;
		console.log(await runSearchBrowserBenchmark({ targets, warmSamples }));
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	}
}
