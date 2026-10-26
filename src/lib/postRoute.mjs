// Frontmatter scanning and post-route rules shared by the build scripts and
// astro.config.mjs. Kept free of the heavy Markdown dependencies that
// scripts/lib/content-rules.mjs pulls in, so the Astro config can load it
// cheaply. content-rules.mjs re-exports everything here.

import path from 'node:path';
import { slug as githubSlug } from 'github-slugger';

export const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

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

export function stripQuotes(value) {
	return value.replace(/^['"]|['"]$/g, '');
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

// Astro's glob loader uses github-slugger for path-derived content IDs.
export function slugifyAstroPathSegment(segment) {
	return githubSlug(segment);
}

export function getBlogPostRoutePath(filePath, content, contentDir) {
	const frontmatterMatch = content.match(FRONTMATTER_REGEX);
	const fields = frontmatterMatch ? parseFrontmatterFields(frontmatterMatch[1]) : new Map();
	const slugField = fields.get('slug');

	if (slugField) {
		const slug = stripQuotes(stripYamlComment(slugField.rawValue));
		if (slug) {
			return normalizeRoutePath(`/blog/${slug}`);
		}
	}

	const relativePath = path.relative(contentDir, filePath);
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
