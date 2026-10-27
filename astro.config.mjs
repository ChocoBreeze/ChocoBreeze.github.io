// @ts-check

import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkCjkFriendly from 'remark-cjk-friendly';

import { getRedirectSourcePaths, toAstroRedirects } from './src/data/postRedirects.mjs';

// Old post URLs are kept alive as redirect pages, but they must not be listed
// as canonical URLs in the sitemap.
const redirectSourcePaths = new Set(getRedirectSourcePaths());

// https://astro.build/config
export default defineConfig({
	site: 'https://chocobreeze.github.io',
	redirects: toAstroRedirects(),
	integrations: [
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
			remarkPlugins: [remarkCjkFriendly, remarkMath],
			rehypePlugins: [[rehypeKatex, { strict: 'ignore' }]],
		}),
		shikiConfig: {
			theme: 'github-dark',
		},
	},
});
