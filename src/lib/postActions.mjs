const REPOSITORY_URL = 'https://github.com/ChocoBreeze/ChocoBreeze.github.io';
const ISSUE_URL = `${REPOSITORY_URL}/issues/new`;
const HISTORY_BRANCH = 'main';

/**
 * GitHub commit history for one source file. `filePath` is the content entry's
 * repository-relative path; each segment is encoded because post file names
 * carry spaces, `&`, `#` and Hangul. GitHub does not follow renames here.
 */
export function buildHistoryUrl(filePath) {
	if (!filePath) return undefined;

	const encodedPath = String(filePath)
		.replaceAll('\\', '/')
		.split('/')
		.filter((segment) => segment && segment !== '.')
		.map(encodeURIComponent)
		.join('/');

	return `${REPOSITORY_URL}/commits/${HISTORY_BRANCH}/${encodedPath}`;
}

export function buildFeedbackIssueUrl(title, pageUrl) {
	const params = new URLSearchParams({
		title: `Blog feedback: ${title}`,
		body: `Page URL: ${pageUrl}\n\nFeedback: `,
	});

	return `${ISSUE_URL}?${params.toString()}`;
}

export function buildHeadingUrl(pageUrl, headingId) {
	const url = new URL(pageUrl);
	if (headingId) {
		url.hash = headingId;
	}

	return url.toString();
}

function formatCitationDate(date) {
	if (!date) return '';

	const value = date instanceof Date ? date : new Date(date);
	if (Number.isNaN(value.getTime())) return '';

	return value.toLocaleDateString('ko-KR', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'Asia/Seoul',
	});
}

export function buildCitationText({ title, siteTitle, date, pageUrl }) {
	const lines = [`> ${String(title ?? '').trim()}`];
	const metadata = [siteTitle, formatCitationDate(date)].filter(Boolean).join(' · ');

	if (metadata) lines.push(`> ${metadata}`);
	if (pageUrl) lines.push(`> ${pageUrl}`);

	return lines.join('\n');
}
