const JSON_SCRIPT_ESCAPE_MAP = {
	'<': '\\u003c',
	'>': '\\u003e',
	'&': '\\u0026',
	'\u2028': '\\u2028',
	'\u2029': '\\u2029',
};

export function buildBlogPostingJsonLd({
	title,
	description,
	canonicalUrl,
	imageUrl,
	datePublished,
	dateModified,
	articleSection,
	authorName = 'ChocoBreeze',
	authorUrl = 'https://github.com/ChocoBreeze',
}) {
	return {
		'@type': 'BlogPosting',
		headline: title,
		url: canonicalUrl,
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': canonicalUrl,
		},
		...(description ? { description } : {}),
		...(imageUrl ? { image: imageUrl } : {}),
		...(datePublished ? { datePublished } : {}),
		...(dateModified ? { dateModified } : {}),
		...(articleSection ? { articleSection } : {}),
		author: {
			'@type': 'Person',
			name: authorName,
			...(authorUrl ? { url: authorUrl } : {}),
		},
	};
}

export function buildBreadcrumbJsonLd({ siteUrl, canonicalUrl, title, category }) {
	const breadcrumbEntries = [
		{ name: 'Home', url: siteUrl },
		...(category
			? [{ name: category.label, url: new URL(category.href, siteUrl).toString() }]
			: []),
		{ name: title, url: canonicalUrl },
	];

	return {
		'@type': 'BreadcrumbList',
		itemListElement: breadcrumbEntries.map((entry, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: entry.name,
			item: entry.url,
		})),
	};
}

export function serializeJsonLd(value) {
	return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => {
		return JSON_SCRIPT_ESCAPE_MAP[character];
	});
}
