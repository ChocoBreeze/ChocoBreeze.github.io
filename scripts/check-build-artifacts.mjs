import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
	FRONTMATTER_REGEX,
	getBlogPostRoutePath,
	isDraftFrontmatter,
	normalizeRoutePath,
} from './lib/content-rules.mjs';

const ROOT_DIR = process.cwd();
const DEFAULT_CONTENT_DIR = process.env.ASTRA_BLOG_CONTENT_DIR
	? path.resolve(process.env.ASTRA_BLOG_CONTENT_DIR)
	: path.join(ROOT_DIR, 'src', 'content', 'blog');
const DEFAULT_DIST_DIR = process.env.ASTRA_DIST_DIR
	? path.resolve(process.env.ASTRA_DIST_DIR)
	: path.join(ROOT_DIR, 'dist');
const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);

function walkFiles(directory, predicate = () => true) {
	if (!existsSync(directory)) {
		return [];
	}

	const files = [];
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const filePath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...walkFiles(filePath, predicate));
		} else if (entry.isFile() && predicate(filePath)) {
			files.push(filePath);
		}
	}
	return files;
}

function getSourcePosts(contentDir) {
	return walkFiles(contentDir, (filePath) =>
		MARKDOWN_EXTENSIONS.has(path.extname(filePath).toLowerCase()),
	).map((filePath) => {
		const content = readFileSync(filePath, 'utf8');
		const frontmatterMatch = content.match(FRONTMATTER_REGEX);
		const frontmatter = frontmatterMatch?.[1] ?? '';
		return {
			filePath,
			route: getBlogPostRoutePath(filePath, content, contentDir),
			draft: isDraftFrontmatter(frontmatter),
		};
	});
}

function getPostOutputPath(distDir, route) {
	const segments = route.split('/').filter(Boolean);
	if (segments[0] !== 'blog' || segments.some((segment) => segment === '.' || segment === '..')) {
		return undefined;
	}
	return path.join(distDir, ...segments, 'index.html');
}

function toBlogRoute(value, siteUrl) {
	try {
		const target = new URL(value, siteUrl);
		if (target.origin !== new URL(siteUrl).origin) {
			return undefined;
		}
		const route = normalizeRoutePath(target.pathname);
		return route.startsWith('/blog/') ? route : undefined;
	} catch {
		return undefined;
	}
}

function decodeHtmlEntities(value) {
	return value
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>');
}

function getSiteTitle(rootDir) {
	const constantsPath = path.join(rootDir, 'src', 'consts.ts');
	const constants = readFileSync(constantsPath, 'utf8');
	const match = constants.match(/export\s+const\s+SITE_TITLE\s*=\s*(['"])(.*?)\1\s*;/);
	if (!match) {
		throw new Error(`Could not read SITE_TITLE from ${constantsPath}`);
	}
	return match[2];
}

function getSiteUrl(rootDir) {
	const configPath = path.join(rootDir, 'astro.config.mjs');
	const config = readFileSync(configPath, 'utf8');
	const match = config.match(/\bsite\s*:\s*(['"])(.*?)\1/);
	if (!match) {
		throw new Error(`Could not read site URL from ${configPath}`);
	}
	return match[2];
}

function collectHtmlBlogLinks(content, sourcePath, siteUrl) {
	const links = [];
	for (const match of content.matchAll(/\bhref\s*=\s*(["'])(.*?)\1/gi)) {
		const route = toBlogRoute(decodeHtmlEntities(match[2]), siteUrl);
		if (route) links.push({ route, sourcePath });
	}
	return links;
}

function collectXmlBlogLinks(content, sourcePath, siteUrl) {
	const links = [];
	for (const match of content.matchAll(/<(?:link|loc)>\s*([^<]+?)\s*<\/(?:link|loc)>/gi)) {
		const route = toBlogRoute(decodeHtmlEntities(match[1].trim()), siteUrl);
		if (route) links.push({ route, sourcePath });
	}
	return links;
}

function getSearchIndexFiles(distDir) {
	return walkFiles(distDir, (filePath) => {
		const relativePath = path.relative(distDir, filePath).split(path.sep).join('/');
		return (
			relativePath === 'search.json' ||
			(relativePath.startsWith('search/') && relativePath.endsWith('.json'))
		);
	});
}

function getSearchRecords(value) {
	if (Array.isArray(value)) return value;
	if (value && Array.isArray(value.posts)) return value.posts;
	if (value && Array.isArray(value.items)) return value.items;
	return [];
}

export function checkBuildArtifacts({
	contentDir = DEFAULT_CONTENT_DIR,
	distDir = DEFAULT_DIST_DIR,
	siteTitle = getSiteTitle(ROOT_DIR),
	siteUrl = getSiteUrl(ROOT_DIR),
} = {}) {
	if (!existsSync(contentDir) || !statSync(contentDir).isDirectory()) {
		throw new Error(`Content directory not found: ${contentDir}`);
	}
	if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
		throw new Error(`Build output directory not found. Run npm run build first: ${distDir}`);
	}

	const issues = [];
	const sourcePosts = getSourcePosts(contentDir);
	const publishedPosts = sourcePosts.filter((post) => !post.draft);
	const draftPosts = sourcePosts.filter((post) => post.draft);
	const publishedRoutes = new Set();
	const draftRoutes = new Set(draftPosts.map((post) => post.route));

	for (const post of publishedPosts) {
		if (publishedRoutes.has(post.route)) {
			issues.push(`Duplicate published post route in source content: ${post.route}`);
		}
		publishedRoutes.add(post.route);

		const outputPath = getPostOutputPath(distDir, post.route);
		if (!outputPath || !existsSync(outputPath)) {
			issues.push(`Published post route is missing from the build: ${post.route}`);
		}
	}

	for (const route of draftRoutes) {
		const outputPath = getPostOutputPath(distDir, route);
		if (outputPath && existsSync(outputPath)) {
			issues.push(`Draft post route leaked into the build: ${route}`);
		}
	}

	const htmlFiles = walkFiles(
		distDir,
		(filePath) => path.extname(filePath).toLowerCase() === '.html',
	);
	const artifactLinks = [];
	for (const filePath of htmlFiles) {
		const content = readFileSync(filePath, 'utf8');
		const titleMatches = [...content.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/gi)];
		const relativePath = path.relative(distDir, filePath).split(path.sep).join('/');
		if (titleMatches.length !== 1) {
			issues.push(`Expected exactly one <title> in ${relativePath}; found ${titleMatches.length}`);
		}
		for (const titleMatch of titleMatches) {
			const title = decodeHtmlEntities(titleMatch[1].replace(/<[^>]*>/g, '').trim());
			const suffix = ` | ${siteTitle}`;
			const suffixCount = title.split(suffix).length - 1;
			const isHomePageTitle = relativePath === 'index.html' && title === siteTitle;
			if (!isHomePageTitle && (!title.endsWith(suffix) || suffixCount !== 1)) {
				issues.push(
					`Page title has a missing or duplicated site-name suffix in ${relativePath}: ${title}`,
				);
			}
		}
		artifactLinks.push(...collectHtmlBlogLinks(content, relativePath, siteUrl));
	}

	const xmlFiles = walkFiles(
		distDir,
		(filePath) => path.extname(filePath).toLowerCase() === '.xml',
	);
	for (const filePath of xmlFiles) {
		const content = readFileSync(filePath, 'utf8');
		artifactLinks.push(...collectXmlBlogLinks(content, path.relative(distDir, filePath), siteUrl));
	}

	const fullSearchPath = path.join(distDir, 'search.json');
	const fullSearchRoutes = [];
	for (const filePath of getSearchIndexFiles(distDir)) {
		const relativePath = path.relative(distDir, filePath);
		let records;
		try {
			records = getSearchRecords(JSON.parse(readFileSync(filePath, 'utf8')));
		} catch (error) {
			issues.push(`Could not parse search index ${relativePath}: ${error.message}`);
			continue;
		}

		for (const record of records) {
			if (typeof record?.s !== 'string' || !record.s.trim()) continue;
			const route = normalizeRoutePath(`/blog/${record.s}`);
			artifactLinks.push({ route, sourcePath: relativePath });
			if (path.resolve(filePath) === path.resolve(fullSearchPath)) {
				fullSearchRoutes.push(route);
			}
		}
	}

	if (!existsSync(fullSearchPath)) {
		issues.push('Full search index is missing from the build: search.json');
	} else {
		for (const route of publishedRoutes) {
			const count = fullSearchRoutes.filter((searchRoute) => searchRoute === route).length;
			if (count !== 1) {
				issues.push(`Expected one full-search entry for ${route}; found ${count}`);
			}
		}
	}

	for (const link of artifactLinks) {
		if (draftRoutes.has(link.route)) {
			issues.push(
				`Draft post is referenced by a build artifact: ${link.route} (${link.sourcePath})`,
			);
		} else if (!publishedRoutes.has(link.route)) {
			issues.push(
				`Build artifact points to a missing or unpublished post: ${link.route} (${link.sourcePath})`,
			);
		}
	}

	return {
		issues: [...new Set(issues)],
		publishedPostCount: publishedPosts.length,
		draftPostCount: draftPosts.length,
		htmlPageCount: htmlFiles.length,
		checkedPostLinkCount: artifactLinks.length,
	};
}

function run() {
	const result = checkBuildArtifacts();
	if (result.issues.length) {
		console.error(`Build artifact check failed with ${result.issues.length} issue(s):`);
		for (const issue of result.issues) console.error(`- ${issue}`);
		process.exitCode = 1;
		return;
	}

	console.log(
		`Build artifact check passed: ${result.publishedPostCount} published posts, ` +
			`${result.draftPostCount} drafts excluded, ${result.htmlPageCount} HTML pages, ` +
			`${result.checkedPostLinkCount} post links checked.`,
	);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	try {
		run();
	} catch (error) {
		console.error(error.message);
		process.exitCode = 1;
	}
}
