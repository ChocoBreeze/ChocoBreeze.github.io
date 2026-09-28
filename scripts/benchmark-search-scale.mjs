import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { searchIndexedItems } from '../src/lib/searchRanking.mjs';
import { getBenchmarkQueries } from './benchmark-search.mjs';
import { formatBytes } from './report-search-size.mjs';

export const DEFAULT_SCALE_TARGETS = [1000, 2000];
export const DEFAULT_SCALE_ITERATIONS = 10;

export function buildSyntheticSearchIndex(sourceItems, targetCount) {
	if (!Array.isArray(sourceItems) || sourceItems.length === 0) {
		throw new Error('Source search index must contain at least one item');
	}
	if (!Number.isInteger(targetCount) || targetCount < sourceItems.length) {
		throw new Error(`Target count must be an integer >= ${sourceItems.length}`);
	}

	const usedSlugs = new Set();
	for (const item of sourceItems) {
		if (typeof item?.s !== 'string' || usedSlugs.has(item.s)) {
			throw new Error('Source search index must have unique string slugs');
		}
		usedSlugs.add(item.s);
	}

	return Array.from({ length: targetCount }, (_, index) => {
		const sourceItem = sourceItems[index % sourceItems.length];
		const replica = Math.floor(index / sourceItems.length);
		if (replica === 0) return { ...sourceItem };
		let slug = `${sourceItem.s}--scale-${replica}`;
		let collision = 1;
		while (usedSlugs.has(slug)) {
			slug = `${sourceItem.s}--scale-${replica}-${collision}`;
			collision += 1;
		}
		usedSlugs.add(slug);
		return {
			...sourceItem,
			s: slug,
		};
	});
}

export function getPercentile(samples, percentile) {
	if (!Array.isArray(samples) || samples.length === 0) return Number.NaN;
	if (!Number.isFinite(percentile) || percentile < 0 || percentile > 100) {
		throw new Error('Percentile must be between 0 and 100');
	}
	const ordered = [...samples].sort((a, b) => a - b);
	const index = Math.max(0, Math.ceil((percentile / 100) * ordered.length) - 1);
	return ordered[index];
}

export function getScaleTargets(sourceCount, targets = DEFAULT_SCALE_TARGETS) {
	if (!Number.isInteger(sourceCount) || sourceCount < 1) {
		throw new Error('Source count must be a positive integer');
	}
	if (!Array.isArray(targets) || targets.some((count) => !Number.isInteger(count) || count < 1)) {
		throw new Error('Scale targets must be positive integers');
	}
	return [...new Set([sourceCount, ...targets.filter((count) => count > sourceCount)])].sort(
		(a, b) => a - b,
	);
}

function measureDistribution(run, iterations) {
	for (let warmup = 0; warmup < Math.min(2, iterations); warmup += 1) run();
	const samples = [];
	for (let sample = 0; sample < iterations; sample += 1) {
		const start = performance.now();
		run();
		samples.push(performance.now() - start);
	}
	return {
		p50Ms: getPercentile(samples, 50),
		p95Ms: getPercentile(samples, 95),
	};
}

export function measureScaleIndex(items, queries, iterations = DEFAULT_SCALE_ITERATIONS) {
	if (!Array.isArray(items) || items.length === 0) throw new Error('Index must contain items');
	if (!Array.isArray(queries) || queries.length === 0) throw new Error('Queries must not be empty');
	if (!Number.isInteger(iterations) || iterations < 1) {
		throw new Error('Iterations must be a positive integer');
	}

	const json = JSON.stringify(items);
	const jsonBytes = Buffer.byteLength(json);
	const gzipBytes = gzipSync(json, { level: 9 }).byteLength;
	const parse = measureDistribution(() => JSON.parse(json), iterations);
	const coldSearchStart = performance.now();
	searchIndexedItems(items, queries[0]);
	const coldFirstSearchMs = performance.now() - coldSearchStart;
	const queryMetrics = queries.map((query) => {
		let results = [];
		const timing = measureDistribution(() => {
			results = searchIndexedItems(items, query);
		}, iterations);
		return {
			query,
			resultCount: results.length,
			topSlugs: results.slice(0, 3).map(({ item }) => item.s),
			...timing,
		};
	});

	return {
		itemCount: items.length,
		jsonBytes,
		gzipBytes,
		parse,
		coldFirstSearchMs,
		queries: queryMetrics,
	};
}

export function formatScaleBenchmarkReport({
	sourceCount,
	iterations,
	generatedAt,
	environment,
	scales,
}) {
	const lines = [
		'# Synthetic search scale benchmark',
		'',
		`- Generated: ${generatedAt}`,
		`- Source posts: ${sourceCount.toLocaleString('en-US')}`,
		`- Warm-up runs per measurement: ${Math.min(2, iterations)}`,
		`- Timed runs per measurement: ${iterations}`,
		`- Percentile: nearest-rank over ${iterations} timed runs; ${iterations < 30 ? 'small-sample p95 is exploratory; use 30 or more runs for tuning decisions.' : '30 or more runs support local tuning comparisons.'}`,
		`- Runtime: Node ${environment.node}, ${environment.platform}/${environment.arch}`,
		`- CPU: ${environment.cpu} (${environment.logicalCores} logical cores)`,
		'- Synthetic records round-robin the built post index and receive unique slugs; field text and category distribution are retained.',
		'- Gzip uses local level 9 as a comparable compressed-size estimate; it is not a measurement of GitHub Pages transfer encoding.',
		'',
		'## Index size and JSON parse',
		'',
		'| Documents | JSON bytes | Gzip estimate | Parse p50 | Parse p95 | Cold first search |',
		'| ---: | ---: | ---: | ---: | ---: | ---: |',
		...scales.map(
			({ itemCount, jsonBytes, gzipBytes, parse, coldFirstSearchMs }) =>
				`| ${itemCount.toLocaleString('en-US')} | ${jsonBytes.toLocaleString('en-US')} (${formatBytes(jsonBytes)}) | ${gzipBytes.toLocaleString('en-US')} (${formatBytes(gzipBytes)}) | ${parse.p50Ms.toFixed(2)} ms | ${parse.p95Ms.toFixed(2)} ms | ${coldFirstSearchMs.toFixed(2)} ms |`,
		),
		'',
		'## Search response',
		'',
		'| Documents | Query | Results | Search p50 | Search p95 | Top result slugs |',
		'| ---: | --- | ---: | ---: | ---: | --- |',
		...scales.flatMap(({ itemCount, queries }) =>
			queries.map(
				({ query, resultCount, p50Ms, p95Ms, topSlugs }) =>
					`| ${itemCount.toLocaleString('en-US')} | ${query.replaceAll('|', '\\|')} | ${resultCount} | ${p50Ms.toFixed(2)} ms | ${p95Ms.toFixed(2)} ms | ${topSlugs.join(', ') || '—'} |`,
			),
		),
	];
	return lines.join('\n');
}

export function runSearchScaleBenchmark({
	indexPath = resolve(process.cwd(), 'dist/search.json'),
	targets = DEFAULT_SCALE_TARGETS,
	queries = getBenchmarkQueries(),
	iterations = DEFAULT_SCALE_ITERATIONS,
	generatedAt = new Date().toISOString(),
	environment = {
		node: process.version,
		platform: process.platform,
		arch: process.arch,
		cpu: cpus()[0]?.model ?? 'unknown',
		logicalCores: cpus().length,
	},
} = {}) {
	const sourceItems = JSON.parse(readFileSync(indexPath, 'utf8'));
	if (!Array.isArray(sourceItems) || sourceItems.length === 0) {
		throw new Error(`Built post index must be a non-empty array: ${indexPath}`);
	}
	const scaleTargets = getScaleTargets(sourceItems.length, targets);
	const scales = scaleTargets.map((targetCount) =>
		measureScaleIndex(buildSyntheticSearchIndex(sourceItems, targetCount), queries, iterations),
	);
	return formatScaleBenchmarkReport({
		sourceCount: sourceItems.length,
		iterations,
		generatedAt,
		environment,
		scales,
	});
}

const currentFile = resolve(fileURLToPath(import.meta.url));
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
	try {
		const report = runSearchScaleBenchmark({
			indexPath: process.argv[2] ? resolve(process.argv[2]) : undefined,
			iterations: process.argv[3] ? Number(process.argv[3]) : undefined,
		});
		console.log(report);
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	}
}
