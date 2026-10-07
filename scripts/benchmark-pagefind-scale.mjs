import { cpus, tmpdir } from 'node:os';
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fromHtml } from 'hast-util-from-html';
import { buildSyntheticSearchIndex, DEFAULT_SCALE_TARGETS } from './benchmark-search-scale.mjs';
import { runSearchBenchmark } from './benchmark-search.mjs';
import { formatBytes } from './report-search-size.mjs';

function readIndex(path, { allowEmpty = false } = {}) {
	const index = JSON.parse(readFileSync(path, 'utf8'));
	if (!Array.isArray(index) || (!allowEmpty && index.length === 0)) {
		throw new Error(
			`Search index must be ${allowEmpty ? 'an array' : 'a non-empty array'}: ${path}`,
		);
	}
	return index;
}

function getPostHtmlPath(siteDirectory, slug) {
	return join(siteDirectory, 'blog', ...slug.split('/'), 'index.html');
}

function hasPostBody(html) {
	return /class=["'][^"']*\bpost-body\b[^"']*["']/.test(html);
}

export function addUniqueSearchMarker(html, marker) {
	if (typeof marker !== 'string' || !/^[a-z0-9-]+$/i.test(marker)) {
		throw new Error('Synthetic search marker must contain only letters, numbers, and hyphens');
	}
	const tree = fromHtml(html);
	const findPostBody = (node) => {
		if (
			node.type === 'element' &&
			Array.isArray(node.properties?.className) &&
			node.properties.className.includes('post-body')
		) {
			return node;
		}
		for (const child of node.children ?? []) {
			const result = findPostBody(child);
			if (result) return result;
		}
		return null;
	};
	const postBody = findPostBody(tree);
	const endOffset = postBody?.position?.end?.offset;
	if (!postBody || !Number.isInteger(endOffset)) {
		throw new Error('Could not locate the .post-body element to add a synthetic marker');
	}
	const closingTag = `</${postBody.tagName}`;
	const closingTagStart = html.lastIndexOf(closingTag, endOffset);
	if (closingTagStart < 0) throw new Error('Could not locate the closing .post-body tag');
	return `${html.slice(0, closingTagStart)} <span>${marker}</span> ${html.slice(closingTagStart)}`;
}

function writeSyntheticIndexes(sourceDirectory, targetDirectory, sourceItems, targetCount) {
	const syntheticItems = buildSyntheticSearchIndex(sourceItems, targetCount);
	const quickItems = readIndex(join(sourceDirectory, 'search', 'quick.json'));
	const quickBySlug = new Map(quickItems.map((item) => [item.s, item]));
	const searchDirectory = join(sourceDirectory, 'search');
	const categoryIndexes = readdirSync(searchDirectory)
		.filter((fileName) => fileName.endsWith('.json') && fileName !== 'quick.json')
		.map((fileName) => ({
			fileName,
			slugs: new Set(
				readIndex(join(searchDirectory, fileName), { allowEmpty: true }).map((item) => item.s),
			),
		}));

	for (const sourceItem of sourceItems) {
		if (!existsSync(getPostHtmlPath(sourceDirectory, sourceItem.s))) {
			throw new Error(`Built post HTML is missing for search item: ${sourceItem.s}`);
		}
		if (!quickBySlug.has(sourceItem.s)) {
			throw new Error(`Quick search index is missing item: ${sourceItem.s}`);
		}
	}

	const rootHtml = join(targetDirectory, 'blog');
	mkdirSync(rootHtml, { recursive: true });
	for (let index = 0; index < syntheticItems.length; index += 1) {
		const sourceItem = sourceItems[index % sourceItems.length];
		const sourceHtmlPath = getPostHtmlPath(sourceDirectory, sourceItem.s);
		const sourceHtml = readFileSync(sourceHtmlPath, 'utf8');
		if (!hasPostBody(sourceHtml)) {
			throw new Error(`Post HTML has no .post-body content: ${sourceItem.s}`);
		}
		const destinationHtml = getPostHtmlPath(targetDirectory, syntheticItems[index].s);
		mkdirSync(join(destinationHtml, '..'), { recursive: true });
		const marker = `search-scale-marker-${String(index + 1).padStart(5, '0')}`;
		writeFileSync(destinationHtml, addUniqueSearchMarker(sourceHtml, marker));
	}

	writeFileSync(join(targetDirectory, 'search.json'), JSON.stringify(syntheticItems));
	const syntheticQuickItems = syntheticItems.map((item, index) => {
		const sourceItem = sourceItems[index % sourceItems.length];
		return { ...quickBySlug.get(sourceItem.s), s: item.s };
	});
	const targetSearchDirectory = join(targetDirectory, 'search');
	mkdirSync(targetSearchDirectory, { recursive: true });
	writeFileSync(join(targetSearchDirectory, 'quick.json'), JSON.stringify(syntheticQuickItems));
	for (const category of categoryIndexes) {
		const categoryItems = syntheticItems.filter((_, index) =>
			category.slugs.has(sourceItems[index % sourceItems.length].s),
		);
		writeFileSync(join(targetSearchDirectory, category.fileName), JSON.stringify(categoryItems));
	}
	copyFileSync(
		join(sourceDirectory, 'code-search.json'),
		join(targetDirectory, 'code-search.json'),
	);

	const copiedHtmlCount = syntheticItems.length;
	const copiedEtf = syntheticItems.find((item, index) =>
		categoryIndexes.some(
			(category) =>
				category.fileName === 'etf.json' &&
				category.slugs.has(sourceItems[index % sourceItems.length].s),
		),
	);
	if (!copiedEtf) throw new Error('Synthetic corpus contains no ETF post for filtered comparison');
	const copiedEtfHtml = readFileSync(getPostHtmlPath(targetDirectory, copiedEtf.s), 'utf8');
	if (!/data-pagefind-filter=["']category:ETF["']/.test(copiedEtfHtml)) {
		throw new Error(`ETF source page has no Pagefind ETF filter: ${copiedEtf.s}`);
	}
	if (syntheticItems.length !== targetCount || copiedHtmlCount !== targetCount) {
		throw new Error(`Expected ${targetCount} synthetic HTML pages, created ${copiedHtmlCount}`);
	}

	return { sourceCount: sourceItems.length, targetCount, copiedHtmlCount };
}

function formatPagefindMeasurements(benchmark) {
	const lines = [
		`- Pagefind: ${benchmark.pagefindVersion}`,
		`- Current JSON indexes: ${formatBytes(benchmark.currentIndexBytes.total)} (${benchmark.currentIndexBytes.total.toLocaleString('en-US')} bytes)`,
		`- Pagefind output: ${formatBytes(benchmark.pagefindBytes)} (${benchmark.pagefindBytes.toLocaleString('en-US')} bytes)`,
		`- Pagefind bootstrap: ${formatBytes(benchmark.pagefindBootstrapBytes)}; initial transfer estimate: ${formatBytes(benchmark.pagefindInitialTransferBytes)}`,
		`- Pagefind initialization: ${benchmark.pagefindInitMs.toFixed(1)} ms; init + first query: ${benchmark.pagefindFirstResultMs.toFixed(1)} ms`,
		'- JSON timing is resident in-memory ranking/snippet work. Pagefind timing includes its query and fetching details for the first three results; these timings have different boundaries.',
		'',
		'| Query | JSON hits | ETF JSON hits | Pagefind hits | Pagefind ETF hits | JSON in-memory | Pagefind query + top-three details | ETF Pagefind query + details | Pagefind query transfer | ETF transfer |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
		...benchmark.queries.map(
			({
				query,
				baseline,
				pagefindResultCount,
				pagefindCategoryResultCount,
				pagefindDurationMs,
				pagefindCategoryDurationMs,
				transferBytes,
				categoryTransferBytes,
			}) =>
				`| ${query.replaceAll('|', '\\|')} | ${baseline.posts.resultCount} | ${baseline.category.resultCount} | ${pagefindResultCount} | ${pagefindCategoryResultCount} | ${baseline.posts.durationMs.toFixed(1)} ms | ${pagefindDurationMs.toFixed(1)} ms | ${pagefindCategoryDurationMs.toFixed(1)} ms | ${transferBytes.toLocaleString('en-US')} B | ${categoryTransferBytes.toLocaleString('en-US')} B |`,
		),
	];
	return lines.join('\n');
}

export function createSyntheticPagefindSite({
	sourceDirectory = resolve(process.cwd(), 'dist'),
	targetDirectory,
	targetCount,
} = {}) {
	if (!targetDirectory) throw new Error('A target directory is required');
	if (!Number.isInteger(targetCount) || targetCount < 1) {
		throw new Error('Target count must be a positive integer');
	}
	const resolvedSource = resolve(sourceDirectory);
	const resolvedTarget = resolve(targetDirectory);
	if (!existsSync(resolvedSource))
		throw new Error(`Build output directory not found: ${resolvedSource}`);
	const sourceToTarget = relative(resolvedSource, resolvedTarget);
	const targetToSource = relative(resolvedTarget, resolvedSource);
	const isWithin = (path) =>
		path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path));
	if (isWithin(sourceToTarget) || isWithin(targetToSource)) {
		throw new Error('Synthetic target must not overlap the source build directory');
	}
	if (existsSync(resolvedTarget))
		throw new Error(`Synthetic target directory already exists: ${resolvedTarget}`);
	const sourceItems = readIndex(join(resolvedSource, 'search.json'));
	if (targetCount < sourceItems.length) {
		throw new Error(`Target count must be at least the source count (${sourceItems.length})`);
	}
	mkdirSync(resolvedTarget, { recursive: true });
	return writeSyntheticIndexes(resolvedSource, resolvedTarget, sourceItems, targetCount);
}

export async function runPagefindScaleBenchmark({
	sourceDirectory = resolve(process.cwd(), 'dist'),
	targets = DEFAULT_SCALE_TARGETS,
	generatedAt = new Date().toISOString(),
} = {}) {
	const sourceItems = readIndex(join(sourceDirectory, 'search.json'));
	const scaleTargets = [...new Set(targets)]
		.filter((count) => count > sourceItems.length)
		.sort((a, b) => a - b);
	if (scaleTargets.length === 0) {
		throw new Error(
			`Pagefind scale targets must be larger than the source count (${sourceItems.length})`,
		);
	}

	const tempRoot = mkdtempSync(join(tmpdir(), 'astra-pagefind-scale-'));
	const reports = [];
	try {
		for (const targetCount of scaleTargets) {
			const siteDirectory = join(tempRoot, `site-${targetCount}`);
			const created = createSyntheticPagefindSite({
				sourceDirectory,
				targetDirectory: siteDirectory,
				targetCount,
			});
			const benchmark = await runSearchBenchmark({ siteDirectory });
			reports.push({ targetCount, created, benchmark });
		}
	} finally {
		rmSync(tempRoot, { recursive: true, force: true });
	}

	const environment = `${process.version}, ${process.platform}/${process.arch}, ${cpus()[0]?.model ?? 'unknown'}`;
	return [
		'# Synthetic Pagefind scale benchmark',
		'',
		`- Generated: ${generatedAt}`,
		`- Source corpus: ${sourceItems.length.toLocaleString('en-US')} built posts`,
		`- Runtime: ${environment}`,
		'- Each scale copies source HTML into unique blog routes, preserves `.post-body` text and Pagefind category filters, and appends one unique non-query token per page so Pagefind does not collapse duplicate documents.',
		'- Synthetic measurements compare index sizes, initialization, query time, and ETF-filtered results; repeated source text does not model new content quality or language distribution.',
		'',
		...reports.flatMap(({ targetCount, created, benchmark }) => [
			`## ${targetCount.toLocaleString('en-US')} documents (${created.copiedHtmlCount.toLocaleString('en-US')} HTML pages)`,
			'',
			formatPagefindMeasurements(benchmark),
		]),
	].join('\n');
}

const currentFile = resolve(fileURLToPath(import.meta.url));
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
	try {
		const targetArgument = process.argv[2];
		const targets = targetArgument
			? targetArgument.split(',').map((value) => Number(value.trim()))
			: undefined;
		console.log(await runPagefindScaleBenchmark({ targets }));
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	}
}
