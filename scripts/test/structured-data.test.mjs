import test from 'node:test';
import assert from 'node:assert/strict';
import {
	buildBlogPostingJsonLd,
	buildBreadcrumbJsonLd,
	serializeJsonLd,
} from '../../src/lib/structuredData.mjs';

test('buildBlogPostingJsonLd includes post metadata and optional fields', () => {
	const result = buildBlogPostingJsonLd({
		title: 'ETF <guide>',
		description: 'A practical guide',
		canonicalUrl: 'https://chocobreeze.github.io/blog/etf-guide/',
		imageUrl: 'https://chocobreeze.github.io/og/etf-guide.png',
		datePublished: '2026-08-25T00:00:00.000Z',
		dateModified: '2026-08-26T00:00:00.000Z',
		articleSection: 'ETF',
	});

	assert.equal(result['@type'], 'BlogPosting');
	assert.equal(result.headline, 'ETF <guide>');
	assert.equal(result.url, 'https://chocobreeze.github.io/blog/etf-guide/');
	assert.equal(result.image, 'https://chocobreeze.github.io/og/etf-guide.png');
	assert.equal(result.datePublished, '2026-08-25T00:00:00.000Z');
	assert.equal(result.dateModified, '2026-08-26T00:00:00.000Z');
	assert.equal(result.articleSection, 'ETF');
	assert.deepEqual(result.author, {
		'@type': 'Person',
		name: 'ChocoBreeze',
		url: 'https://github.com/ChocoBreeze',
	});
});

test('buildBlogPostingJsonLd omits unavailable optional values', () => {
	const result = buildBlogPostingJsonLd({
		title: 'Legacy post',
		description: '',
		canonicalUrl: 'https://chocobreeze.github.io/blog/legacy-post/',
	});

	assert.equal('description' in result, false);
	assert.equal('image' in result, false);
	assert.equal('datePublished' in result, false);
	assert.equal('dateModified' in result, false);
	assert.equal('articleSection' in result, false);
});

test('buildBreadcrumbJsonLd uses absolute URLs and optional category', () => {
	const withCategory = buildBreadcrumbJsonLd({
		siteUrl: 'https://chocobreeze.github.io/',
		canonicalUrl: 'https://chocobreeze.github.io/blog/post/',
		title: '현재 글',
		category: { label: 'ETF', href: '/etf' },
	});

	assert.deepEqual(withCategory.itemListElement, [
		{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://chocobreeze.github.io/' },
		{ '@type': 'ListItem', position: 2, name: 'ETF', item: 'https://chocobreeze.github.io/etf' },
		{
			'@type': 'ListItem',
			position: 3,
			name: '현재 글',
			item: 'https://chocobreeze.github.io/blog/post/',
		},
	]);

	const withoutCategory = buildBreadcrumbJsonLd({
		siteUrl: 'https://chocobreeze.github.io/',
		canonicalUrl: 'https://chocobreeze.github.io/blog/post/',
		title: '현재 글',
	});
	assert.equal(withoutCategory.itemListElement.length, 2);
});

test('serializeJsonLd preserves values while escaping script-sensitive characters', () => {
	const value = { headline: '<script> & 제목', nested: { quote: '"확인"' } };
	const serialized = serializeJsonLd(value);

	assert.equal(serialized.includes('<'), false);
	assert.deepEqual(JSON.parse(serialized), value);
});
