const ISSUE_URL = 'https://github.com/ChocoBreeze/ChocoBreeze.github.io/issues/new';

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
