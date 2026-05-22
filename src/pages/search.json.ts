import { getCollection, render } from 'astro:content';

const EXCERPT_LENGTH = 480;
const SEARCH_TEXT_LENGTH = 5000;

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

function getSearchText(content: string) {
	return stripMarkdown(content).slice(0, SEARCH_TEXT_LENGTH).trim();
}

export async function GET() {
	const posts = await getCollection('blog');
	const searchIndex = await Promise.all(
		posts.map(async (post) => {
			const { headings } = await render(post);
			const body = (post as { body?: string }).body ?? '';

			return {
				t: post.data.title,
				d: post.data.description,
				c: post.data.categories,
				g: post.data.tags ?? [],
				h: headings.map((heading) => heading.text),
				e: getExcerpt(body),
				x: getSearchText(body),
				s: post.data.slug || post.id,
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
