const DEFAULT_EXCERPT_LENGTH = 480;
const DEFAULT_SEARCH_TEXT_LENGTH = 5000;

/**
 * Return the body segment used for search after the separately stored result
 * excerpt. The client can concatenate both fields to preserve queries that
 * cross the excerpt boundary without duplicating the payload here.
 *
 * @param {string} plainText
 * @param {{ excerptLength?: number, maxLength?: number }} options
 */
export function getSearchTextSegment(
	plainText,
	{ excerptLength = DEFAULT_EXCERPT_LENGTH, maxLength = DEFAULT_SEARCH_TEXT_LENGTH } = {},
) {
	const excerptBoundary = Number.isInteger(excerptLength) && excerptLength >= 0 ? excerptLength : 0;
	const plainTextValue = String(plainText ?? '');
	if (plainTextValue.length <= excerptBoundary) return '';

	const start = excerptBoundary;
	const end = Number.isInteger(maxLength) && maxLength >= start ? maxLength : start;
	const segment = plainTextValue.slice(start, end);
	const hasBoundaryWhitespace = /\s$/.test(plainTextValue.slice(0, start)) || /^\s/.test(segment);
	return `${hasBoundaryWhitespace ? ' ' : ''}${segment.trim()}`;
}

/**
 * Return logical body candidates for client-side matching. The second form
 * accounts for whitespace trimmed at the excerpt boundary.
 *
 * @param {string} excerpt
 * @param {string} searchText
 */
export function getSearchTextCandidates(excerpt, searchText) {
	const searchValue = String(searchText ?? '');
	const excerptValue = searchValue
		? String(excerpt ?? '').replace(/\.\.\.$/, '')
		: String(excerpt ?? '');
	if (!searchValue) return excerptValue ? [excerptValue] : [];

	return [`${excerptValue}${searchValue}`];
}
