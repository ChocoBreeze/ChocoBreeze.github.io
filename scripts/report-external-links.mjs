// Checks every external link in post sources and lists the broken, moved and
// uncertain ones (plan 38). Manual only: it sends real requests, so it is not
// part of CI. It never fails on what it finds: exit code 1 means bad options.

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	FRONTMATTER_REGEX,
	normalizeCategoryValue,
	parseFrontmatterListField,
} from './lib/content-rules.mjs';
import { checkUrls, extractExternalLinks, toRequestUrl } from './lib/external-links.mjs';

const DEFAULT_CONTENT_DIR = path.resolve('src/content/blog');
const KIND_LABELS = {
	broken: '끊김',
	moved: '다른 사이트로 이동',
	check: '확인 필요',
};

function walkMarkdownFiles(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) return walkMarkdownFiles(entryPath);
		return /\.mdx?$/.test(entry.name) ? [entryPath] : [];
	});
}

/** Maps each requested URL to the post lines that use it. */
export function collectLinkUsages(contentDir, category) {
	const usages = new Map();

	for (const filePath of walkMarkdownFiles(contentDir).sort()) {
		const content = readFileSync(filePath, 'utf8');
		if (category) {
			const frontmatter = content.match(FRONTMATTER_REGEX)?.[1] ?? '';
			const [first] = parseFrontmatterListField(frontmatter, 'categories');
			if (!first || normalizeCategoryValue(first) !== category) continue;
		}

		const file = path.relative(contentDir, filePath).replaceAll('\\', '/');
		for (const { url, line } of extractExternalLinks(content)) {
			const requestUrl = toRequestUrl(url);
			if (!usages.has(requestUrl)) usages.set(requestUrl, []);
			usages.get(requestUrl).push(`${file}:${line}`);
		}
	}

	return usages;
}

function describeResult(result) {
	if (result.errorCode) return result.errorCode;
	return result.kind === 'moved' ? `${result.status} → ${result.finalUrl}` : String(result.status);
}

export function formatReport(results, usages) {
	const counts = { ok: 0, moved: 0, check: 0, broken: 0 };
	for (const result of results) counts[result.kind] += 1;

	const lines = [
		`외부 링크 리포트: 주소 ${results.length}개 (사용 ${[...usages.values()].flat().length}곳)`,
	];
	for (const kind of ['broken', 'moved', 'check']) {
		const entries = results
			.filter((result) => result.kind === kind)
			.sort((a, b) => a.url.localeCompare(b.url));
		lines.push('', `## ${KIND_LABELS[kind]}: ${entries.length}개`);
		for (const result of entries) {
			lines.push(`  [${describeResult(result)}] ${result.url}`);
			for (const usage of usages.get(result.url) ?? []) lines.push(`      ${usage}`);
		}
	}
	lines.push(
		'',
		`요약: 정상 ${counts.ok}, 이동 ${counts.moved}, 확인 필요 ${counts.check}, 끊김 ${counts.broken}`,
	);
	return lines.join('\n');
}

export function parseArgs(argv) {
	const options = { json: false, category: undefined };
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === '--json') {
			options.json = true;
		} else if (arg === '--category') {
			const value = argv[++index];
			if (!value) throw new Error('--category에는 카테고리 이름을 지정하세요.');
			options.category = normalizeCategoryValue(value);
		} else {
			throw new Error(`알 수 없는 옵션입니다: ${arg}`);
		}
	}
	return options;
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
	try {
		const options = parseArgs(process.argv.slice(2));
		const contentDir = process.env.ASTRA_BLOG_CONTENT_DIR
			? path.resolve(process.env.ASTRA_BLOG_CONTENT_DIR)
			: DEFAULT_CONTENT_DIR;
		const usages = collectLinkUsages(contentDir, options.category);
		const total = usages.size;
		console.error(
			`외부 링크 ${total}개를 확인합니다. 사이트마다 순서대로 요청하므로 수 분이 걸릴 수 있습니다.`,
		);

		const results = await checkUrls([...usages.keys()], {
			onResult: (_, done) => {
				if (done % 50 === 0 || done === total) console.error(`  ${done}/${total}`);
			},
		});

		if (options.json) {
			const withUsages = results.map((result) => ({ ...result, usages: usages.get(result.url) }));
			console.log(JSON.stringify(withUsages, null, 2));
		} else {
			console.log(formatReport(results, usages));
		}
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	}
}
