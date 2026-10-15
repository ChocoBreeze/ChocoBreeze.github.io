// @ts-check

import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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
			remarkPlugins: [remarkMath],
			rehypePlugins: [[rehypeKatex, { strict: 'ignore' }]],
		}),
		shikiConfig: {
			theme: 'github-dark',
		},
	},
});
