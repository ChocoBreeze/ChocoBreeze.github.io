import { render, type CollectionEntry } from 'astro:content';
import { normalizeCategory, type BlogCategoryKey } from '../data/blogCategories';
import { slugifyBlogCategoryKey } from '../data/blogTaxonomy.mjs';
import { buildSearchSections } from './searchSections.mjs';
import { getSearchTextSegment } from './searchText.mjs';

const EXCERPT_LENGTH = 480;

type BlogPost = CollectionEntry<'blog'>;

function getExcerpt(plainText: string) {
	if (plainText.length <= EXCERPT_LENGTH) {
		return plainText;
	}

	return `${plainText.slice(0, EXCERPT_LENGTH).trim()}...`;
}

// The body is indexed in full. It used to stop at 5,000 characters, which left
// the rest of every long post unsearchable (plan 28).
function getSearchText(plainText: string) {
	return getSearchTextSegment(plainText, {
		excerptLength: EXCERPT_LENGTH,
		maxLength: plainText.length,
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
			const { text, anchors } = buildSearchSections(
				body,
				headings.map((heading) => heading.slug),
			);

			return {
				t: post.data.title,
				d: post.data.description,
				c: post.data.categories,
				g: post.data.tags ?? [],
				h: headings.map((heading) => heading.text),
				e: getExcerpt(text),
				x: getSearchText(text),
				// Heading offsets inside `e + x`, so a result can link to the section
				// that matched instead of the top of the post.
				v: anchors,
				s: post.data.slug || post.id,
			};
		}),
	);
}
