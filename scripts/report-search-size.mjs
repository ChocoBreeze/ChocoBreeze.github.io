import { appendFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CORE_INDEX_FILES = [
	{ label: '전체 검색', relativePath: 'search.json' },
	{ label: '빠른 검색', relativePath: 'search/quick.json' },
	{ label: '코드 검색', relativePath: 'code-search.json' },
];

export function getSearchIndexFiles(distDir) {
	const categoryDir = join(distDir, 'search');
	const categoryFiles = readdirSync(categoryDir, { withFileTypes: true })
		.filter(
			(entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'quick.json',
		)
		.sort((a, b) => a.name.localeCompare(b.name, 'en'))
		.map((entry) => ({
			label: `카테고리: ${entry.name.replace(/\.json$/, '')}`,
			relativePath: join('search', entry.name),
		}));

	return [...CORE_INDEX_FILES, ...categoryFiles];
}

export function collectSearchIndexSizes(distDir) {
	return getSearchIndexFiles(distDir).map(({ label, relativePath }) => {
		const absolutePath = join(distDir, relativePath);
		let bytes;
		try {
			bytes = statSync(absolutePath).size;
		} catch {
			throw new Error(`검색 인덱스 산출물이 없습니다: ${relativePath}`);
		}

		return { label, relativePath, bytes };
	});
}

export function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} B`;

	const units = ['KiB', 'MiB', 'GiB'];
	let value = bytes;
	let unitIndex = -1;
	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex += 1;
	}

	return `${value.toFixed(2)} ${units[unitIndex]}`;
}

export function formatSearchSizeReport(entries) {
	const lines = [
		'| 인덱스 | 경로 | 크기 | 바이트 |',
		'| --- | --- | ---: | ---: |',
		...entries.map(
			({ label, relativePath, bytes }) =>
				`| ${label} | \`${relativePath.replaceAll('\\', '/')}\` | ${formatBytes(bytes)} | ${bytes.toLocaleString('en-US')} |`,
		),
	];

	return lines.join('\n');
}

export function reportSearchIndexSizes(distDir = resolve(process.cwd(), 'dist')) {
	const entries = collectSearchIndexSizes(distDir);
	const report = formatSearchSizeReport(entries);
	console.log(`Search index sizes\n\n${report}`);

	const summaryPath = process.env.GITHUB_STEP_SUMMARY;
	if (summaryPath) {
		appendFileSync(summaryPath, `### Search index sizes\n\n${report}\n\n`);
	}

	return entries;
}

const currentFile = resolve(fileURLToPath(import.meta.url));
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
	try {
		reportSearchIndexSizes(process.argv[2] ? resolve(process.argv[2]) : undefined);
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	}
}
