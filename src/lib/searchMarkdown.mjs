// Inline code is unwrapped in the same pass that drops Markdown backslash
// escapes (`\$`, `\_`, `\*`), so a backslash inside inline code is kept.
export function stripMarkdown(content) {
	return String(content ?? '')
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/~~~[\s\S]*?~~~/g, ' ')
		.replace(/`([^`]+)`|\\([!-/:-@[-`{-~])/g, (_match, code, escaped) => code ?? escaped)
		.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/(^|\|)\s*:?-{3,}:?\s*(?=\||$)/gm, '$1 ')
		.replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, ' ')
		.replace(/^\s{0,3}#{1,6}\s+/gm, ' ')
		.replace(/^\s*>\s?/gm, ' ')
		.replace(/^\s*[-*+]\s+/gm, ' ')
		.replace(/^\s*\d+[.)]\s+/gm, ' ')
		.replace(/^\s*\|/gm, ' ')
		.replace(/\|\s*$/gm, ' ')
		.replace(/\s+\|\s+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}
