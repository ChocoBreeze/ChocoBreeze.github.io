import { getPublishedPosts } from '../../lib/posts';
import { createQuickSearchIndex } from '../../lib/quickSearch.mjs';

export async function GET() {
	const posts = await getPublishedPosts();
	const searchIndex = createQuickSearchIndex(posts);

	return new Response(JSON.stringify(searchIndex), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
			'X-Content-Type-Options': 'nosniff',
		},
	});
}
