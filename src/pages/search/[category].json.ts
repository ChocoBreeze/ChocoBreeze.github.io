import { getPublishedPosts } from '../../lib/posts';
import { BLOG_CATEGORIES, type BlogCategoryDefinition } from '../../data/blogCategories';
import {
	createSearchIndex,
	getSearchCategorySlug,
	postMatchesSearchCategory,
} from '../../lib/searchIndex';

type SearchCategoryProps = {
	category: BlogCategoryDefinition;
};

export function getStaticPaths() {
	return BLOG_CATEGORIES.map((category) => ({
		params: { category: getSearchCategorySlug(category.key) },
		props: { category },
	}));
}

export async function GET({ props }: { props: SearchCategoryProps }) {
	const posts = (await getPublishedPosts()).filter((post) =>
		postMatchesSearchCategory(post, props.category.key),
	);
	const searchIndex = await createSearchIndex(posts);

	return new Response(JSON.stringify(searchIndex), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'X-Content-Type-Options': 'nosniff',
		},
	});
}
