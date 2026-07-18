import type { APIRoute } from 'astro';
import { getCategoryDefinition } from '../../data/blogCategories';
import { renderOgImage } from '../../lib/og';
import { getPublishedPosts } from '../../lib/posts';

type OgProps = {
	title: string;
	category?: string;
};

// A post needs a generated OG image only when it has no hero/Jekyll image of
// its own — those posts already have a picture to share.
function hasOwnImage(post: { data: { heroImage?: unknown; image?: unknown } }): boolean {
	return Boolean(post.data.heroImage || post.data.image);
}

export async function getStaticPaths() {
	const posts = await getPublishedPosts();
	return posts
		.filter((post) => !hasOwnImage(post))
		.map((post) => ({
			params: { slug: post.data.slug || post.id },
			props: {
				title: post.data.title,
				category: getCategoryDefinition(post.data.categories)?.label,
			} satisfies OgProps,
		}));
}

export const GET: APIRoute = async ({ props }) => {
	const { title, category } = props as OgProps;
	const png = await renderOgImage({ title, category });

	return new Response(new Uint8Array(png), {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	});
};
