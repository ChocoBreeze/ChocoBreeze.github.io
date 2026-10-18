import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { BLOG_CATEGORY_KEYS, slugifyBlogCategoryKey } from '../../src/data/blogTaxonomy.mjs';

import {
	collectAssetReferences,
	collectSiteAssetReferences,
	countMathDelimiters,
	findTagVariantCollisions,
	findUnusedAssets,
	foldTagForComparison,
	formatByteSize,
	getDerivedRouteIssues,
	getRouteSegments,
	getPrimaryCategory,
	getLinkFragment,
	getMarkdownHeadingIds,
	getStaticPageRoutePath,
	hasUnbalancedBold,
	hasTrailingSlash,
	isDataAsOfAfterVerifiedDate,
	isAstroPublicPagePath,
	isAstroEndpointPath,
	isDraftFrontmatter,
	isMarkdownImageLink,
	isMissingPostRoute,
	isKnownCategory,
	isValidCalendarDate,
	isValidDateFieldFormat,
	normalizeCategoryValue,
	normalizeRoutePath,
	parseFrontmatterFields,
	parseFrontmatterListField,
	parseFrontmatterListValue,
	shouldCheckInternalLink,
	shouldIndexPostRoute,
	slugifyAstroPathSegment,
	slugifyPathSegment,
	stripCodeBlocks,
	stripQuotes,
	stripYamlComment,
} from '../lib/content-rules.mjs';

describe('isValidDateFieldFormat', () => {
	it('accepts full ISO 8601 with timezone offset', () => {
		assert.equal(isValidDateFieldFormat('2026-01-16T00:00:00+09:00'), true);
	});

	it('accepts UTC Z and fractional seconds', () => {
		assert.equal(isValidDateFieldFormat('2026-01-16T00:00:00Z'), true);
		assert.equal(isValidDateFieldFormat('2026-01-16T00:00:00.123+09:00'), true);
	});

	it('accepts quoted values (frontmatter quoting is stripped)', () => {
		assert.equal(isValidDateFieldFormat('"2026-01-16T00:00:00+09:00"'), true);
	});

	it('rejects a date without a timezone', () => {
		assert.equal(isValidDateFieldFormat('2026-01-16T00:00:00'), false);
	});

	it('rejects a bare date', () => {
		assert.equal(isValidDateFieldFormat('2026-01-16'), false);
	});

	it('rejects impossible calendar dates', () => {
		assert.equal(isValidDateFieldFormat('2026-02-29T00:00:00+09:00'), false);
		assert.equal(isValidDateFieldFormat('2026-99-99T00:00:00+09:00'), false);
	});

	it('rejects impossible clock values', () => {
		assert.equal(isValidDateFieldFormat('2026-01-16T24:00:00+09:00'), false);
		assert.equal(isValidDateFieldFormat('2026-01-16T00:60:00+09:00'), false);
	});
});

describe('isValidCalendarDate', () => {
	it('handles leap years and month lengths', () => {
		assert.equal(isValidCalendarDate('2024-02-29'), true);
		assert.equal(isValidCalendarDate('2026-02-29'), false);
		assert.equal(isValidCalendarDate('2026-04-31'), false);
	});
});

describe('isDataAsOfAfterVerifiedDate', () => {
	it('flags a data snapshot newer than its verification date', () => {
		assert.equal(
			isDataAsOfAfterVerifiedDate('2026-08-02T00:00:00+09:00', '2026-08-01T00:00:00+09:00'),
			true,
		);
	});

	it('accepts the same day or an older data snapshot', () => {
		assert.equal(
			isDataAsOfAfterVerifiedDate('2026-08-01T00:00:00+09:00', '2026-08-01T00:00:00+09:00'),
			false,
		);
		assert.equal(
			isDataAsOfAfterVerifiedDate('2026-07-31T00:00:00+09:00', '2026-08-01T00:00:00+09:00'),
			false,
		);
	});

	it('does not compare invalid dates', () => {
		assert.equal(isDataAsOfAfterVerifiedDate('not-a-date', '2026-08-01T00:00:00+09:00'), false);
	});
});

describe('normalizeCategoryValue / isKnownCategory', () => {
	it('maps known aliases to canonical keys', () => {
		assert.equal(normalizeCategoryValue('cs'), 'Computer Science');
		assert.equal(normalizeCategoryValue('problem solving'), 'Problem_Solving');
		assert.equal(normalizeCategoryValue('macro'), 'Economics');
		assert.equal(normalizeCategoryValue('US Market Brief'), 'Market Brief');
	});

	it('is case-insensitive for aliases', () => {
		assert.equal(normalizeCategoryValue('ETF'), 'ETF');
		assert.equal(normalizeCategoryValue('etf'), 'ETF');
	});

	it('passes canonical keys through unchanged', () => {
		assert.equal(normalizeCategoryValue('Semiconductor'), 'Semiconductor');
	});

	it('leaves unknown values as trimmed input', () => {
		assert.equal(normalizeCategoryValue('  Cooking '), 'Cooking');
		assert.equal(isKnownCategory('Cooking'), false);
	});

	it('recognizes known categories through aliases', () => {
		assert.equal(isKnownCategory('cs'), true);
		assert.equal(isKnownCategory('Market Brief'), true);
	});
});

describe('slugifyBlogCategoryKey', () => {
	it('preserves the existing RSS and search slugs for every category key', () => {
		const categories = [
			['ETF', 'etf'],
			['Economics', 'economics'],
			['Semiconductor', 'semiconductor'],
			['Computer Science', 'computer-science'],
			['Programming', 'programming'],
			['Problem_Solving', 'problem-solving'],
			['Reports', 'reports'],
			['Market Brief', 'market-brief'],
		];

		for (const [key, slug] of categories) {
			assert.equal(slugifyBlogCategoryKey(key), slug);
		}
	});

	it('produces unique feed and search slugs for the canonical keys', () => {
		const slugs = BLOG_CATEGORY_KEYS.map(slugifyBlogCategoryKey);
		assert.equal(new Set(slugs).size, BLOG_CATEGORY_KEYS.length);
	});

	it('rejects values that are not canonical category keys', () => {
		assert.equal(slugifyBlogCategoryKey('cs'), undefined);
		assert.equal(slugifyBlogCategoryKey('unknown'), undefined);
		assert.equal(slugifyBlogCategoryKey(undefined), undefined);
	});
});

describe('parseFrontmatterFields', () => {
	it('extracts simple key/value pairs', () => {
		const fields = parseFrontmatterFields('title: Hello\npubDate: 2026-01-16T00:00:00+09:00');
		assert.equal(fields.get('title').rawValue, 'Hello');
		assert.equal(fields.get('pubDate').rawValue, '2026-01-16T00:00:00+09:00');
	});

	it('ignores indented (nested) keys', () => {
		const fields = parseFrontmatterFields('title: Hello\n  nested: value');
		assert.equal(fields.has('nested'), false);
	});
});

describe('isDraftFrontmatter', () => {
	it('recognizes true draft values, including quoted values', () => {
		assert.equal(isDraftFrontmatter('title: Draft\ndraft: true'), true);
		assert.equal(isDraftFrontmatter('title: Draft\ndraft: "TRUE"'), true);
		assert.equal(isDraftFrontmatter('title: Draft\ndraft: true # preview only'), true);
	});

	it('keeps published and missing draft values out of the draft set', () => {
		assert.equal(isDraftFrontmatter('title: Published\ndraft: false'), false);
		assert.equal(isDraftFrontmatter('title: Published'), false);
	});
});

describe('shouldIndexPostRoute', () => {
	it('keeps drafts for duplicate-route checks but excludes them from published links', () => {
		const draft = 'title: Draft\ndraft: true';
		assert.equal(shouldIndexPostRoute(draft), true);
		assert.equal(shouldIndexPostRoute(draft, false), false);
		assert.equal(shouldIndexPostRoute('title: Published\ndraft: false', false), true);
	});
});

describe('parseFrontmatterListValue', () => {
	it('parses an inline array', () => {
		assert.deepEqual(parseFrontmatterListValue('[ETF, "Market Brief"]'), ['ETF', 'Market Brief']);
	});

	it('parses a single scalar value', () => {
		assert.deepEqual(parseFrontmatterListValue('Programming'), ['Programming']);
	});

	it('returns an empty array for blank input', () => {
		assert.deepEqual(parseFrontmatterListValue('   '), []);
	});
});

describe('parseFrontmatterListField', () => {
	it('strips comments after an inline list', () => {
		assert.deepEqual(
			parseFrontmatterListField(
				'relatedSlugs: [first-post] # links\ncategories: Programming',
				'relatedSlugs',
			),
			['first-post'],
		);
	});

	it('parses a YAML block sequence', () => {
		assert.deepEqual(
			parseFrontmatterListField(
				'relatedSlugs:\n  - first-post\n  - "second-post"\ncategories: Programming',
				'relatedSlugs',
			),
			['first-post', 'second-post'],
		);
	});

	it('parses an indentationless YAML block sequence', () => {
		assert.deepEqual(
			parseFrontmatterListField(
				'relatedSlugs:\n- first-post # first\n- second-post\ncategories: Programming',
				'relatedSlugs',
			),
			['first-post', 'second-post'],
		);
	});

	it('continues a block sequence after a comment line', () => {
		assert.deepEqual(
			parseFrontmatterListField(
				'relatedSlugs:\n  - first-post\n  # Keep this list curated\n  - missing-post\ncategories: Programming',
				'relatedSlugs',
			),
			['first-post', 'missing-post'],
		);
	});

	it('parses a multiline YAML flow sequence', () => {
		assert.deepEqual(
			parseFrontmatterListField(
				'relatedSlugs: [\n  first-post, # first\n  "second-post"\n] # links\ncategories: Programming',
				'relatedSlugs',
			),
			['first-post', 'second-post'],
		);
	});

	it('treats explicit null as an empty list', () => {
		assert.deepEqual(parseFrontmatterListField('relatedSlugs: null', 'relatedSlugs'), []);
	});
});

describe('stripQuotes', () => {
	it('removes matching surrounding quotes', () => {
		assert.equal(stripQuotes('"value"'), 'value');
		assert.equal(stripQuotes("'value'"), 'value');
	});

	it('leaves unquoted values untouched', () => {
		assert.equal(stripQuotes('value'), 'value');
	});
});

describe('stripYamlComment', () => {
	it('removes comments outside quoted values', () => {
		assert.equal(stripYamlComment('my-post # note'), 'my-post');
	});

	it('preserves hash characters inside quoted values', () => {
		assert.equal(stripYamlComment('"my#post" # note'), '"my#post"');
	});
});

describe('slugifyPathSegment', () => {
	it('lowercases and dash-collapses spaces and specials', () => {
		assert.equal(slugifyPathSegment('My Post (v2)'), 'my-post-v2');
	});

	it('preserves Korean characters', () => {
		assert.equal(slugifyPathSegment('반도체 기초'), '반도체-기초');
	});

	it('trims leading and trailing dashes', () => {
		assert.equal(slugifyPathSegment('  & hello & '), 'hello');
	});
});

describe('slugifyAstroPathSegment', () => {
	it('matches Astro github-slugger output for content paths', () => {
		assert.equal(
			slugifyAstroPathSegment('ITA (iShares US Aerospace & Defense ETF)'),
			'ita-ishares-us-aerospace--defense-etf',
		);
	});
});

describe('normalizeRoutePath', () => {
	it('strips trailing slashes and query/hash', () => {
		assert.equal(normalizeRoutePath('/blog/foo/'), '/blog/foo');
		assert.equal(normalizeRoutePath('/blog/foo?x=1#y'), '/blog/foo');
	});

	it('adds a leading slash when missing', () => {
		assert.equal(normalizeRoutePath('blog/foo'), '/blog/foo');
	});

	it('collapses an empty path to root', () => {
		assert.equal(normalizeRoutePath('/'), '/');
	});
});

describe('getStaticPageRoutePath', () => {
	it('maps Astro page and endpoint extensions to public routes', () => {
		assert.equal(getStaticPageRoutePath('about.astro'), '/about');
		for (const extension of [
			'.html',
			'.markdown',
			'.mdown',
			'.mkdn',
			'.mkd',
			'.mdwn',
			'.md',
			'.mdx',
		]) {
			assert.equal(getStaticPageRoutePath(`help${extension}`), '/help');
		}
		assert.equal(getStaticPageRoutePath('archive/index.astro'), '/archive');
		assert.equal(getStaticPageRoutePath('rss.xml.js'), '/rss.xml');
		assert.equal(getStaticPageRoutePath('search.json.ts'), '/search.json');
		assert.equal(getStaticPageRoutePath('index.astro'), '/');
		assert.equal(getStaticPageRoutePath('404.astro'), '/404.html');
		assert.equal(getStaticPageRoutePath('500.astro'), '/500.html');
	});

	it('normalizes Windows separators and excludes dynamic routes', () => {
		assert.equal(
			getStaticPageRoutePath('programming\\git-commands.astro'),
			'/programming/git-commands',
		);
		assert.equal(getStaticPageRoutePath('archive/[year]/[month].astro'), undefined);
		assert.equal(getStaticPageRoutePath('tags/[tag].astro'), undefined);
	});

	it('excludes Astro-ignored files while allowing .well-known', () => {
		assert.equal(isAstroPublicPagePath('_internal.astro'), false);
		assert.equal(isAstroPublicPagePath('private/_secret.astro'), false);
		assert.equal(isAstroPublicPagePath('.hidden.astro'), false);
		assert.equal(isAstroPublicPagePath('.well-known/security.html'), true);
		assert.equal(getStaticPageRoutePath('_internal.astro'), undefined);
		assert.equal(getStaticPageRoutePath('.well-known/security.html'), '/.well-known/security');
		assert.equal(isAstroEndpointPath('rss.xml.js'), true);
		assert.equal(isAstroEndpointPath('rss.astro'), false);
		assert.equal(isAstroEndpointPath('rss/[category].xml.js'), false);
	});
});

describe('hasTrailingSlash', () => {
	it('preserves endpoint slash information after removing query and hash', () => {
		assert.equal(hasTrailingSlash('/rss.xml/'), true);
		assert.equal(hasTrailingSlash('/rss.xml/?format=atom#top'), true);
		assert.equal(hasTrailingSlash('/rss.xml?format=atom'), false);
		assert.equal(hasTrailingSlash('/'), false);
	});
});

describe('getLinkFragment', () => {
	it('decodes fragments without including the path query', () => {
		assert.equal(getLinkFragment('/blog/post#한글%20heading?ignored'), '한글 heading?ignored');
		assert.equal(getLinkFragment('/blog/post?view=full#section'), 'section');
		assert.equal(getLinkFragment('/blog/post#foo\\_bar'), 'foo_bar');
		assert.equal(getLinkFragment('/blog/post#foo&amp;bar'), 'foo&bar');
		assert.equal(getLinkFragment('/blog/post#foo%26amp%3Bbar'), 'foo&amp;bar');
		assert.equal(getLinkFragment('/blog/post'), undefined);
		assert.equal(getLinkFragment('/blog/post#'), undefined);
	});
});

describe('getMarkdownHeadingIds', () => {
	it('matches Astro heading slugs and duplicate suffixes', async () => {
		const content =
			'---\ntitle: Example\n---\n\n# 첫 번째 제목\n\n## C++ & C#\n\n## C++ & C#\n\n## JAVA_HOME and _emphasis_';
		assert.deepEqual(
			[...(await getMarkdownHeadingIds(content))],
			['첫-번째-제목', 'c--c', 'c--c-1', 'java_home-and-emphasis'],
		);
	});

	it('matches rendered block headings and explicit HTML heading IDs', async () => {
		const content =
			'> ### 왜 최소 스왑?\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n---\n\n````md\n```\n## not-a-heading\n```\n````\n\n<h2 id=custom-anchor>Visible</h2>\n\nTitle\n---';
		assert.deepEqual(
			[...(await getMarkdownHeadingIds(content))],
			['왜-최소-스왑', 'custom-anchor', 'title'],
		);
	});

	it('preserves inline code and image heading behavior from Astro', async () => {
		const content =
			'## git add `<file>`\n\n## ![Alt](https://example.com/image.png) Link\n\n## Link ![Alt](https://example.com/image.png)';
		assert.deepEqual(
			[...(await getMarkdownHeadingIds(content))],
			['git-add-file', '-link', 'link-'],
		);
	});

	it('uses MDX frontmatter values when generating heading IDs', async () => {
		const content =
			'---\ntitle: World\n---\n\n# Hello {frontmatter.title}\n\n## Hello {frontmatter.title}';
		assert.deepEqual(
			[...(await getMarkdownHeadingIds(content, 'example.mdx'))],
			['hello-world', 'hello-world-1'],
		);
	});

	it('collects explicit IDs from MDX JSX headings', async () => {
		const content =
			'<h2 id="custom-anchor">Visible</h2>\n\n<div><h3 id="nested-anchor">Nested</h3></div>';
		assert.deepEqual(
			[...(await getMarkdownHeadingIds(content, 'example.mdx'))],
			['custom-anchor', 'nested-anchor'],
		);
	});

	it('resolves expression-valued MDX JSX heading IDs', async () => {
		const content =
			"---\nanchor: from-frontmatter\n---\n\n<h2 id={'literal-anchor'}>Literal</h2>\n\n<h3 id={frontmatter.anchor}>From frontmatter</h3>";
		assert.deepEqual(
			[...(await getMarkdownHeadingIds(content, 'example.mdx'))],
			['literal-anchor', 'from-frontmatter'],
		);
	});

	it('marks dynamic MDX JSX heading IDs as unresolved', async () => {
		const content =
			'<h2 id={42}>Numeric</h2>\n\n<h3 id={makeId()}>Computed</h3>\n\n<h4>No explicit ID</h4>';
		const headingIds = await getMarkdownHeadingIds(content, 'example.mdx');
		assert.equal(headingIds.hasUnresolvedIds, true);
		assert.deepEqual([...headingIds], []);
	});

	it('marks spread-based MDX JSX heading IDs as unresolved', async () => {
		const content = "<h2 {...{ id: 'spread-anchor' }}>Spread</h2>";
		const headingIds = await getMarkdownHeadingIds(content, 'example.mdx');
		assert.equal(headingIds.hasUnresolvedIds, true);
		assert.deepEqual([...headingIds], []);
	});

	it('marks explicit IDs followed by MDX spreads as unresolved', async () => {
		const content = '<h2 id="known" {...props}>Spread override</h2>';
		const headingIds = await getMarkdownHeadingIds(content, 'example.mdx');
		assert.equal(headingIds.hasUnresolvedIds, true);
		assert.deepEqual([...headingIds], []);
	});

	it('marks custom MDX components as unresolved', async () => {
		const content = '<CustomHeading id="custom-anchor">Custom</CustomHeading>';
		const headingIds = await getMarkdownHeadingIds(content, 'example.mdx');
		assert.equal(headingIds.hasUnresolvedIds, true);
		assert.deepEqual([...headingIds], []);
	});
});

describe('isMissingPostRoute', () => {
	const routes = new Map([['/blog/existing-post', ['/content/existing.md']]]);

	it('accepts known post routes with query, hash, or trailing slash', () => {
		assert.equal(isMissingPostRoute('/blog/existing-post/', routes), false);
		assert.equal(isMissingPostRoute('/blog/existing-post?view=full#heading', routes), false);
	});

	it('flags unknown blog routes', () => {
		assert.equal(isMissingPostRoute('/blog/missing-post', routes), true);
	});

	it('does not classify non-blog links as missing post routes', () => {
		assert.equal(isMissingPostRoute('/images/missing.png', routes), false);
		assert.equal(isMissingPostRoute('blog/missing-post', routes), false);
		assert.equal(isMissingPostRoute('https://example.com/blog/missing-post', routes), false);
	});
});

describe('isMarkdownImageLink', () => {
	it('separates image matches from ordinary Markdown links', () => {
		assert.equal(isMarkdownImageLink('![chart](/blog/chart.png)'), true);
		assert.equal(isMarkdownImageLink('[post](/blog/post/)'), false);
	});
});

describe('shouldCheckInternalLink', () => {
	it('skips external, protocol, and anchor links', () => {
		assert.equal(shouldCheckInternalLink('https://example.com'), false);
		assert.equal(shouldCheckInternalLink('mailto:a@b.com'), false);
		assert.equal(shouldCheckInternalLink('#section'), false);
		assert.equal(shouldCheckInternalLink('//cdn.example.com/x'), false);
	});

	it('checks absolute, relative, and file-extension links', () => {
		assert.equal(shouldCheckInternalLink('/images/x.png'), true);
		assert.equal(shouldCheckInternalLink('./sibling'), true);
		assert.equal(shouldCheckInternalLink('diagram.svg'), true);
	});
});

describe('stripCodeBlocks', () => {
	it('blanks fenced code content while preserving line count', () => {
		const input = 'a\n```\n$secret$\n```\nb';
		const output = stripCodeBlocks(input);
		assert.equal(output.split('\n').length, input.split('\n').length);
		assert.equal(output.includes('$secret$'), false);
		assert.equal(output.startsWith('a\n'), true);
		assert.equal(output.endsWith('\nb'), true);
	});
});

describe('hasUnbalancedBold', () => {
	it('flags an odd number of ** markers', () => {
		assert.equal(hasUnbalancedBold('this is **bold without close'), true);
	});

	it('accepts a balanced pair', () => {
		assert.equal(hasUnbalancedBold('this is **bold** text'), false);
	});

	it('ignores a horizontal rule of asterisks', () => {
		assert.equal(hasUnbalancedBold('***'), false);
	});

	it('ignores escaped markers', () => {
		assert.equal(hasUnbalancedBold('price is 2 \\**stars'), false);
	});
});

describe('countMathDelimiters', () => {
	it('counts unescaped dollar signs as inline-math risk', () => {
		assert.equal(countMathDelimiters('from $10 to $20').dollar, 2);
	});

	it('does not count escaped currency', () => {
		assert.equal(countMathDelimiters('from \\$10 to \\$20').dollar, 0);
	});

	it('ignores block math spans', () => {
		assert.equal(countMathDelimiters('inline $$x + y$$ done').dollar, 0);
	});

	it('counts tildes as strikethrough risk and ignores ~~spans~~', () => {
		assert.equal(countMathDelimiters('range 1~5 and 6~9').tilde, 2);
		assert.equal(countMathDelimiters('~~struck~~ text').tilde, 0);
	});
});

describe('getPrimaryCategory', () => {
	it('returns the normalized first category from frontmatter', () => {
		const content = '---\ntitle: X\ncategories: [cs, Programming]\n---\nbody';
		assert.equal(getPrimaryCategory(content), 'Computer Science');
	});

	it('returns undefined when there is no frontmatter', () => {
		assert.equal(getPrimaryCategory('no frontmatter here'), undefined);
	});

	it('returns undefined when categories are absent', () => {
		assert.equal(getPrimaryCategory('---\ntitle: X\n---\nbody'), undefined);
	});
});

const ROOT_DIR = path.join(path.sep, 'repo');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const POST_PATH = path.join(ROOT_DIR, 'src', 'content', 'blog', 'ETF', 'AAA', 'AAA.md');

function collectPostAssets(content) {
	return [
		...collectAssetReferences(content, {
			postPath: POST_PATH,
			publicDir: PUBLIC_DIR,
			rootDir: ROOT_DIR,
		}),
	].sort();
}

describe('collectAssetReferences', () => {
	it('collects Markdown images, HTML images, image links, and frontmatter fields', () => {
		const content = [
			'---',
			'title: AAA',
			'heroImage: /images/shared/hero.png',
			'---',
			'',
			'![alt](images/one.png)',
			'',
			'<img src="./images/two.png" alt="two" />',
			'',
			'[download](images/three.png)',
			'',
		].join('\n');

		assert.deepEqual(collectPostAssets(content), [
			'public/images/shared/hero.png',
			'src/content/blog/ETF/AAA/images/one.png',
			'src/content/blog/ETF/AAA/images/three.png',
			'src/content/blog/ETF/AAA/images/two.png',
		]);
	});

	it('ignores external URLs, data URIs, anchors, and non-asset links', () => {
		const content = [
			'![remote](https://example.com/a.png)',
			'![inline](data:image/png;base64,AAAA)',
			'[anchor](#section)',
			'[post](/blog/other-post/)',
		].join('\n');

		assert.deepEqual(collectPostAssets(content), []);
	});

	it('ignores references inside code blocks and inline code', () => {
		const content = [
			'```md',
			'![x](images/fenced.png)',
			'```',
			'',
			'`![y](images/inline.png)`',
		].join('\n');

		assert.deepEqual(collectPostAssets(content), []);
	});

	it('normalizes query strings, fragments, and percent-encoded spaces', () => {
		const content =
			'![a](images/one.png?v=2) ![b](images/two.png#fig) ![c](images/with%20space.png)';

		assert.deepEqual(collectPostAssets(content), [
			'src/content/blog/ETF/AAA/images/one.png',
			'src/content/blog/ETF/AAA/images/two.png',
			'src/content/blog/ETF/AAA/images/with space.png',
		]);
	});

	it('ignores an explicitly null frontmatter image field', () => {
		const content = ['---', 'title: AAA', 'heroImage: null', 'image:', '---', ''].join('\n');

		assert.deepEqual(collectPostAssets(content), []);
	});
});

describe('collectSiteAssetReferences', () => {
	it('collects public image paths referenced from site source files', () => {
		const content = [
			'const hero = "/images/site/banner.png";',
			'background: url(/images/site/bg.svg);',
		].join('\n');

		assert.deepEqual(
			[...collectSiteAssetReferences(content, { publicDir: PUBLIC_DIR, rootDir: ROOT_DIR })].sort(),
			['public/images/site/banner.png', 'public/images/site/bg.svg'],
		);
	});

	it('ignores non-asset paths that start with the images prefix', () => {
		const content = 'href="/images/index.html"';

		assert.deepEqual(
			[...collectSiteAssetReferences(content, { publicDir: PUBLIC_DIR, rootDir: ROOT_DIR })],
			[],
		);
	});
});

describe('findUnusedAssets', () => {
	const assets = [
		'public/images/used.png',
		'public/images/unused.png',
		'src/content/blog/ETF/AAA/images/used.png',
		'src/content/blog/ETF/AAA/images/unused.png',
	];

	it('reports only assets that no reference points at', () => {
		assert.deepEqual(
			findUnusedAssets({
				assets,
				references: ['public/images/used.png', 'src/content/blog/ETF/AAA/images/used.png'],
			}),
			['public/images/unused.png', 'src/content/blog/ETF/AAA/images/unused.png'],
		);
	});

	it('treats a reference written with backslashes as the same asset', () => {
		assert.deepEqual(
			findUnusedAssets({
				assets: ['src/content/blog/ETF/AAA/images/used.png'],
				references: ['src\\content\\blog\\ETF\\AAA\\images\\used.png'],
			}),
			[],
		);
	});

	it('honors exact and directory-prefix allowlist entries', () => {
		assert.deepEqual(
			findUnusedAssets({
				assets,
				references: [],
				allowlist: ['public/images/', 'src/content/blog/ETF/AAA/images/unused.png'],
			}),
			['src/content/blog/ETF/AAA/images/used.png'],
		);
	});

	it('returns an empty list when there are no assets', () => {
		assert.deepEqual(findUnusedAssets(), []);
	});
});

describe('formatByteSize', () => {
	it('formats bytes, kibibytes, and mebibytes', () => {
		assert.equal(formatByteSize(0), '0 B');
		assert.equal(formatByteSize(512), '512 B');
		assert.equal(formatByteSize(2048), '2.0 KiB');
		assert.equal(formatByteSize(64073318), '61.1 MiB');
	});

	it('treats invalid input as zero', () => {
		assert.equal(formatByteSize(undefined), '0 B');
		assert.equal(formatByteSize(-5), '0 B');
	});
});

describe('getRouteSegments', () => {
	it('drops the blog prefix and empty segments', () => {
		assert.deepEqual(getRouteSegments('/blog/etf/basics/one/'), ['etf', 'basics', 'one']);
	});

	it('handles an empty value', () => {
		assert.deepEqual(getRouteSegments(undefined), []);
	});
});

describe('getDerivedRouteIssues', () => {
	function codesFor(routePath) {
		return getDerivedRouteIssues(routePath).map((issue) => issue.code);
	}

	it('reports a repeated last segment', () => {
		assert.deepEqual(codesFor('/blog/etf/broad-market/nasdaq-next-gen-100/qqqj/qqqj'), [
			'duplicate-segment',
		]);
	});

	it('reports a non-ASCII segment', () => {
		assert.deepEqual(codesFor('/blog/reports/26년-2월/삼성전자-리포트'), ['non-ascii-segment']);
	});

	it('reports a filename-only last segment', () => {
		assert.deepEqual(codesFor('/blog/programming/rag-day1/readme'), ['meaningless-segment']);
		assert.deepEqual(codesFor('/blog/programming/rag-day1/index'), ['meaningless-segment']);
	});

	it('reports every problem a route has', () => {
		assert.deepEqual(codesFor('/blog/보고서/보고서/readme'), [
			'duplicate-segment',
			'non-ascii-segment',
			'meaningless-segment',
		]);
	});

	it('accepts a clean ASCII route', () => {
		assert.deepEqual(codesFor('/blog/programming/powershell-profile-guide'), []);
	});

	it('does not treat non-adjacent repeats as duplicates', () => {
		assert.deepEqual(codesFor('/blog/etf/gold/etf-basics'), []);
	});

	it('includes the route in every message', () => {
		for (const issue of getDerivedRouteIssues('/blog/etf/qqqj/qqqj')) {
			assert.ok(issue.message.includes('/blog/etf/qqqj/qqqj'));
		}
	});
});

describe('foldTagForComparison', () => {
	it('ignores case, spacing, hyphens, underscores, and dots', () => {
		const folded = ['Option Income', 'option-income', 'OPTION_INCOME', 'option.income'].map(
			foldTagForComparison,
		);

		assert.equal(new Set(folded).size, 1);
	});

	it('keeps different tags apart', () => {
		assert.notEqual(foldTagForComparison('ETF'), foldTagForComparison('ETN'));
	});

	it('handles an empty value', () => {
		assert.equal(foldTagForComparison(undefined), '');
	});
});

describe('findTagVariantCollisions', () => {
	it('groups tags that differ only in spelling', () => {
		assert.deepEqual(findTagVariantCollisions(['Version Control', 'version-control', 'Git']), [
			['Version Control', 'version-control'],
		]);
	});

	it('returns nothing when every tag is distinct', () => {
		assert.deepEqual(findTagVariantCollisions(['ETF', 'Git', 'CLI', '구리']), []);
	});

	it('treats the same spelling used twice as one tag', () => {
		assert.deepEqual(findTagVariantCollisions(['ETF', 'ETF']), []);
	});

	it('ignores empty entries', () => {
		assert.deepEqual(findTagVariantCollisions(['', '   ', undefined, 'ETF']), []);
	});

	it('reports several colliding groups', () => {
		const groups = findTagVariantCollisions([
			'Developer Tools',
			'developer tools',
			'Nasdaq-100',
			'nasdaq 100',
		]);

		assert.equal(groups.length, 2);
	});
});
