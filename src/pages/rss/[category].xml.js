import { getPublishedPosts } from '../../lib/posts';
import rss from '@astrojs/rss';
import { SITE_TITLE } from '../../consts';
import {
	getCategoryByFeedSlug,
	getFeedItems,
	getCategoryFeedPath,
	postMatchesCategory,
} from '../../lib/rss';
import { BLOG_CATEGORIES } from '../../data/blogCategories';

export function getStaticPaths() {
	return BLOG_CATEGORIES.map((category) => {
		const feedPath = getCategoryFeedPath(category.key);
		const slug = feedPath?.split('/').at(-1)?.replace('.xml', '');

		return {
			params: { category: slug },
			props: { category },
		};
	});
}

export async function GET(context) {
	const category = context.props.category ?? getCategoryByFeedSlug(context.params.category);
	const posts = (await getPublishedPosts()).filter((post) => postMatchesCategory(post, category.key));

	return rss({
		title: `${category.title} | ${SITE_TITLE}`,
		description: category.description,
		site: context.site,
		items: getFeedItems(posts),
		customData: '<language>ko-KR</language>',
	});
}
