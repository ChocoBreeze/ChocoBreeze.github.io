// @ts-check

import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkCjkFriendly from 'remark-cjk-friendly';

import rehypeHeadingMath from './src/lib/rehypeHeadingMath.mjs';
import { getRedirectSourcePaths, toAstroRedirects } from './src/data/postRedirects.mjs';
import remarkTickerLinks from './src/lib/remarkTickerLinks.mjs';

// Old post URLs are kept alive as redirect pages, but they must not be listed
// as canonical URLs in the sitemap.
const redirectSourcePaths = new Set(getRedirectSourcePaths());

// Drafts are visible in `astro dev` only (src/lib/posts.ts), so ticker links may
// point at a draft ETF post only there. The hook below sets this before any
// Markdown renders.
const tickerLinkOptions = { contentDir: './src/content/blog', includeDrafts: false };

// https://astro.build/config
export default defineConfig({
	site: 'https://chocobreeze.github.io',
	redirects: toAstroRedirects(),
	integrations: [
		{
			name: 'ticker-link-drafts',
			hooks: {
				'astro:config:setup': ({ command }) => {
					tickerLinkOptions.includeDrafts = command === 'dev';
				},
			},
		},
		mdx(),
		sitemap({
			filter: (page) => !redirectSourcePaths.has(new URL(page).pathname),
		}),
	],
	compressHTML: true,
	markdown: {
		processor: unified({
			// Lets `**bold**` close before Korean particles, e.g. `**"인용"**입니다` or `**-0.9%**였습니다`,
			// which plain CommonMark flanking rules leave as literal asterisks.
			remarkPlugins: [remarkCjkFriendly, remarkMath, [remarkTickerLinks, tickerLinkOptions]],
			// rehypeHeadingMath must follow rehypeKatex: it reads KaTeX output in headings.
			rehypePlugins: [[rehypeKatex, { strict: 'ignore' }], rehypeHeadingMath],
		}),
		shikiConfig: {
			theme: 'github-dark',
		},
	},
});
