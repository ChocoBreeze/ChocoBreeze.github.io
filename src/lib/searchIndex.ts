import { render, type CollectionEntry } from 'astro:content';
import { normalizeCategory, type BlogCategoryKey } from '../data/blogCategories';

const EXCERPT_LENGTH = 480;
const SEARCH_TEXT_LENGTH = 5000;

const SEARCH_CATEGORY_SLUGS: Record<BlogCategoryKey, string> = {
	ETF: 'etf',
	Economics: 'economics',
	Semiconductor: 'semiconductor',
	'Computer Science': 'computer-science',
	Programming: 'programming',
	Problem_Solving: 'problem-solving',
	Reports: 'reports',
	'Market Brief': 'market-brief',
};

type BlogPost = CollectionEntry<'blog'>;

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

export function getSearchCategorySlug(category: BlogCategoryKey) {
	return SEARCH_CATEGORY_SLUGS[category];
}

export function postMatchesSearchCategory(post: BlogPost, category: BlogCategoryKey) {
	const categories = post.data.categories;
	const categoryList = Array.isArray(categories) ? categories : categories ? [categories] : [];
	return categoryList.map(normalizeCategory).includes(category);
}

export async function createSearchIndex(posts: BlogPost[]) {
	return Promise.all(
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
}
