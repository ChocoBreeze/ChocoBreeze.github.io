const KOREAN_CHARACTERS_PER_MINUTE = 500;
const WORDS_PER_MINUTE = 200;
const CODE_LINES_PER_MINUTE = 12;

const FRONTMATTER_PATTERN = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;
const CODE_BLOCK_PATTERN = /```[\s\S]*?```|~~~[\s\S]*?~~~/g;

/**
 * Estimate reading time from Markdown content.
 *
 * Korean characters, general Latin/numeric words, and fenced code blocks are
 * counted separately so code is not double-counted as prose.
 */
export function estimateReadingTime(markdown = '') {
	const source = typeof markdown === 'string' ? markdown : '';
	const withoutFrontmatter = source.replace(FRONTMATTER_PATTERN, '');
	const codeBlocks = withoutFrontmatter.match(CODE_BLOCK_PATTERN) ?? [];
	const prose = withoutFrontmatter.replace(CODE_BLOCK_PATTERN, ' ');
	const koreanCharacters = (prose.match(/[가-힣]/g) ?? []).length;
	const words = prose.match(/[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*/g)?.length ?? 0;
	const codeLines = codeBlocks.reduce((total, block) => {
		const lines = block.split(/\r?\n/);
		return total + Math.max(1, lines.length - 2);
	}, 0);

	const minutes = Math.max(
		1,
		Math.ceil(
			koreanCharacters / KOREAN_CHARACTERS_PER_MINUTE +
				words / WORDS_PER_MINUTE +
				codeLines / CODE_LINES_PER_MINUTE,
		),
	);

	return { minutes, koreanCharacters, words, codeLines };
}
