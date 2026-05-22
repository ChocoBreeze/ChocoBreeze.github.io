import { getCollection } from 'astro:content';
import { createSearchIndex } from '../lib/searchIndex';

export async function GET() {
	const posts = await getCollection('blog');
	const searchIndex = await createSearchIndex(posts);

	return new Response(JSON.stringify(searchIndex), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'X-Content-Type-Options': 'nosniff',
		},
	});
}
