import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	countMathDelimiters,
	getPrimaryCategory,
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
