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
import {
	POST_REDIRECTS,
	findRedirectProblems,
	normalizeRedirectPath,
} from '../src/data/postRedirects.mjs';
import { BUILD_BUDGETS, checkBuildBudgets, formatBudgetBytes } from './lib/build-budgets.mjs';

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

// The site serves its own fonts and stylesheets (plan 30). A stylesheet, font
// or script pulled from a third-party host is render-blocking, sends the
// visitor's IP to that host, and breaks when the host does, so reintroducing
// one should fail the build rather than be noticed later.
export const BLOCKED_ASSET_HOSTS = [
	'fonts.googleapis.com',
	'fonts.gstatic.com',
	'cdn.jsdelivr.net',
	'unpkg.com',
	'cdnjs.cloudflare.com',
];

export function findExternalAssetReferencesInHtml(content, label, hosts = BLOCKED_ASSET_HOSTS) {
	const issues = [];

	for (const match of content.matchAll(/<(?:link|script)\b[^>]*>/gi)) {
		const tag = match[0];
		const urlMatch = tag.match(/\s(?:href|src)\s*=\s*["']([^"']+)["']/i);
		if (!urlMatch) {
			continue;
		}

		const host = hosts.find((blockedHost) => urlMatch[1].includes(blockedHost));
		if (host) {
			issues.push(`External asset reference to ${host} in ${label}: ${urlMatch[1]}`);
		}
	}

	return issues;
}

function findExternalAssetReferences(distDir, htmlFiles) {
	const issues = [];

	for (const filePath of htmlFiles) {
		const relativePath = path.relative(distDir, filePath).split(path.sep).join('/');
		const found = findExternalAssetReferencesInHtml(readFileSync(filePath, 'utf8'), relativePath);
		// One page is enough to show the problem; every page shares a head.
		if (found.length > 0) {
			issues.push(...found);
			break;
		}
	}

	return issues;
}

// Korean text routinely puts a particle straight after a closing `**`
// (`**"인용"**입니다`, `**-0.9%**였습니다`), which plain CommonMark leaves as
// literal asterisks. remark-cjk-friendly fixes that in astro.config.mjs; this
// catches a regression (plugin dropped or changed) on the rendered pages.
// Code, scripts and math are blanked first since `**` is legitimate there.
export function findLiteralBoldMarkersInHtml(content, label) {
	const article = content.match(/<article\b[\s\S]*<\/article>/i)?.[0] ?? '';
	const text = decodeHtmlEntities(
		article
			.replace(/<(pre|code|script|style|annotation)\b[\s\S]*?<\/\1>/gi, 'CODE')
			.replace(/<[^>]*>/g, ''),
	);
	const matches = [...text.matchAll(/\*\*(?=\S)[^\n]*?\S\*\*/g)];
	if (matches.length === 0) {
		return [];
	}

	const excerpt = matches[0][0].length > 80 ? `${matches[0][0].slice(0, 77)}...` : matches[0][0];
	return [`Literal ** bold markers in ${label} (${matches.length} found), e.g. ${excerpt}`];
}

// Measures each budgeted group in the build output. A group is a top-level
// entry of `dist`: either a directory or a single file.
export function measureBuildGroups(distDir, budgets = BUILD_BUDGETS) {
	return budgets.map((budget) => {
		const target = path.join(distDir, budget.key);
		if (!existsSync(target)) {
			return { key: budget.key, bytes: 0, fileCount: 0, missing: true };
		}

		if (statSync(target).isFile()) {
			return { key: budget.key, bytes: statSync(target).size, fileCount: 1 };
		}

		const files = walkFiles(target);
		return {
			key: budget.key,
			bytes: files.reduce((sum, filePath) => sum + statSync(filePath).size, 0),
			fileCount: files.length,
		};
	});
}

export function checkBuildArtifacts({
	contentDir = DEFAULT_CONTENT_DIR,
	distDir = DEFAULT_DIST_DIR,
	siteTitle = getSiteTitle(ROOT_DIR),
	siteUrl = getSiteUrl(ROOT_DIR),
	redirects = POST_REDIRECTS,
	budgets = BUILD_BUDGETS,
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

	issues.push(...findRedirectProblems(redirects));

	const redirectOutputPaths = new Set();
	for (const redirect of redirects) {
		const from = normalizeRedirectPath(redirect.from);
		const to = normalizeRedirectPath(redirect.to);
		const outputPath = path.join(distDir, from.replace(/^\//, ''), 'index.html');
		redirectOutputPaths.add(path.relative(distDir, outputPath).split(path.sep).join('/'));

		if (!existsSync(outputPath)) {
			issues.push(`Redirect source is missing from the build: ${from}`);
			continue;
		}

		const redirectContent = readFileSync(outputPath, 'utf8');
		if (!redirectContent.includes(`url=${to}`)) {
			issues.push(`Redirect page does not point at ${to}: ${from}`);
		}
		if (!/<meta\s+name="robots"\s+content="noindex"/i.test(redirectContent)) {
			issues.push(`Redirect page is missing robots noindex: ${from}`);
		}
		if (!/<link\s+rel="canonical"/i.test(redirectContent)) {
			issues.push(`Redirect page is missing a canonical link: ${from}`);
		}

		const targetPath = path.join(distDir, to.replace(/^\//, ''), 'index.html');
		if (!existsSync(targetPath)) {
			issues.push(`Redirect target is missing from the build: ${to} (from ${from})`);
		}
	}

	const htmlFiles = walkFiles(
		distDir,
		(filePath) => path.extname(filePath).toLowerCase() === '.html',
	);

	issues.push(...findExternalAssetReferences(distDir, htmlFiles));
	issues.push(
		...checkBuildBudgets(measureBuildGroups(distDir, budgets), publishedPosts.length, budgets),
	);

	const artifactLinks = [];
	for (const filePath of htmlFiles) {
		const content = readFileSync(filePath, 'utf8');
		const titleMatches = [...content.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/gi)];
		const relativePath = path.relative(distDir, filePath).split(path.sep).join('/');
		if (redirectOutputPaths.has(relativePath)) {
			// Astro generates redirect pages with a "Redirecting to: ..." title and
			// no site chrome. They are verified above instead.
			continue;
		}

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
		if (relativePath.startsWith('blog/')) {
			issues.push(...findLiteralBoldMarkersInHtml(content, relativePath));
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

// Prints what each budgeted group currently weighs. Useful before raising a
// budget, and as the record of why a budget has the value it has.
function reportBudgets(postCount) {
	const measurements = measureBuildGroups(DEFAULT_DIST_DIR);
	console.log(`Build size by budgeted group (${postCount} published posts):`);
	for (const budget of BUILD_BUDGETS) {
		const measurement = measurements.find((entry) => entry.key === budget.key);
		const bytes = measurement?.bytes ?? 0;
		const limit =
			typeof budget.perPost === 'number'
				? budget.perPost * Math.max(postCount, 1)
				: (budget.total ?? 0);
		const used = limit > 0 ? Math.round((bytes / limit) * 100) : 0;
		console.log(
			`  ${budget.key.padEnd(18)} ${formatBudgetBytes(bytes).padStart(28)}  of ${formatBudgetBytes(
				limit,
			)}  (${used}%)`,
		);
	}
}

function run() {
	const result = checkBuildArtifacts();
	if (process.argv.includes('--report-budgets')) {
		reportBudgets(result.publishedPostCount);
	}
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
