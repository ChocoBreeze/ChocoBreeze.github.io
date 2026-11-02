// Lists ETF and Reports posts whose freshness dates are older than their
// limits, so the manual re-verification of plans 17 and 19 has a work queue.
// It never fails on stale data: exit code 1 means only invalid options.

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	FIELD_MAX_AGE_DAYS,
	FRESHNESS_MAX_AGE_DAYS,
	collectStaleFields,
} from '../src/lib/contentFreshness.mjs';
import {
	FRONTMATTER_REGEX,
	isDraftFrontmatter,
	normalizeCategoryValue,
	parseFrontmatterFields,
	parseFrontmatterListField,
	stripQuotes,
	stripYamlComment,
} from './lib/content-rules.mjs';

const DEFAULT_CONTENT_DIR = path.resolve('src/content/blog');
const DATE_FIELDS = ['dataAsOf', 'verifiedDate', ...Object.keys(FIELD_MAX_AGE_DAYS)];
const REFERENCE_GROUP = 'reference';
const GROUP_LABELS = {
	[REFERENCE_GROUP]: '기준일(dataAsOf ?? verifiedDate)',
	aumAsOf: 'AUM 기준일(aumAsOf)',
	yieldAsOf: '분배율 기준일(yieldAsOf)',
	expenseRatioAsOf: '보수율 기준일(expenseRatioAsOf)',
};

function walkMarkdownFiles(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) return walkMarkdownFiles(entryPath);
		return /\.mdx?$/.test(entry.name) ? [entryPath] : [];
	});
}

function readScalar(fields, name) {
	const field = fields.get(name);
	if (!field) return undefined;
	const value = stripQuotes(stripYamlComment(field.rawValue).trim()).trim();
	return value && !['null', '~'].includes(value.toLowerCase()) ? value : undefined;
}

export function collectStaleReport(contentDir, now, maxAgeOverride) {
	const groups = Object.fromEntries(Object.keys(GROUP_LABELS).map((key) => [key, []]));
	const missingReference = [];
	let checkedPosts = 0;

	for (const filePath of walkMarkdownFiles(contentDir).sort()) {
		const frontmatter = readFileSync(filePath, 'utf8').match(FRONTMATTER_REGEX)?.[1];
		if (!frontmatter || isDraftFrontmatter(frontmatter)) continue;

		const [firstCategory] = parseFrontmatterListField(frontmatter, 'categories');
		const category = firstCategory ? normalizeCategoryValue(firstCategory) : undefined;
		const fields = parseFrontmatterFields(frontmatter);
		const dates = Object.fromEntries(DATE_FIELDS.map((name) => [name, readScalar(fields, name)]));
		const result = collectStaleFields({ category, ...dates }, now, maxAgeOverride);
		if (!result) continue;

		checkedPosts += 1;
		const post = {
			file: path.relative(contentDir, filePath).replaceAll('\\', '/'),
			category,
			ticker: readScalar(fields, 'ticker'),
		};
		if (result.missingReference) missingReference.push(post);
		for (const entry of result.stale) {
			const group = entry.field in FIELD_MAX_AGE_DAYS ? entry.field : REFERENCE_GROUP;
			groups[group].push({ ...post, ...entry });
		}
	}

	for (const entries of Object.values(groups)) {
		entries.sort((a, b) => b.ageDays - a.ageDays || a.file.localeCompare(b.file));
	}

	return { now: new Date(now).toISOString(), checkedPosts, groups, missingReference };
}

function getGroupLimit(group, maxAgeOverride) {
	if (maxAgeOverride !== undefined) return maxAgeOverride;
	if (group === REFERENCE_GROUP) return Math.max(...Object.values(FRESHNESS_MAX_AGE_DAYS));
	return FIELD_MAX_AGE_DAYS[group];
}

function formatDate(value) {
	return new Date(value).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
}

export function formatStaleReport(report, maxAgeOverride) {
	const lines = [
		`기준일 경과 리포트 (기준 ${formatDate(report.now)}, ETF·Reports ${report.checkedPosts}편)`,
	];

	for (const [group, entries] of Object.entries(report.groups)) {
		const limit = getGroupLimit(group, maxAgeOverride);
		lines.push('', `## ${GROUP_LABELS[group]}: ${limit}일 초과 ${entries.length}편`);
		for (const entry of entries) {
			const ticker = entry.ticker ? `${entry.ticker}  ` : '';
			lines.push(`  ${entry.ageDays}일  ${formatDate(entry.date)}  ${ticker}${entry.file}`);
		}
	}

	lines.push('', `## 기준일 없음: ${report.missingReference.length}편`);
	for (const post of report.missingReference) {
		lines.push(`  ${post.file}`);
	}

	return lines.join('\n');
}

export function parseArgs(argv) {
	const options = { json: false, now: new Date(), maxAgeOverride: undefined };

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === '--json') {
			options.json = true;
		} else if (arg === '--days') {
			const days = Number(argv[++index]);
			if (!Number.isInteger(days) || days < 0) {
				throw new Error('--days에는 0 이상의 정수를 지정하세요.');
			}
			options.maxAgeOverride = days;
		} else if (arg === '--now') {
			const now = new Date(argv[++index]);
			if (Number.isNaN(now.getTime())) {
				throw new Error('--now에는 ISO 8601 날짜를 지정하세요.');
			}
			options.now = now;
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
		const report = collectStaleReport(contentDir, options.now, options.maxAgeOverride);
		console.log(
			options.json
				? JSON.stringify(report, null, 2)
				: formatStaleReport(report, options.maxAgeOverride),
		);
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	}
}
