import { getCollection, render } from 'astro:content';

export async function GET() {
	const posts = await getCollection('blog');
	const searchIndex = await Promise.all(
		posts.map(async (post) => {
			const { headings } = await render(post);

			return {
				title: post.data.title,
				description: post.data.description,
				categories: post.data.categories,
				tags: post.data.tags ?? [],
				headings: headings.map((heading) => heading.text),
				slug: post.data.slug || post.id,
			};
		}),
	);

	return new Response(JSON.stringify(searchIndex), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'X-Content-Type-Options': 'nosniff',
		},
	});
}
