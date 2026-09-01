import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parseFrontmatter } from '@astrojs/markdown-remark';

import {
	ABSOLUTE_PATH_PATTERNS,
	FINANCE_CATEGORIES_FOR_DELIMITER_CHECK,
	FRESHNESS_DATE_FIELDS,
	FRONTMATTER_REGEX,
	KNOWN_CATEGORIES,
	MARKDOWN_IMAGE_REGEX,
	MARKDOWN_LINK_REGEX,
	MAX_DESCRIPTION_LENGTH,
	MAX_FUTURE_DAYS,
	MAX_PAST_YEARS,
	MAX_TITLE_LENGTH,
	PAGE_ROUTE_EXTENSIONS,
	SECRET_PATTERNS,
	UNSAFE_SLUG_REGEX,
	WARNING_PATTERNS,
	countMathDelimiters,
	findAllMatches,
	getComparableLinkTarget,
	getLineNumber,
	getPrimaryCategory,
	getLinkFragment,
	getMarkdownHeadingIds,
	getStaticPageRoutePath,
	hasUnbalancedBold,
	hasTrailingSlash,
	isDataAsOfAfterVerifiedDate,
	isMarkdownImageLink,
	isAstroEndpointPath,
	isMissingPostRoute,
	shouldIndexPostRoute,
	isValidDateFieldFormat,
	normalizeCategoryValue,
	normalizeRoutePath,
	parseFrontmatterFields,
	parseFrontmatterListField,
	parseFrontmatterListValue,
	isAstroPublicPagePath,
	shouldCheckInternalLink,
	slugifyAstroPathSegment,
	stripCodeBlocks,
	stripInlineCode,
	stripYamlComment,
	stripQuotes,
} from './lib/content-rules.mjs';
import { normalizePostReference } from '../src/lib/postReferences.mjs';
import { getRelatedPosts } from '../src/lib/relatedPosts.mjs';
import { buildSeriesNavigation } from '../src/lib/series.mjs';
import {
	ETF_METADATA_FIELDS,
	ETF_VOLATILE_METADATA_FIELDS,
	getEtfMetadataValidationMessage,
	hasEtfVolatileMetadata,
	isValidEtfMetadataValue,
} from '../src/data/etfMetadata.mjs';

const ROOT_DIR = process.cwd();
const CONTENT_DIR = path.join(ROOT_DIR, 'src', 'content', 'blog');
const PAGES_DIR = path.join(ROOT_DIR, 'src', 'pages');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);
const PAGE_EXTENSIONS = PAGE_ROUTE_EXTENSIONS;
// This ID is emitted by the blog page template, not by post Markdown.
const RELATED_POSTS_HEADING_ID = 'related-posts-title';

function walkMarkdownFiles(directory) {
	const results = [];

	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const fullPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			results.push(...walkMarkdownFiles(fullPath));
			continue;
		}

		if (MARKDOWN_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
			results.push(fullPath);
		}
	}

	return results;
}

function walkPageFiles(directory) {
	const results = [];

	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const fullPath = path.join(directory, entry.name);
		const relativePath = path.relative(PAGES_DIR, fullPath);
		if (!isAstroPublicPagePath(relativePath)) {
			continue;
		}

		if (entry.isDirectory()) {
			results.push(...walkPageFiles(fullPath));
			continue;
		}

		if (PAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
			results.push(fullPath);
		}
	}

	return results;
}

function addIssue(collection, severity, filePath, line, message) {
	collection.push({
		severity,
		filePath: path.relative(ROOT_DIR, filePath),
		line,
		message,
	});
}

function getPostRoutePath(filePath, content) {
	const frontmatterMatch = content.match(FRONTMATTER_REGEX);
	const fields = frontmatterMatch ? parseFrontmatterFields(frontmatterMatch[1]) : new Map();
	const slugField = fields.get('slug');

	if (slugField) {
		const slug = stripQuotes(stripYamlComment(slugField.rawValue));
		if (slug) {
			return normalizeRoutePath(`/blog/${slug}`);
		}
	}

	const relativePath = path.relative(CONTENT_DIR, filePath);
	const parsedPath = path.parse(relativePath);
	const relativeWithoutExtension = path.join(parsedPath.dir, parsedPath.name);
	const slugPath = relativeWithoutExtension
		.split(path.sep)
		.filter(Boolean)
		.map(slugifyAstroPathSegment)
		.join('/')
		.replace(/\/index$/, '');

	return normalizeRoutePath(`/blog/${slugPath}`);
}

function getPostReferenceKeys(filePath, content) {
	const keys = [];
	const frontmatterMatch = content.match(FRONTMATTER_REGEX);
	const fields = frontmatterMatch ? parseFrontmatterFields(frontmatterMatch[1]) : new Map();
	const slugField = fields.get('slug');
	if (slugField) {
		keys.push(stripQuotes(stripYamlComment(slugField.rawValue)));
	}

	const relativePath = path.relative(CONTENT_DIR, filePath).replace(/\\/g, '/');
	keys.push(relativePath);
	keys.push(getPostRoutePath(filePath, content));
	return keys.map(normalizePostReference).filter(Boolean);
}

function buildPostReferenceIndex(files) {
	const references = new Map();
	for (const filePath of files) {
		const content = readFileSync(filePath, 'utf8');
		for (const key of getPostReferenceKeys(filePath, content)) {
			references.set(key, filePath);
		}
	}
	return references;
}

function buildPostRouteIndex(files, includeDrafts = true) {
	const routes = new Map();

	for (const filePath of files) {
		const content = readFileSync(filePath, 'utf8');
		const frontmatterMatch = content.match(FRONTMATTER_REGEX);
		if (frontmatterMatch && !shouldIndexPostRoute(frontmatterMatch[1], includeDrafts)) {
			continue;
		}
		const routePath = getPostRoutePath(filePath, content);
		const entries = routes.get(routePath) ?? [];
		entries.push(filePath);
		routes.set(routePath, entries);
	}

	return routes;
}

function getComparablePostDate(post) {
	const value = post.data.pubDate ?? post.data.date;
	return value instanceof Date ? value.valueOf() : new Date(value ?? 0).valueOf();
}

function getCategoryKey(value) {
	return Array.isArray(value) ? value[0] : value;
}

function buildPostMetadata(filePath, content) {
	let data;
	try {
		data = parseFrontmatter(content, { frontmatter: 'empty-with-spaces' }).frontmatter ?? {};
	} catch {
		// Frontmatter validation reports malformed values separately. A post that
		// cannot be parsed must not be used to whitelist generated anchors.
		return undefined;
	}

	const routePath = getPostRoutePath(filePath, content);
	return {
		// The glob loader exposes the generated slug as post.id. Keep this in
		// sync so relatedSlugs and series exclusions resolve like Astro does.
		id: routePath.replace(/^\/blog\//, ''),
		filePath,
		routePath,
		data,
	};
}

function buildGeneratedAnchorRouteIndex(files) {
	const posts = files
		.map((filePath) => buildPostMetadata(filePath, readFileSync(filePath, 'utf8')))
		.filter(Boolean);
	const publishedPosts = posts.filter((post) => !post.data.draft);
	const postsByRoute = new Map();

	for (const post of publishedPosts) {
		const routePath = post.routePath;
		const entries = postsByRoute.get(routePath) ?? [];
		entries.push(post);
		postsByRoute.set(routePath, entries);
	}

	const generatedAnchorRoutes = new Set();
	for (const [routePath, routePosts] of postsByRoute) {
		for (const currentPost of routePosts) {
			const categoryPosts = publishedPosts
				.filter(
					(post) =>
						getCategoryKey(post.data.categories) === getCategoryKey(currentPost.data.categories),
				)
				.sort((a, b) => {
					if (a.data.pinned && !b.data.pinned) return -1;
					if (!a.data.pinned && b.data.pinned) return 1;

					const orderA = a.data.order ?? 999;
					const orderB = b.data.order ?? 999;
					if (orderA !== orderB) return orderA - orderB;

					return getComparablePostDate(a) - getComparablePostDate(b);
				});
			const currentIndex = categoryPosts.findIndex((post) => post.id === currentPost.id);
			const prevPost = currentIndex > 0 ? categoryPosts[currentIndex - 1] : undefined;
			const nextPost =
				currentIndex >= 0 && currentIndex < categoryPosts.length - 1
					? categoryPosts[currentIndex + 1]
					: undefined;
			const seriesNavigation = buildSeriesNavigation(publishedPosts, currentPost);
			const relatedPosts = getRelatedPosts({
				posts: publishedPosts,
				currentPost,
				categoryPosts,
				excludedIds: [
					prevPost?.id,
					nextPost?.id,
					seriesNavigation?.previous?.id,
					seriesNavigation?.next?.id,
				],
			});

			if (relatedPosts.length > 0) {
				generatedAnchorRoutes.add(routePath);
			}
		}
	}

	return generatedAnchorRoutes;
}

function createPostHeadingResolver(postRoutes) {
	const cache = new Map();

	return async (routePath) => {
		if (!cache.has(routePath)) {
			const filePaths = postRoutes.get(routePath) ?? [];
			cache.set(
				routePath,
				Promise.all(
					filePaths.map((filePath) =>
						getMarkdownHeadingIds(readFileSync(filePath, 'utf8'), filePath),
					),
				),
			);
		}

		return cache.get(routePath);
	};
}

function buildStaticPageRouteIndex(files) {
	const routes = new Set();
	const fileRoutes = new Set();

	for (const filePath of files) {
		const relativePath = path.relative(PAGES_DIR, filePath);
		const routePath = getStaticPageRoutePath(relativePath);
		if (routePath) {
			routes.add(routePath);
			if (isAstroEndpointPath(relativePath) || ['/404.html', '/500.html'].includes(routePath)) {
				fileRoutes.add(routePath);
			}
		}
	}

	return { fileRoutes, routes };
}

function checkRequiredFrontmatterField(
	filePath,
	content,
	frontmatterMatch,
	fields,
	fieldName,
	issues,
) {
	const field = fields.get(fieldName);
	if (!field || stripQuotes(field.rawValue).trim().length === 0) {
		addIssue(
			issues,
			'error',
			filePath,
			getLineNumber(content, frontmatterMatch.index),
			`Missing required frontmatter field: \`${fieldName}\`.`,
		);
	}
}

function checkRecommendedFrontmatterField(
	filePath,
	content,
	frontmatterMatch,
	fields,
	fieldName,
	warnings,
) {
	const field = fields.get(fieldName);
	if (!field || stripQuotes(field.rawValue).trim().length === 0) {
		addIssue(
			warnings,
			'warning',
			filePath,
			getLineNumber(content, frontmatterMatch.index),
			`Missing recommended frontmatter field: \`${fieldName}\`.`,
		);
	}
}

function checkPubDateRange(filePath, line, pubDateValue, warnings) {
	const pubDate = new Date(pubDateValue);
	if (Number.isNaN(pubDate.getTime())) {
		return;
	}

	const now = new Date();
	const maxFutureDate = new Date(now);
	maxFutureDate.setDate(maxFutureDate.getDate() + MAX_FUTURE_DAYS);

	const minPastDate = new Date(now);
	minPastDate.setFullYear(minPastDate.getFullYear() - MAX_PAST_YEARS);

	if (pubDate > maxFutureDate) {
		addIssue(
			warnings,
			'warning',
			filePath,
			line,
			`pubDate is more than ${MAX_FUTURE_DAYS} days in the future.`,
		);
	}

	if (pubDate < minPastDate) {
		addIssue(
			warnings,
			'warning',
			filePath,
			line,
			`pubDate is more than ${MAX_PAST_YEARS} years in the past.`,
		);
	}
}

function checkDateFieldFormat(filePath, content, frontmatterMatch, fields, fieldName, issues) {
	const field = fields.get(fieldName);
	if (!field) {
		return;
	}

	const rawValue = field.rawValue;
	const value = stripQuotes(rawValue);
	const line = getLineNumber(content, frontmatterMatch.index + field.index);

	if (!isValidDateFieldFormat(value)) {
		addIssue(
			issues,
			'error',
			filePath,
			line,
			`Invalid ${fieldName} format: ${rawValue}. Use full ISO 8601 with timezone, e.g. "2026-01-16T00:00:00+09:00".`,
		);
	}
}

function checkFreshnessDateOrder(filePath, content, frontmatterMatch, fields, issues) {
	const dataAsOfField = fields.get('dataAsOf');
	const verifiedDateField = fields.get('verifiedDate');
	if (!dataAsOfField || !verifiedDateField) {
		return;
	}

	const dataAsOf = stripQuotes(dataAsOfField.rawValue);
	const verifiedDate = stripQuotes(verifiedDateField.rawValue);
	if (!isValidDateFieldFormat(dataAsOf) || !isValidDateFieldFormat(verifiedDate)) {
		return;
	}

	if (!isDataAsOfAfterVerifiedDate(dataAsOf, verifiedDate)) {
		return;
	}

	addIssue(
		issues,
		'error',
		filePath,
		getLineNumber(content, frontmatterMatch.index + dataAsOfField.index),
		'`dataAsOf` cannot be later than `verifiedDate`.',
	);
}

function checkCategories(filePath, content, frontmatterMatch, fields, warnings) {
	const categoryField = fields.get('categories');
	if (!categoryField) {
		return;
	}

	const categories = parseFrontmatterListValue(categoryField.rawValue);
	const categoryLine = getLineNumber(content, frontmatterMatch.index + categoryField.index);

	for (const category of categories) {
		const normalizedCategory = normalizeCategoryValue(category);
		if (KNOWN_CATEGORIES.has(normalizedCategory)) {
			continue;
		}

		addIssue(
			warnings,
			'warning',
			filePath,
			categoryLine,
			`Unknown category "${category}". It will not match a configured category page.`,
		);
	}
}

function checkRelatedSlugs(filePath, content, frontmatterMatch, fields, issues, postReferences) {
	const field = fields.get('relatedSlugs');
	if (!field) {
		return;
	}

	const line = getLineNumber(content, frontmatterMatch.index + field.index);
	for (const reference of parseFrontmatterListField(frontmatterMatch[1], 'relatedSlugs')) {
		if (postReferences.has(normalizePostReference(reference))) {
			continue;
		}

		addIssue(issues, 'error', filePath, line, `Related post target not found: ${reference}.`);
	}
}

function checkFrontmatterTextLength(
	filePath,
	content,
	frontmatterMatch,
	fields,
	fieldName,
	maxLength,
	warnings,
) {
	const field = fields.get(fieldName);
	if (!field) {
		return;
	}

	const value = stripQuotes(field.rawValue).trim();
	if (value.length <= maxLength) {
		return;
	}

	addIssue(
		warnings,
		'warning',
		filePath,
		getLineNumber(content, frontmatterMatch.index + field.index),
		`${fieldName} is ${value.length} characters. Keep it under ${maxLength} characters for readable cards and previews.`,
	);
}

function checkSlug(filePath, content, frontmatterMatch, fields, warnings) {
	const field = fields.get('slug');
	if (!field) {
		return;
	}

	const value = stripQuotes(field.rawValue).trim();
	if (!value || !UNSAFE_SLUG_REGEX.test(value)) {
		return;
	}

	addIssue(
		warnings,
		'warning',
		filePath,
		getLineNumber(content, frontmatterMatch.index + field.index),
		`Slug contains whitespace, backslashes, query markers, or hash markers: ${field.rawValue}.`,
	);
}

function checkEtfMetadata(filePath, content, frontmatterMatch, fields, issues) {
	const categories = parseFrontmatterListField(frontmatterMatch[1], 'categories');
	if (!categories.some((category) => normalizeCategoryValue(category) === 'ETF')) {
		return;
	}

	for (const fieldName of ETF_METADATA_FIELDS) {
		const field = fields.get(fieldName);
		if (!field) {
			continue;
		}

		const value = stripQuotes(stripYamlComment(field.rawValue)).trim();
		if (!value || ['null', '~'].includes(value.toLowerCase())) {
			continue;
		}

		if (!isValidEtfMetadataValue(fieldName, value)) {
			addIssue(
				issues,
				'error',
				filePath,
				getLineNumber(content, frontmatterMatch.index + field.index),
				`Invalid ETF metadata value for \`${fieldName}\`: ${value}; ${getEtfMetadataValidationMessage(fieldName)}.`,
			);
		}
	}

	const volatileValues = Object.fromEntries(
		ETF_VOLATILE_METADATA_FIELDS.map((fieldName) => {
			const field = fields.get(fieldName);
			if (!field) {
				return [fieldName, undefined];
			}
			const value = stripQuotes(stripYamlComment(field.rawValue)).trim();
			return [fieldName, ['null', '~'].includes(value.toLowerCase()) ? undefined : value];
		}),
	);
	const dataAsOfField = fields.get('dataAsOf');
	const dataAsOfValue = dataAsOfField
		? stripQuotes(stripYamlComment(dataAsOfField.rawValue)).trim()
		: '';
	if (
		hasEtfVolatileMetadata(volatileValues) &&
		(!dataAsOfValue || dataAsOfValue === '~' || dataAsOfValue.toLowerCase() === 'null')
	) {
		const firstVolatileField = ETF_VOLATILE_METADATA_FIELDS.map((fieldName) => {
			const field = fields.get(fieldName);
			if (!field) return undefined;
			const value = stripQuotes(stripYamlComment(field.rawValue)).trim();
			return value && !['null', '~'].includes(value.toLowerCase()) ? field : undefined;
		}).find(Boolean);
		addIssue(
			issues,
			'error',
			filePath,
			getLineNumber(content, frontmatterMatch.index + firstVolatileField.index),
			'ETF volatile metadata requires `dataAsOf` so changing values are not shown without a snapshot date.',
		);
	}
}

function checkFrontmatter(filePath, content, issues, warnings, titleIndex, postReferences) {
	const frontmatterMatch = content.match(FRONTMATTER_REGEX);
	if (!frontmatterMatch) {
		addIssue(issues, 'error', filePath, 1, 'Missing frontmatter block.');
		return;
	}

	const frontmatter = frontmatterMatch[1];
	const fields = parseFrontmatterFields(frontmatter);
	const pubDateField = fields.get('pubDate');
	const dateField = fields.get('date');

	checkRequiredFrontmatterField(filePath, content, frontmatterMatch, fields, 'title', issues);
	checkRecommendedFrontmatterField(
		filePath,
		content,
		frontmatterMatch,
		fields,
		'categories',
		warnings,
	);
	checkFrontmatterTextLength(
		filePath,
		content,
		frontmatterMatch,
		fields,
		'title',
		MAX_TITLE_LENGTH,
		warnings,
	);
	checkFrontmatterTextLength(
		filePath,
		content,
		frontmatterMatch,
		fields,
		'description',
		MAX_DESCRIPTION_LENGTH,
		warnings,
	);
	checkSlug(filePath, content, frontmatterMatch, fields, warnings);
	checkEtfMetadata(filePath, content, frontmatterMatch, fields, issues);
	checkCategories(filePath, content, frontmatterMatch, fields, warnings);
	checkRelatedSlugs(filePath, content, frontmatterMatch, fields, issues, postReferences);
	for (const fieldName of FRESHNESS_DATE_FIELDS) {
		checkDateFieldFormat(filePath, content, frontmatterMatch, fields, fieldName, issues);
	}
	checkFreshnessDateOrder(filePath, content, frontmatterMatch, fields, issues);

	const titleField = fields.get('title');
	if (titleField) {
		const title = stripQuotes(titleField.rawValue).trim();
		if (title) {
			const titleLine = getLineNumber(content, frontmatterMatch.index + titleField.index);
			const existing = titleIndex.get(title) ?? [];
			existing.push({ filePath, line: titleLine });
			titleIndex.set(title, existing);
		}
	}

	if (!pubDateField && !dateField) {
		addIssue(issues, 'error', filePath, 1, 'Missing `pubDate` or legacy `date` in frontmatter.');
		return;
	}

	if (!pubDateField && dateField) {
		return;
	}

	const rawValue = pubDateField.rawValue;
	const pubDateValue = stripQuotes(rawValue);
	const pubDateLine = getLineNumber(content, frontmatterMatch.index + pubDateField.index);

	if (!isValidDateFieldFormat(pubDateValue)) {
		addIssue(
			issues,
			'error',
			filePath,
			pubDateLine,
			`Invalid pubDate format: ${rawValue}. Use full ISO 8601 with timezone, e.g. "2026-01-16T00:00:00+09:00".`,
		);
		return;
	}

	checkPubDateRange(filePath, pubDateLine, pubDateValue, warnings);
}

function checkMarkdownSyntax(filePath, content, warnings) {
	const contentWithoutCode = stripCodeBlocks(content);
	const lines = contentWithoutCode.split(/\r?\n/);

	for (const [index, line] of lines.entries()) {
		if (hasUnbalancedBold(line)) {
			addIssue(
				warnings,
				'warning',
				filePath,
				index + 1,
				'Unbalanced bold markdown marker `**` detected.',
			);
		}
	}

	for (const tag of ['strong', 'em', 'b', 'i']) {
		const openingCount = findAllMatches(
			contentWithoutCode,
			new RegExp(`<${tag}(?:\\s[^>]*)?>`, 'i'),
		).length;
		const closingCount = findAllMatches(contentWithoutCode, new RegExp(`</${tag}>`, 'i')).length;

		if (openingCount !== closingCount) {
			addIssue(warnings, 'warning', filePath, 1, `Unbalanced HTML tag detected: <${tag}>.`);
		}
	}
}

function checkMathStrikethroughCollisions(filePath, content, warnings) {
	const contentWithoutCode = stripInlineCode(stripCodeBlocks(content));
	const lines = contentWithoutCode.split(/\r?\n/);

	for (const [index, line] of lines.entries()) {
		const { dollar: dollarCount, tilde: tildeCount } = countMathDelimiters(line);

		if (dollarCount >= 2) {
			addIssue(
				warnings,
				'warning',
				filePath,
				index + 1,
				`Line has ${dollarCount} unescaped "$" characters; remark-math may parse text between a pair of them as inline math. Escape currency figures as "\\$" if not intentional math.`,
			);
		}

		if (tildeCount >= 2) {
			addIssue(
				warnings,
				'warning',
				filePath,
				index + 1,
				`Line has ${tildeCount} unescaped "~" characters; GFM may parse text between a pair of them as strikethrough. Escape range separators as "\\~" if not intentional strikethrough.`,
			);
		}
	}
}

function checkImages(filePath, content, warnings) {
	const contentWithoutCode = stripCodeBlocks(content);

	for (const match of findAllMatches(contentWithoutCode, MARKDOWN_IMAGE_REGEX)) {
		const altText = match[1].trim();
		if (altText) {
			continue;
		}

		addIssue(
			warnings,
			'warning',
			filePath,
			getLineNumber(contentWithoutCode, match.index ?? 0),
			`Markdown image is missing alt text: ${match[2]}.`,
		);
	}
}

function checkPatterns(filePath, content, issues, warnings) {
	for (const pattern of ABSOLUTE_PATH_PATTERNS) {
		const match = content.match(pattern.regex);
		if (!match) {
			continue;
		}

		addIssue(
			issues,
			'error',
			filePath,
			getLineNumber(content, match.index ?? 0),
			`${pattern.label} detected in content.`,
		);
	}

	for (const pattern of SECRET_PATTERNS) {
		for (const match of findAllMatches(content, pattern.regex)) {
			if (pattern.isAllowedMatch?.(match)) {
				continue;
			}

			addIssue(
				issues,
				'error',
				filePath,
				getLineNumber(content, match.index ?? 0),
				`${pattern.label} detected.`,
			);
		}
	}

	for (const pattern of WARNING_PATTERNS) {
		for (const match of findAllMatches(content, pattern.regex)) {
			addIssue(
				warnings,
				'warning',
				filePath,
				getLineNumber(content, match.index ?? 0),
				`${pattern.label} detected.`,
			);
		}
	}
}

function resolveInternalLinkTarget(filePath, href) {
	const target = getComparableLinkTarget(href);
	if (!target) {
		return undefined;
	}

	if (target.startsWith('/')) {
		return path.join(PUBLIC_DIR, target);
	}

	return path.resolve(path.dirname(filePath), target);
}

async function checkInternalLinks(
	filePath,
	content,
	issues,
	warnings,
	postRoutes,
	getPostHeadingSets,
	generatedAnchorRoutes,
	staticPageIndex,
) {
	const contentWithoutCode = stripCodeBlocks(content);
	const { fileRoutes, routes: staticPageRoutes } = staticPageIndex;

	for (const match of findAllMatches(contentWithoutCode, MARKDOWN_LINK_REGEX)) {
		const href = match[1];
		if (!shouldCheckInternalLink(href)) {
			continue;
		}

		const isImageLink = isMarkdownImageLink(match[0]);
		const routePath = normalizeRoutePath(href);
		if (!isImageLink && href.startsWith('/') && routePath.startsWith('/blog/')) {
			if (isMissingPostRoute(href, postRoutes)) {
				addIssue(
					issues,
					'error',
					filePath,
					getLineNumber(contentWithoutCode, match.index ?? 0),
					`Internal post route not found: ${href}.`,
				);
				continue;
			}

			const fragment = getLinkFragment(href);
			if (
				fragment &&
				!(fragment === RELATED_POSTS_HEADING_ID && generatedAnchorRoutes.has(routePath))
			) {
				const headingSets = await getPostHeadingSets(routePath);
				if (
					headingSets.length > 0 &&
					headingSets.every((headingIds) => !headingIds.hasUnresolvedIds) &&
					headingSets.every((headingIds) => !headingIds.has(fragment))
				) {
					addIssue(
						issues,
						'error',
						filePath,
						getLineNumber(contentWithoutCode, match.index ?? 0),
						`Internal post heading anchor not found: ${href}.`,
					);
				}
			}
			continue;
		}
		if (!isImageLink && href.startsWith('/') && staticPageRoutes.has(routePath)) {
			if (!(fileRoutes.has(routePath) && hasTrailingSlash(href))) {
				continue;
			}
		}

		const targetPath = resolveInternalLinkTarget(filePath, href);
		if (!targetPath || existsSync(targetPath)) {
			continue;
		}

		addIssue(
			warnings,
			'warning',
			filePath,
			getLineNumber(contentWithoutCode, match.index ?? 0),
			`Internal link target not found: ${href}.`,
		);
	}
}

function checkDuplicatePostRoutes(postRoutes, issues) {
	for (const [routePath, filePaths] of postRoutes) {
		if (filePaths.length < 2) {
			continue;
		}

		for (const filePath of filePaths) {
			addIssue(
				issues,
				'error',
				filePath,
				1,
				`Duplicate generated post route detected: ${routePath}.`,
			);
		}
	}
}

function getStagedFileSet() {
	const listArg = process.argv.find((arg) => arg.startsWith('--staged-file-list='));
	if (!listArg) {
		return null;
	}

	const listPath = listArg.slice('--staged-file-list='.length);
	const raw = readFileSync(listPath, 'utf8');
	return new Set(
		raw
			.split(/\r?\n/)
			.map((line) => line.trim().replace(/\\/g, '/'))
			.filter(Boolean),
	);
}

async function main() {
	if (!statSync(CONTENT_DIR).isDirectory()) {
		console.error(`Content directory not found: ${CONTENT_DIR}`);
		process.exit(1);
	}

	const stagedFileSet = getStagedFileSet();
	const files = walkMarkdownFiles(CONTENT_DIR);
	const issues = [];
	const warnings = [];
	const titleIndex = new Map();
	const postRoutes = buildPostRouteIndex(files);
	const publishedPostRoutes = buildPostRouteIndex(files, false);
	const getPostHeadingSets = createPostHeadingResolver(publishedPostRoutes);
	const generatedAnchorRoutes = buildGeneratedAnchorRouteIndex(files);
	const staticPageIndex = buildStaticPageRouteIndex(walkPageFiles(PAGES_DIR));
	const postReferences = buildPostReferenceIndex(files);

	checkDuplicatePostRoutes(postRoutes, issues);

	for (const filePath of files) {
		const content = readFileSync(filePath, 'utf8');
		checkFrontmatter(filePath, content, issues, warnings, titleIndex, postReferences);
		checkMarkdownSyntax(filePath, content, warnings);
		if (FINANCE_CATEGORIES_FOR_DELIMITER_CHECK.has(getPrimaryCategory(content))) {
			checkMathStrikethroughCollisions(filePath, content, warnings);
		}
		checkImages(filePath, content, warnings);
		checkPatterns(filePath, content, issues, warnings);
		await checkInternalLinks(
			filePath,
			content,
			issues,
			warnings,
			publishedPostRoutes,
			getPostHeadingSets,
			generatedAnchorRoutes,
			staticPageIndex,
		);
	}

	for (const [title, entries] of titleIndex) {
		if (entries.length < 2) {
			continue;
		}

		for (const entry of entries) {
			addIssue(
				warnings,
				'warning',
				entry.filePath,
				entry.line,
				`Duplicate post title detected: "${title}".`,
			);
		}
	}

	// Errors always apply repo-wide (correctness must always hold). Warnings are
	// noisier and lower-stakes, so when a staged-file list is provided (from the
	// pre-commit hook) only surface warnings for files actually being committed —
	// otherwise every commit re-prints warnings for the entire legacy corpus.
	const reportedWarnings = stagedFileSet
		? warnings.filter((warning) => stagedFileSet.has(warning.filePath.replace(/\\/g, '/')))
		: warnings;

	if (issues.length === 0 && reportedWarnings.length === 0) {
		console.log(`Content quality check passed for ${files.length} files.`);
		return;
	}

	for (const issue of issues) {
		console.error(`ERROR ${issue.filePath}:${issue.line} ${issue.message}`);
	}

	for (const warning of reportedWarnings) {
		console.warn(`WARN  ${warning.filePath}:${warning.line} ${warning.message}`);
	}

	if (issues.length > 0) {
		console.error(
			`\nContent quality check failed with ${issues.length} error(s) and ${reportedWarnings.length} warning(s).`,
		);
		process.exit(1);
	}

	console.warn(`\nContent quality check passed with ${reportedWarnings.length} warning(s).`);
}

main();
