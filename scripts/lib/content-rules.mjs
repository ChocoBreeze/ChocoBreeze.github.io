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
export const FRESHNESS_DATE_FIELDS = ['updatedDate', 'verifiedDate', 'dataAsOf'];

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
export const PAGE_ROUTE_EXTENSIONS = new Set([
	'.astro',
	'.html',
	'.markdown',
	'.mdown',
	'.mkdn',
	'.mkd',
	'.mdwn',
	'.md',
	'.mdx',
	'.js',
	'.ts',
]);

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

export function isDraftFrontmatter(frontmatter) {
	const draftField = parseFrontmatterFields(frontmatter).get('draft');
	return draftField
		? stripQuotes(stripYamlComment(draftField.rawValue)).trim().toLowerCase() === 'true'
		: false;
}

export function shouldIndexPostRoute(frontmatter, includeDrafts = true) {
	return includeDrafts || !isDraftFrontmatter(frontmatter);
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

export function stripYamlComment(value) {
	let quote = '';

	for (let index = 0; index < value.length; index += 1) {
		const character = value[index];
		if (quote) {
			if (character === quote && value[index - 1] !== '\\') {
				quote = '';
			}
			continue;
		}

		if (character === '"' || character === "'") {
			quote = character;
			continue;
		}
		if (character === '#' && (index === 0 || /\s/.test(value[index - 1]))) {
			return value.slice(0, index).trim();
		}
	}

	return value.trim();
}

function updateFlowSequenceState(value, state) {
	let depth = state.depth;
	let quote = state.quote;

	for (let index = 0; index < value.length; index += 1) {
		const character = value[index];
		if (quote) {
			if (character === quote && value[index - 1] !== '\\') {
				quote = '';
			}
			continue;
		}

		if (character === '"' || character === "'") {
			quote = character;
			continue;
		}
		if (character === '[') {
			depth += 1;
		} else if (character === ']') {
			depth -= 1;
		}
	}

	return { depth, quote };
}

function parseMultilineFlowValue(frontmatter, field, rawValue) {
	if (!rawValue.trim().startsWith('[')) {
		return null;
	}

	const lines = frontmatter.slice(field.index).split(/\r?\n/);
	const values = [];
	let state = { depth: 0, quote: '' };

	for (let index = 0; index < lines.length; index += 1) {
		const lineValue = index === 0 ? rawValue : stripYamlComment(lines[index]).trim();
		if (index > 0 && !lineValue) {
			continue;
		}

		state = updateFlowSequenceState(lineValue, state);
		values.push(lineValue);
		if (state.depth === 0) {
			return values.join(' ');
		}
	}

	return null;
}

export function parseFrontmatterListField(frontmatter, fieldName) {
	const field = parseFrontmatterFields(frontmatter).get(fieldName);
	if (!field) {
		return [];
	}

	const rawValue = stripYamlComment(field.rawValue);
	const multilineFlowValue = parseMultilineFlowValue(frontmatter, field, rawValue);
	if (multilineFlowValue) {
		return parseFrontmatterListValue(multilineFlowValue);
	}
	if (rawValue && !['null', '~'].includes(rawValue.toLowerCase())) {
		return parseFrontmatterListValue(rawValue);
	}
	if (rawValue) {
		return [];
	}

	const values = [];
	const lines = frontmatter.slice(field.index).split(/\r?\n/).slice(1);
	for (const line of lines) {
		const trimmedLine = line.trim();
		if (!trimmedLine || trimmedLine.startsWith('#')) {
			continue;
		}
		if (/^[A-Za-z][A-Za-z0-9_-]*:[ \t]*/.test(line)) {
			break;
		}

		const itemMatch = line.match(/^[ \t]*-[ \t]*(.*?)\s*$/);
		if (!itemMatch) {
			break;
		}

		const item = stripQuotes(stripYamlComment(itemMatch[1]));
		if (item) {
			values.push(item);
		}
	}

	return values;
}

export function normalizeCategoryValue(category) {
	const normalized = category.trim().toLowerCase();
	return CATEGORY_ALIASES.get(normalized) ?? category.trim();
}

export function isKnownCategory(category) {
	return KNOWN_CATEGORIES.has(normalizeCategoryValue(category));
}

export function isValidCalendarDate(value) {
	const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) {
		return false;
	}

	const [, yearValue, monthValue, dayValue] = match;
	const year = Number(yearValue);
	const month = Number(monthValue);
	const day = Number(dayValue);
	const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
	const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

	return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1];
}

export function isValidDateFieldFormat(rawValue) {
	const value = stripQuotes(rawValue);
	if (!PUB_DATE_ISO_REGEX.test(value) || !isValidCalendarDate(value.slice(0, 10))) {
		return false;
	}

	const timeMatch = value.match(/T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-](\d{2}):(\d{2}))$/);
	if (!timeMatch) {
		return false;
	}

	const [, hourValue, minuteValue, secondValue, timezone, offsetHourValue, offsetMinuteValue] =
		timeMatch;
	const hour = Number(hourValue);
	const minute = Number(minuteValue);
	const second = Number(secondValue);
	if (hour > 23 || minute > 59 || second > 59 || timezone === 'Z') {
		return hour <= 23 && minute <= 59 && second <= 59;
	}

	return Number(offsetHourValue) <= 23 && Number(offsetMinuteValue) <= 59;
}

export function isDataAsOfAfterVerifiedDate(dataAsOf, verifiedDate) {
	const dataAsOfTime = new Date(stripQuotes(dataAsOf)).getTime();
	const verifiedDateTime = new Date(stripQuotes(verifiedDate)).getTime();

	if (Number.isNaN(dataAsOfTime) || Number.isNaN(verifiedDateTime)) {
		return false;
	}

	return dataAsOfTime > verifiedDateTime;
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

export function hasTrailingSlash(routePath) {
	const target = getComparableLinkTarget(routePath);
	return target.length > 1 && target.endsWith('/');
}

export function isAstroPublicPagePath(relativePagePath) {
	const segments = String(relativePagePath).replace(/\\/g, '/').split('/').filter(Boolean);

	return segments.every(
		(segment) =>
			!segment.startsWith('_') && (!segment.startsWith('.') || segment === '.well-known'),
	);
}

export function getStaticPageRoutePath(relativePagePath) {
	const normalizedPath = String(relativePagePath).replace(/\\/g, '/');
	if (!isAstroPublicPagePath(normalizedPath)) {
		return undefined;
	}

	const segments = normalizedPath.split('/').filter(Boolean);
	if (segments.length === 0) {
		return undefined;
	}

	const fileName = segments.pop();
	const extension = path.posix.extname(fileName);
	if (!PAGE_ROUTE_EXTENSIONS.has(extension)) {
		return undefined;
	}

	const routeName = fileName.slice(0, -extension.length);
	const routeSegments = [...segments, routeName];
	if (routeSegments.some((segment) => segment.includes('[') || segment.includes(']'))) {
		return undefined;
	}

	if (routeName === 'index') {
		routeSegments.pop();
	}
	if (routeSegments.length === 0) {
		return '/';
	}
	if (routeSegments.length === 1 && ['404', '500'].includes(routeSegments[0])) {
		return `/${routeSegments[0]}.html`;
	}

	return normalizeRoutePath(`/${routeSegments.join('/')}`);
}

export function isAstroEndpointPath(relativePagePath) {
	const normalizedPath = String(relativePagePath).replace(/\\/g, '/');
	if (!isAstroPublicPagePath(normalizedPath)) {
		return false;
	}

	const fileName = normalizedPath.split('/').filter(Boolean).at(-1);
	if (!fileName || fileName.includes('[') || fileName.includes(']')) {
		return false;
	}

	const extension = path.posix.extname(fileName);
	return extension === '.js' || extension === '.ts';
}

export function isMissingPostRoute(href, postRoutes) {
	const routePath = normalizeRoutePath(href);
	return href.startsWith('/') && routePath.startsWith('/blog/') && !postRoutes.has(routePath);
}

export function isMarkdownImageLink(matchText) {
	return matchText.startsWith('!');
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
