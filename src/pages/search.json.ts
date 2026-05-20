import { getCollection, render } from 'astro:content';

const EXCERPT_LENGTH = 480;

function stripMarkdown(content: string) {
	return content
		.replace(/---[\s\S]*?---/, ' ')
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/[#>*_\-|]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function getExcerpt(content: string) {
	const plainText = stripMarkdown(content);
	if (plainText.length <= EXCERPT_LENGTH) {
		return plainText;
	}

	return `${plainText.slice(0, EXCERPT_LENGTH).trim()}...`;
}

export async function GET() {
	const posts = await getCollection('blog');
	const searchIndex = await Promise.all(
		posts.map(async (post) => {
			const { headings } = await render(post);
			const body = (post as { body?: string }).body ?? '';

			return {
				title: post.data.title,
				description: post.data.description,
				categories: post.data.categories,
				tags: post.data.tags ?? [],
				headings: headings.map((heading) => heading.text),
				excerpt: getExcerpt(body),
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
