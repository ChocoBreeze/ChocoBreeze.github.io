import { getPublishedPosts } from '../lib/posts';
import { createSearchIndex } from '../lib/searchIndex';

export async function GET() {
	const posts = await getPublishedPosts();
	const searchIndex = await createSearchIndex(posts);

	return new Response(JSON.stringify(searchIndex), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'X-Content-Type-Options': 'nosniff',
		},
	});
}
