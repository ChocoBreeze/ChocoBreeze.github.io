export function normalizePostReference(value) {
	let reference = String(value ?? '')
		.trim()
		.replace(/\\/g, '/');

	const contentMarker = '/src/content/blog/';
	const contentMarkerIndex = reference.toLowerCase().lastIndexOf(contentMarker);
	if (contentMarkerIndex >= 0) {
		reference = reference.slice(contentMarkerIndex + contentMarker.length);
	} else {
		reference = reference.replace(/^\.?\/?(?:src\/)?content\/blog\//i, '');
	}

	return reference
		.replace(/^\/blog\//i, '')
		.replace(/^\/+|\/+$/g, '')
		.replace(/\.(?:md|mdx)$/i, '');
}
