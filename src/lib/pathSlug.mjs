export function slugifyPathSegment(segment) {
	return segment
		.trim()
		.toLowerCase()
		.replace(/\.[ \t]+/g, '-')
		.replace(/[()[\]{}]/g, '')
		.replace(/[&+]/g, '-')
		.replace(/[^\p{L}\p{N}_-]+/gu, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}
