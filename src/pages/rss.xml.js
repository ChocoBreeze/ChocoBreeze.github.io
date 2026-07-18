import { getPublishedPosts } from '../lib/posts';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { getFeedItems } from '../lib/rss';

export async function GET(context) {
	const posts = await getPublishedPosts();

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: getFeedItems(posts),
		customData: '<language>ko-KR</language>',
	});
}
