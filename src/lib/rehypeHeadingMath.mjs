import GithubSlugger from 'github-slugger';
import { toHtml } from 'hast-util-to-html';

// Astro builds each heading's `text` (and its id) by concatenating every text
// node inside it. For a heading that contains KaTeX output, that means the
// MathML text, the TeX annotation and the HTML glyphs all run together, with
// `{` rewritten to `${`, so the table of contents shows something like
// `⌈d12⌉+1\lceil \tfrac${d_1}${2} \rceil⌈2d1​​⌉`.
//
// This plugin runs after rehype-katex and before Astro's heading collection.
// For headings that contain math only, it sets a readable id (Astro keeps an
// id that is already present) and records a TOC label with the formulas
// rendered in `remarkPluginFrontmatter.tocLabels`, keyed by that id.
// Headings without math are left for Astro to handle as before.

const HEADING_TAG = /^h[1-6]$/;

function hasClass(node, className) {
	const value = node.properties?.className;
	return Array.isArray(value) && value.includes(className);
}

function isMath(node) {
	return node.type === 'element' && (hasClass(node, 'katex') || hasClass(node, 'katex-display'));
}

function containsMath(node) {
	return isMath(node) || (node.children ?? []).some(containsMath);
}

function findTex(node) {
	if (node.type === 'element' && node.tagName === 'annotation') {
		return (node.children ?? []).map((child) => child.value ?? '').join('');
	}
	for (const child of node.children ?? []) {
		const tex = findTex(child);
		if (tex) return tex;
	}
	return '';
}

// Plain text of a heading with each formula replaced by its TeX source.
function headingText(node) {
	if (isMath(node)) return findTex(node);
	if (node.type === 'text') return node.value;
	return (node.children ?? []).map(headingText).join('');
}

// TOC label: the heading's text plus the rendered formulas. Other inline
// formatting (<strong>, <code>, ...) is unwrapped so the entry looks like the
// plain-text TOC entries around it.
function labelHtml(node) {
	if (isMath(node)) return toHtml(node);
	if (node.type === 'text') return toHtml(node);
	return (node.children ?? []).map(labelHtml).join('');
}

function collectHeadings(node, headings = []) {
	if (node.type === 'element' && HEADING_TAG.test(node.tagName)) {
		headings.push(node);
		return headings;
	}
	for (const child of node.children ?? []) collectHeadings(child, headings);
	return headings;
}

export default function rehypeHeadingMath() {
	return (tree, file) => {
		const slugger = new GithubSlugger();
		const tocLabels = {};

		for (const heading of collectHeadings(tree)) {
			if (!containsMath(heading)) continue;

			heading.properties ??= {};
			if (typeof heading.properties.id !== 'string') {
				heading.properties.id = slugger.slug(headingText(heading).trim());
			}
			tocLabels[heading.properties.id] = labelHtml(heading).trim();
		}

		if (Object.keys(tocLabels).length === 0) return;
		file.data.astro ??= {};
		file.data.astro.frontmatter ??= {};
		file.data.astro.frontmatter.tocLabels = tocLabels;
	};
}
