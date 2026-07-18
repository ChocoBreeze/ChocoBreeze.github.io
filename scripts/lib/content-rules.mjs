// Pure, filesystem-independent content-check rules.
//
// Everything here is deterministic string/data logic with no I/O, so it can be
// unit-tested in isolation (see scripts/test/content-rules.test.mjs) and reused
// by scripts/check-content.mjs, which owns file walking and reporting.

import path from 'node:path';

export const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
export const MAX_FUTURE_DAYS = 370;
export const MAX_PAST_YEARS = 10;
export const MAX_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 180;
export const UNSAFE_SLUG_REGEX = /[\s\\?#]/;
export const PUB_DATE_ISO_REGEX =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export const KNOWN_CATEGORIES = new Set([
	'ETF',
	'Economics',
	'Semiconductor',
	'Computer Science',
	'Programming',
	'Problem_Solving',
	'Reports',
	'Market Brief',
]);

export const CATEGORY_ALIASES = new Map([
	['report', 'Reports'],
	['reports', 'Reports'],
	['problem solving', 'Problem_Solving'],
	['problem_solving', 'Problem_Solving'],
	['computer science', 'Computer Science'],
	['cs', 'Computer Science'],
	['market brief', 'Market Brief'],
	['market_brief', 'Market Brief'],
	['us market brief', 'Market Brief'],
	['semiconductor', 'Semiconductor'],
	['programming', 'Programming'],
	['economics', 'Economics'],
	['economic', 'Economics'],
	['economy', 'Economics'],
	['macro', 'Economics'],
	['macroeconomics', 'Economics'],
	['etf', 'ETF'],
]);

export const MARKDOWN_LINK_REGEX = /!?\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
export const MARKDOWN_IMAGE_REGEX = /!\[([^\]]*)]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

export const ABSOLUTE_PATH_PATTERNS = [
	{
		label: 'Windows absolute path',
		regex: /(^|[\s("'`])(?:[A-Za-z]:\\|\\\\[A-Za-z0-9._ -]+\\[A-Za-z0-9._ -]+)/m,
	},
	{
		label: 'Unix absolute path',
		regex: /(^|[\s("'`])(?:\/Users\/|\/home\/|\/var\/|\/etc\/|\/opt\/|\/tmp\/)/m,
	},
	{
		label: 'file URI',
		regex: /file:\/\//i,
	},
];

export const SECRET_PATTERNS = [
	{
		label: 'OpenAI API key assignment',
		regex: /OPENAI_API_KEY\s*=\s*([^\s"']+)/,
		isAllowedMatch: (match) => match[1].includes('...') || match[1].includes('<'),
	},
	{
		label: 'AWS access key',
		regex: /\bAKIA[0-9A-Z]{16}\b/,
	},
	{
		label: 'Bearer token with OpenAI-style key',
		regex: /Bearer\s+(sk-[A-Za-z0-9_-]{20,})/,
	},
	{
		label: 'Quoted OpenAI-style key',
		regex: /["'](sk-[A-Za-z0-9_-]{20,})["']/,
	},
];

export const WARNING_PATTERNS = [
	{
		label: 'Placeholder API key example',
		regex: /OPENAI_API_KEY\s*=\s*sk-\.\.\./,
	},
	{
		label: 'Temporary hosted asset URL',
		regex: /ppl-ai-code-interpreter-files\.s3\.amazonaws\.com/i,
	},
	{
		label: 'Plain HTTP link',
		regex: /(?<![`"'])http:\/\/[^\s)>"']+/i,
	},
];

export const UNESCAPED_DOLLAR_REGEX = /(?<!\\)\$/g;
export const UNESCAPED_TILDE_REGEX = /(?<!\\)~/g;
// $ and ~ are also legitimate remark-math / code syntax (LeetCode complexity notation,
// `HEAD~1`, etc.) in the Computing categories, so this check only runs where $ and ~
// are essentially always plain-text currency/date ranges: the Finance categories.
export const FINANCE_CATEGORIES_FOR_DELIMITER_CHECK = new Set([
	'ETF',
	'Reports',
	'Market Brief',
	'Economics',
]);

export function getLineNumber(content, index) {
	return content.slice(0, index).split(/\r?\n/).length;
}

export function findAllMatches(content, pattern) {
	const regex = new RegExp(
		pattern.source,
		pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`,
	);
	return Array.from(content.matchAll(regex));
}

export function parseFrontmatterFields(frontmatter) {
	const fields = new Map();

	for (const match of frontmatter.matchAll(/^([A-Za-z][A-Za-z0-9_-]*):[ \t]*(.*)$/gm)) {
		fields.set(match[1], {
			rawValue: match[2].trim(),
			index: match.index ?? 0,
		});
	}

	return fields;
}

export function stripQuotes(value) {
	return value.replace(/^['"]|['"]$/g, '');
}

export function parseFrontmatterListValue(rawValue) {
	const value = rawValue.trim();
	if (!value) {
		return [];
	}

	if (value.startsWith('[') && value.endsWith(']')) {
		return value
			.slice(1, -1)
			.split(',')
			.map((item) => stripQuotes(item.trim()))
			.filter(Boolean);
	}

	return [stripQuotes(value).trim()].filter(Boolean);
}

export function normalizeCategoryValue(category) {
	const normalized = category.trim().toLowerCase();
	return CATEGORY_ALIASES.get(normalized) ?? category.trim();
}

export function isKnownCategory(category) {
	return KNOWN_CATEGORIES.has(normalizeCategoryValue(category));
}

export function isValidDateFieldFormat(rawValue) {
	return PUB_DATE_ISO_REGEX.test(stripQuotes(rawValue));
}

export function slugifyPathSegment(segment) {
	return segment
		.trim()
		.toLowerCase()
		.replace(/\.[ \t]+/g, '-')
		.replace(/[()[\]{}]/g, '')
		.replace(/[&+]/g, '-')
		.replace(/[^\p{L}\p{N}_-]+/gu, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

export function getComparableLinkTarget(href) {
	try {
		return decodeURIComponent(href.split(/[?#]/, 1)[0]);
	} catch {
		return href.split(/[?#]/, 1)[0];
	}
}

export function normalizeRoutePath(routePath) {
	const withoutHashOrQuery = getComparableLinkTarget(routePath);
	const withLeadingSlash = withoutHashOrQuery.startsWith('/')
		? withoutHashOrQuery
		: `/${withoutHashOrQuery}`;
	return withLeadingSlash.replace(/\/+$/g, '') || '/';
}

export function isExternalOrAnchorLink(href) {
	return href.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//');
}

export function shouldCheckInternalLink(href) {
	if (isExternalOrAnchorLink(href)) {
		return false;
	}

	const target = getComparableLinkTarget(href);
	return target.startsWith('/') || target.startsWith('.') || path.extname(target).length > 0;
}

export function stripCodeBlocks(content) {
	return content.replace(/```[\s\S]*?```/g, (match) => match.replace(/[^\n]/g, ''));
}

export function stripInlineCode(content) {
	return content.replace(/`[^`\n]*`/g, (match) => match.replace(/[^\n]/g, ''));
}

export function getPrimaryCategory(content) {
	const frontmatterMatch = content.match(FRONTMATTER_REGEX);
	if (!frontmatterMatch) {
		return undefined;
	}

	const categoryField = parseFrontmatterFields(frontmatterMatch[1]).get('categories');
	if (!categoryField) {
		return undefined;
	}

	const [firstCategory] = parseFrontmatterListValue(categoryField.rawValue);
	return firstCategory ? normalizeCategoryValue(firstCategory) : undefined;
}

// Returns true when a single line has an odd number of unescaped `**` markers,
// ignoring horizontal-rule lines made of three or more asterisks.
export function hasUnbalancedBold(line) {
	if (/^\s*\*{3,}\s*$/.test(line)) {
		return false;
	}

	const boldMarkerMatches = line.match(/(?<!\\)\*\*/g) ?? [];
	return boldMarkerMatches.length % 2 !== 0;
}

// Counts unescaped `$` and `~` on a line after removing block math (`$$...$$`)
// and strikethrough (`~~...~~`) spans, which are the intentional uses.
export function countMathDelimiters(line) {
	const sanitizedLine = line.replace(/\$\$[^$]*\$\$/g, '').replace(/~~[^~]*~~/g, '');
	return {
		dollar: (sanitizedLine.match(UNESCAPED_DOLLAR_REGEX) ?? []).length,
		tilde: (sanitizedLine.match(UNESCAPED_TILDE_REGEX) ?? []).length,
	};
}
