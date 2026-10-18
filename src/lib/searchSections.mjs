import { stripMarkdown } from './searchMarkdown.mjs';

const FENCE_REGEX = /^\s{0,3}(```+|~~~+)/;
const ATX_HEADING_REGEX = /^\s{0,3}#{1,6}\s+\S/;

/**
 * Splits a Markdown body at its headings so each chunk of plain text can be
 * traced back to the heading anchor that precedes it.
 *
 * Heading anchors come from Astro's rendered headings (same order as the source
 * document) rather than being re-slugified here, so a search result links to the
 * anchor the page actually has, including Astro's de-duplication suffixes.
 *
 * Headings inside fenced code blocks are not headings, so fences are tracked.
 *
 * @param {string} body raw Markdown body, without frontmatter
 * @param {string[]} headingSlugs rendered heading slugs in document order
 * @returns {{ anchor: string | undefined, markdown: string }[]}
 */
export function splitMarkdownSections(body, headingSlugs = []) {
	const lines = String(body ?? '').split(/\r?\n/);
	const sections = [{ anchor: undefined, lines: [] }];
	let fence;
	let headingCount = 0;

	for (const line of lines) {
		const fenceMatch = line.match(FENCE_REGEX);
		if (fenceMatch) {
			const marker = fenceMatch[1][0];
			if (!fence) {
				fence = marker;
			} else if (fence === marker) {
				fence = undefined;
			}
		}

		if (!fence && ATX_HEADING_REGEX.test(line)) {
			sections.push({ anchor: headingSlugs[headingCount], lines: [line] });
			headingCount += 1;
			continue;
		}

		sections.at(-1).lines.push(line);
	}

	// If the heading count disagrees with what Astro rendered (setext headings,
	// HTML headings, or a parser difference), drop the anchors rather than point
	// at the wrong section.
	const anchorsAreTrustworthy = headingCount === headingSlugs.length;

	return sections
		.map((section) => ({
			anchor: anchorsAreTrustworthy ? section.anchor : undefined,
			markdown: section.lines.join('\n'),
		}))
		.filter((section) => section.markdown.trim().length > 0);
}

/**
 * Builds the plain-text body used for searching, plus the offset at which each
 * heading section starts inside it.
 *
 * @param {string} body raw Markdown body, without frontmatter
 * @param {string[]} headingSlugs rendered heading slugs in document order
 * @returns {{ text: string, anchors: [number, string][] }}
 */
export function buildSearchSections(body, headingSlugs = []) {
	const sections = splitMarkdownSections(body, headingSlugs);
	const anchors = [];
	const parts = [];
	let offset = 0;

	for (const section of sections) {
		const text = stripMarkdown(section.markdown);
		if (!text) {
			continue;
		}

		if (section.anchor) {
			anchors.push([offset, section.anchor]);
		}

		parts.push(text);
		// `+ 1` accounts for the single space the parts are joined with below.
		offset += text.length + 1;
	}

	return { text: parts.join(' '), anchors };
}

/**
 * Returns the anchor of the section containing `offset`, or undefined when the
 * offset falls before the first heading.
 *
 * @param {[number, string][]} anchors
 * @param {number} offset
 */
export function findAnchorForOffset(anchors, offset) {
	if (!Array.isArray(anchors) || !Number.isFinite(offset) || offset < 0) {
		return undefined;
	}

	let found;
	for (const entry of anchors) {
		const [start, anchor] = Array.isArray(entry) ? entry : [];
		if (typeof start !== 'number' || start > offset) {
			break;
		}

		found = anchor;
	}

	return found;
}
