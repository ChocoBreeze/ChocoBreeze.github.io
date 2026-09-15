import { createServer } from 'node:http';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative, resolve, extname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { searchIndexedItems } from '../src/lib/searchRanking.mjs';
import { collectSearchIndexSizes, formatBytes } from './report-search-size.mjs';

export const DEFAULT_PAGEFIND_OUTPUT_SUBDIR = '.pagefind-benchmark';
export const PAGEFIND_ROOT_SELECTOR = '.post-body';
export const PAGEFIND_CATEGORY_FILTER = { category: 'ETF' };

const BASELINE_INDEXES = [
	{ key: 'posts', label: '전체 글', relativePath: 'search.json' },
	{ key: 'category', label: 'ETF 카테고리', relativePath: 'search/etf.json' },
	{ key: 'code', label: '코드', relativePath: 'code-search.json' },
];

export function getBenchmarkQueries() {
	return ['ETF', '반도체', 'IAU', 'git diff --cached', '🧿🦄'];
}

export function sumFileSizes(entries) {
	return entries.reduce((total, entry) => total + entry.bytes, 0);
}

export function getCurrentIndexByteSummary(entries) {
	const normalizedEntries = entries.map((entry) => ({
		...entry,
		relativePath: entry.relativePath.replaceAll('\\', '/'),
	}));
	const getBytes = (predicate) => sumFileSizes(normalizedEntries.filter(predicate));
	return {
		total: sumFileSizes(normalizedEntries),
		posts: getBytes(({ relativePath }) => relativePath === 'search.json'),
		categories: getBytes(
			({ relativePath }) =>
				relativePath.startsWith('search/') && relativePath !== 'search/quick.json',
		),
		quick: getBytes(({ relativePath }) => relativePath === 'search/quick.json'),
		code: getBytes(({ relativePath }) => relativePath === 'code-search.json'),
	};
}

function formatResultTitles(results = []) {
	const titles = results
		.slice(0, 3)
		.map((result) => result.title ?? result.slug ?? result.url ?? '')
		.filter(Boolean)
		.map((title) => String(title).replaceAll('|', '\\|'));
	return titles.length > 0 ? titles.join(' · ') : '—';
}

function formatResultSnippets(results = []) {
	const snippets = results
		.slice(0, 3)
		.map((result) => result.snippet ?? result.excerpt ?? '')
		.filter(Boolean)
		.map((snippet) => String(snippet).replace(/\s+/g, ' ').trim().replaceAll('|', '\\|'));
	return snippets.length > 0 ? snippets.join(' · ') : '—';
}

function formatMilliseconds(value) {
	return Number.isFinite(value) ? `${value.toFixed(1)} ms` : '—';
}

function getBaselineSummary(baseline, key) {
	return baseline?.[key] ?? { resultCount: 0, topResults: [], durationMs: Number.NaN };
}

export function formatBenchmarkReport({
	pagefindVersion,
	currentBytes,
	currentIndexBytes,
	pagefindBytes,
	pagefindInitialTransferBytes,
	pagefindBootstrapBytes,
	pagefindInitMs,
	pagefindFirstResultMs,
	queries,
}) {
	const current = currentIndexBytes ?? {
		total: currentBytes ?? 0,
		posts: currentBytes ?? 0,
		categories: 0,
		quick: 0,
		code: 0,
	};
	const lines = [
		'# Search benchmark',
		'',
		`- Pagefind: ${pagefindVersion}`,
		`- Current post index (\`search.json\`): ${formatBytes(current.posts)} (${current.posts.toLocaleString('en-US')} bytes)`,
		`- Current category indexes: ${formatBytes(current.categories)} (${current.categories.toLocaleString('en-US')} bytes)`,
		`- Current quick index: ${formatBytes(current.quick)} (${current.quick.toLocaleString('en-US')} bytes)`,
		`- Current code index: ${formatBytes(current.code)} (${current.code.toLocaleString('en-US')} bytes)`,
		`- Current JSON indexes total: ${formatBytes(current.total)} (${current.total.toLocaleString('en-US')} bytes)`,
		`- Pagefind output: ${formatBytes(pagefindBytes)} (${pagefindBytes.toLocaleString('en-US')} bytes)`,
		`- Pagefind bootstrap: ${formatBytes(pagefindBootstrapBytes ?? 0)} (${(pagefindBootstrapBytes ?? 0).toLocaleString('en-US')} bytes)`,
		`- Pagefind initial transfer: ${formatBytes(pagefindInitialTransferBytes ?? 0)} (${(pagefindInitialTransferBytes ?? 0).toLocaleString('en-US')} bytes)`,
		`- Pagefind init: ${formatMilliseconds(pagefindInitMs)}`,
		`- Pagefind first result: ${formatMilliseconds(pagefindFirstResultMs)}`,
		'',
		'| Query | Baseline posts | ETF category | Code | Pagefind | Pagefind ETF | Baseline top results | Pagefind top results | Baseline snippets | Pagefind snippets | Baseline ETF snippets | Pagefind ETF snippets | Baseline ms | Pagefind ms | Pagefind ETF ms | Query bytes | ETF bytes |',
		'| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |',
		...queries.map(
			({
				query,
				baseline,
				resultCount,
				pagefindResultCount,
				pagefindCategoryResultCount,
				pagefindDurationMs,
				pagefindCategoryDurationMs,
				transferBytes,
				categoryTransferBytes,
				pagefindTopResults,
				pagefindCategoryTopResults,
			}) => {
				const posts = getBaselineSummary(baseline, 'posts');
				const category = getBaselineSummary(baseline, 'category');
				const code = getBaselineSummary(baseline, 'code');
				const pagefindCount = pagefindResultCount ?? resultCount ?? 0;
				return `| ${query.replaceAll('|', '\\|')} | ${posts.resultCount} | ${category.resultCount} | ${code.resultCount} | ${pagefindCount} | ${pagefindCategoryResultCount ?? 0} | ${formatResultTitles(posts.topResults)} | ${formatResultTitles(pagefindTopResults)} | ${formatResultSnippets(posts.topResults)} | ${formatResultSnippets(pagefindTopResults)} | ${formatResultSnippets(category.topResults)} | ${formatResultSnippets(pagefindCategoryTopResults)} | ${formatMilliseconds(posts.durationMs)} | ${formatMilliseconds(pagefindDurationMs)} | ${formatMilliseconds(pagefindCategoryDurationMs)} | ${(transferBytes ?? 0).toLocaleString('en-US')} | ${(categoryTransferBytes ?? 0).toLocaleString('en-US')} |`;
			},
		),
		'',
		'> Pagefind is limited to `.post-body`, and its unfiltered and ETF-filtered results are compared with the existing post, category, and code indexes. Top-result excerpts are included to compare user-visible snippets; this is not a replacement decision by itself.',
		'> Pagefind 1.5.2 does not provide Korean stemming, so Korean partial-word behavior requires a separate decision.',
	];

	return lines.join('\n');
}

function walkFiles(directory) {
	const files = [];
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const absolutePath = join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...walkFiles(absolutePath));
		} else if (entry.isFile()) {
			files.push({ path: absolutePath, bytes: statSync(absolutePath).size });
		}
	}
	return files;
}

function runPagefind(siteDirectory, outputSubdir) {
	const runner = resolve(process.cwd(), 'node_modules/pagefind/lib/runner/bin.cjs');
	const result = spawnSync(
		process.execPath,
		[
			runner,
			'--site',
			siteDirectory,
			'--output-subdir',
			outputSubdir,
			'--root-selector',
			PAGEFIND_ROOT_SELECTOR,
			'--force-language',
			'ko',
		],
		{
			cwd: process.cwd(),
			encoding: 'utf8',
			stdio: 'inherit',
		},
	);

	if (result.error) throw result.error;
	if (result.status !== 0) {
		throw new Error(`Pagefind exited with status ${result.status ?? 'unknown'}`);
	}
}

function getContentType(path) {
	return (
		{
			'.js': 'text/javascript; charset=utf-8',
			'.json': 'application/json; charset=utf-8',
			'.wasm': 'application/wasm',
			'.html': 'text/html; charset=utf-8',
		}[extname(path)] ?? 'application/octet-stream'
	);
}

export async function initializePagefind(instance) {
	await instance.init();
	// In Node, Pagefind's wrapper resolves init() after creating the fallback
	// instance, while that nested instance is still loading its metadata and
	// WASM. An empty merge-filter option reaches the fallback's readiness
	// probe without loading a query index, filter index, or result fragments.
	await instance.options({ mergeFilter: {} });
}

async function serveDirectory(directory) {
	const root = resolve(directory);
	const traffic = { bytes: 0, requests: 0 };
	const server = createServer((request, response) => {
		try {
			const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
			const requestedPath = decodeURIComponent(requestUrl.pathname);
			const absolutePath = resolve(root, `.${requestedPath}`);
			const relativePath = relative(root, absolutePath);
			if (relativePath.startsWith('..') || relativePath.includes(':')) {
				response.writeHead(403).end();
				return;
			}

			const stats = statSync(absolutePath);
			if (!stats.isFile()) {
				response.writeHead(404).end();
				return;
			}

			const content = readFileSync(absolutePath);
			traffic.requests += 1;
			traffic.bytes += content.byteLength;
			response.writeHead(200, { 'Content-Type': getContentType(absolutePath) });
			response.end(content);
		} catch {
			response.writeHead(404).end();
		}
	});

	await new Promise((resolveServer) => server.listen(0, '127.0.0.1', resolveServer));
	const address = server.address();
	if (!address || typeof address === 'string') {
		server.close();
		throw new Error('Could not determine the Pagefind benchmark server address');
	}

	return {
		baseUrl: `http://127.0.0.1:${address.port}/`,
		traffic,
		close: () =>
			new Promise((resolveServer, reject) =>
				server.close((error) => (error ? reject(error) : resolveServer())),
			),
	};
}

async function getPagefindTopResults(searchResult) {
	const topResults = [];
	for (const result of searchResult.results.slice(0, 3)) {
		try {
			const data = await result.data();
			topResults.push({
				title: data.meta?.title ?? data.url ?? result.id,
				url: data.url,
				snippet: data.plain_excerpt ?? data.excerpt ?? '',
			});
		} catch {
			topResults.push({ title: result.id, url: '', snippet: '' });
		}
	}
	return topResults;
}

async function queryPagefind(outputDirectory, queries) {
	const server = await serveDirectory(outputDirectory);
	try {
		const pagefindModule = await import(
			`${pathToFileURL(join(outputDirectory, 'pagefind.js')).href}?benchmark=${Date.now()}`
		);
		const instance = pagefindModule.createInstance({ basePath: server.baseUrl });
		const initStart = performance.now();
		await initializePagefind(instance);
		const initMs = performance.now() - initStart;
		const initialTransferBytes = server.traffic.bytes;

		const results = [];
		for (const query of queries) {
			const queryStartBytes = server.traffic.bytes;
			const queryStart = performance.now();
			const searchStart = performance.now();
			const searchResult = await instance.search(query);
			const searchDurationMs = performance.now() - searchStart;
			const searchTransferBytes = server.traffic.bytes - queryStartBytes;
			const pagefindTopResults = await getPagefindTopResults(searchResult);
			const pagefindDurationMs = performance.now() - queryStart;
			const transferBytes = server.traffic.bytes - queryStartBytes;

			const categoryStartBytes = server.traffic.bytes;
			const categoryStart = performance.now();
			const categorySearchResult = await instance.search(query, {
				filters: PAGEFIND_CATEGORY_FILTER,
			});
			const categorySearchDurationMs = performance.now() - categoryStart;
			const categorySearchTransferBytes = server.traffic.bytes - categoryStartBytes;
			const pagefindCategoryTopResults = await getPagefindTopResults(categorySearchResult);
			const pagefindCategoryDurationMs = performance.now() - categoryStart;
			const categoryTransferBytes = server.traffic.bytes - categoryStartBytes;

			results.push({
				query,
				resultCount: searchResult.results.length,
				totalResultCount: searchResult.unfilteredResultCount,
				pagefindResultCount: searchResult.results.length,
				pagefindDurationMs,
				searchDurationMs,
				transferBytes,
				searchTransferBytes,
				pagefindTopResults,
				pagefindCategoryResultCount: categorySearchResult.results.length,
				pagefindCategoryDurationMs,
				categorySearchDurationMs,
				categoryTransferBytes,
				categorySearchTransferBytes,
				pagefindCategoryTopResults,
			});
		}
		const firstResult = results[0];
		await instance.destroy();
		return {
			results,
			initialTransferBytes,
			initMs,
			firstResultMs: firstResult ? initMs + firstResult.pagefindDurationMs : Number.NaN,
		};
	} finally {
		await server.close();
	}
}

function loadJsonIndex(siteDirectory, relativePath) {
	const indexPath = join(siteDirectory, relativePath);
	const value = JSON.parse(readFileSync(indexPath, 'utf8'));
	if (!Array.isArray(value)) throw new Error(`검색 인덱스가 배열이 아닙니다: ${relativePath}`);
	return value;
}

function queryBaseline(siteDirectory, queries) {
	const indexes = Object.fromEntries(
		BASELINE_INDEXES.map(({ key, relativePath }) => [
			key,
			loadJsonIndex(siteDirectory, relativePath),
		]),
	);

	return queries.map((query) => {
		const baseline = {};
		for (const { key } of BASELINE_INDEXES) {
			const start = performance.now();
			const results = searchIndexedItems(indexes[key], query);
			baseline[key] = {
				resultCount: results.length,
				topResults: results.slice(0, 5).map(({ item, score, snippet }) => ({
					title: item.t,
					slug: item.s,
					score,
					snippet,
				})),
				durationMs: performance.now() - start,
			};
		}
		return { query, baseline };
	});
}

export async function runSearchBenchmark({
	siteDirectory = resolve(process.cwd(), 'dist'),
	outputSubdir = DEFAULT_PAGEFIND_OUTPUT_SUBDIR,
} = {}) {
	if (!statSync(siteDirectory, { throwIfNoEntry: false })?.isDirectory()) {
		throw new Error(`Build output directory not found: ${siteDirectory}`);
	}

	runPagefind(siteDirectory, outputSubdir);
	const outputDirectory = resolve(siteDirectory, outputSubdir);
	const indexEntries = collectSearchIndexSizes(siteDirectory);
	const currentIndexBytes = getCurrentIndexByteSummary(indexEntries);
	const queries = getBenchmarkQueries();
	const baselineResults = queryBaseline(siteDirectory, queries);
	const pagefind = await queryPagefind(outputDirectory, queries);
	const pagefindEntry = JSON.parse(
		readFileSync(join(outputDirectory, 'pagefind-entry.json'), 'utf8'),
	);
	const pagefindBootstrapBytes = statSync(join(outputDirectory, 'pagefind.js')).size;

	return {
		pagefindVersion: pagefindEntry.version ?? 'unknown',
		currentBytes: currentIndexBytes.total,
		currentIndexBytes,
		pagefindBytes: sumFileSizes(walkFiles(outputDirectory)),
		pagefindBootstrapBytes,
		pagefindInitialTransferBytes: pagefindBootstrapBytes + pagefind.initialTransferBytes,
		pagefindInitMs: pagefind.initMs,
		pagefindFirstResultMs: pagefind.firstResultMs,
		queries: pagefind.results.map((result, index) => ({
			...result,
			baseline: baselineResults[index].baseline,
		})),
		outputDirectory,
	};
}

const currentFile = resolve(fileURLToPath(import.meta.url));
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
	try {
		const result = await runSearchBenchmark({
			siteDirectory: process.argv[2] ? resolve(process.argv[2]) : undefined,
		});
		console.log(formatBenchmarkReport(result));
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	}
}
