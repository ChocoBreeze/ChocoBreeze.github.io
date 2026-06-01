import { getCollection } from 'astro:content';
import { createCodeSearchIndex } from '../lib/codeSearchIndex';

export async function GET() {
	const posts = await getCollection('blog');
	const searchIndex = await createCodeSearchIndex(posts);

	return new Response(JSON.stringify(searchIndex), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'X-Content-Type-Options': 'nosniff',
		},
	});
}
