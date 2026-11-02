// Links ETF tickers in Market Brief posts to this blog's ETF posts at render
// time, so the Markdown sources stay unchanged (plan 34). Each ticker links
// once per post, at its first mention outside headings, links, code and math.

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { normalizeBlogCategoryAlias } from '../data/blogTaxonomy.mjs';
import {
	FRONTMATTER_REGEX,
	getBlogPostRoutePath,
	isDraftFrontmatter,
	parseFrontmatterFields,
	stripQuotes,
	stripYamlComment,
} from './postRoute.mjs';

const TARGET_CATEGORY = 'Market Brief';

// Tickers that Market Brief also uses with another meaning. Checked against
// every Market Brief post on 2026-10-27.
export const EXCLUDED_TICKERS = Object.freeze([
	'USD', // the U.S. dollar
	'PPA', // power purchase agreements ("원전 PPA"), 4 of its 6 mentions
]);

const SKIPPED_NODE_TYPES = new Set([
	'heading',
	'link',
	'linkReference',
	'definition',
	'code',
	'inlineCode',
	'html',
	'math',
	'inlineMath',
	'image',
	'imageReference',
]);

function walkMarkdownFiles(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) return walkMarkdownFiles(entryPath);
		return /\.mdx?$/.test(entry.name) ? [entryPath] : [];
	});
}

/**
 * Maps each `ticker` frontmatter value to its post URL. A ticker claimed by
 * two posts is left out rather than linked to either one.
 */
export function buildTickerRouteMap(contentDir, { includeDrafts = false } = {}) {
	const routes = new Map();
	const duplicates = new Set();

	for (const filePath of walkMarkdownFiles(contentDir)) {
		const content = readFileSync(filePath, 'utf8');
		const frontmatter = content.match(FRONTMATTER_REGEX)?.[1];
		if (!frontmatter || (!includeDrafts && isDraftFrontmatter(frontmatter))) continue;

		const tickerField = parseFrontmatterFields(frontmatter).get('ticker');
		const ticker = tickerField ? stripQuotes(stripYamlComment(tickerField.rawValue)).trim() : '';
		if (!/^[A-Z][A-Z0-9]{0,5}$/.test(ticker) || EXCLUDED_TICKERS.includes(ticker)) continue;

		if (routes.has(ticker)) duplicates.add(ticker);
		routes.set(ticker, `${getBlogPostRoutePath(filePath, content, contentDir)}/`);
	}

	for (const ticker of duplicates) routes.delete(ticker);
	return routes;
}

function createTickerPattern(tickers) {
	const alternatives = [...tickers].sort((a, b) => b.length - a.length).join('|');
	return new RegExp(`(?<![A-Za-z0-9_])(${alternatives})(?![A-Za-z0-9_])`, 'g');
}

function splitTextNode(node, pattern, routes, linked) {
	const parts = [];
	let lastIndex = 0;

	for (const match of node.value.matchAll(pattern)) {
		const ticker = match[1];
		if (linked.has(ticker)) continue;
		linked.add(ticker);

		if (match.index > lastIndex) {
			parts.push({ type: 'text', value: node.value.slice(lastIndex, match.index) });
		}
		parts.push({
			type: 'link',
			url: routes.get(ticker),
			title: null,
			children: [{ type: 'text', value: ticker }],
		});
		lastIndex = match.index + ticker.length;
	}

	if (parts.length === 0) return undefined;
	if (lastIndex < node.value.length) {
		parts.push({ type: 'text', value: node.value.slice(lastIndex) });
	}
	return parts;
}

/** Links the first mention of each ticker in document order; returns the linked tickers. */
export function linkTickers(tree, routes) {
	const linked = new Set();
	if (routes.size === 0) return linked;
	const pattern = createTickerPattern(routes.keys());

	const visit = (parent) => {
		for (let index = 0; index < parent.children.length; index += 1) {
			const child = parent.children[index];
			if (SKIPPED_NODE_TYPES.has(child.type)) continue;

			if (child.type === 'text') {
				const parts = splitTextNode(child, pattern, routes, linked);
				if (parts) {
					parent.children.splice(index, 1, ...parts);
					index += parts.length - 1;
				}
			} else if (Array.isArray(child.children)) {
				visit(child);
			}
		}
	};

	visit(tree);
	return linked;
}

function isTargetPost(frontmatter) {
	const categories = frontmatter?.categories;
	const first = Array.isArray(categories) ? categories[0] : categories;
	if (typeof first !== 'string') return false;
	return (normalizeBlogCategoryAlias(first) ?? first) === TARGET_CATEGORY;
}

/**
 * Options are read on first use, not when the config loads: astro.config.mjs
 * sets `includeDrafts` from the CLI command in an `astro:config:setup` hook,
 * which runs after the plugin list is built.
 */
export default function remarkTickerLinks(options) {
	let routes;

	return (tree, file) => {
		if (!isTargetPost(file.data?.astro?.frontmatter)) return;
		routes ??= buildTickerRouteMap(options.contentDir, {
			includeDrafts: options.includeDrafts,
		});
		linkTickers(tree, routes);
	};
}
