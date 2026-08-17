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
