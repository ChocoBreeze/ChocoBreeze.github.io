import { render, type CollectionEntry } from 'astro:content';
import { normalizeCategory, type BlogCategoryKey } from '../data/blogCategories';
import { slugifyBlogCategoryKey } from '../data/blogTaxonomy.mjs';
import { stripMarkdown } from './searchMarkdown.mjs';
import { getSearchTextSegment } from './searchText.mjs';

const EXCERPT_LENGTH = 480;
const SEARCH_TEXT_LENGTH = 5000;

type BlogPost = CollectionEntry<'blog'>;

function getExcerpt(content: string) {
	const plainText = stripMarkdown(content);
	if (plainText.length <= EXCERPT_LENGTH) {
		return plainText;
	}

	return `${plainText.slice(0, EXCERPT_LENGTH).trim()}...`;
}

function getSearchText(content: string) {
	return getSearchTextSegment(stripMarkdown(content), {
		excerptLength: EXCERPT_LENGTH,
		maxLength: SEARCH_TEXT_LENGTH,
	});
}

export function getSearchCategorySlug(category: BlogCategoryKey) {
	return slugifyBlogCategoryKey(category)!;
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
