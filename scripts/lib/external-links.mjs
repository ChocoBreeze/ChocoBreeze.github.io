// External link extraction and liveness checks for `npm run report:links`
// (plan 38). Extraction is pure; checking uses fetch with per-host pacing so
// one site never sees more than one request at a time from this script.

export const USER_AGENT =
	'ChocoBreezeBlogLinkCheck/1.0 (+https://chocobreeze.github.io; manual link report)';

const URL_PATTERN = /https?:\/\/[^\s<>"'`]+/g;
const TRAILING_PUNCTUATION = /[.,;:!?*_~]+$/;
const BROKEN_STATUSES = new Set([404, 410]);
const BROKEN_ERROR_CODES = new Set(['ENOTFOUND', 'EAI_NONAME', 'ECONNREFUSED']);
// Sites that answer automated requests with 404 even for pages that exist
// (acmicpc.net returns 404 for problem 1000), so 404 there only means "check".
const UNRELIABLE_NOT_FOUND_HOSTS = new Set(['acmicpc.net']);
// Statuses some servers return for HEAD only; GET decides.
const RETRY_WITH_GET = new Set([403, 404, 405, 501]);

/** Replaces each character except newlines with a space, keeping offsets and line numbers. */
function blank(text) {
	return text.replace(/[^\n]/g, ' ');
}

/** Blanks frontmatter, fenced code blocks and inline code, which hold no rendered links. */
export function maskNonLinkText(content) {
	const withoutFrontmatter = content.replace(/^---\r?\n[\s\S]*?\r?\n---(?=\r?\n|$)/, blank);

	let fence;
	const lines = withoutFrontmatter.split('\n').map((line) => {
		const marker = line.match(/^[ \t]{0,3}(`{3,}|~{3,})/)?.[1];
		if (fence) {
			// A closing fence uses the same character and is at least as long.
			if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = undefined;
			return blank(line);
		}
		if (marker) {
			fence = marker;
			return blank(line);
		}
		return line;
	});

	// Inline code: a backtick run closed by the same run within one paragraph.
	return lines
		.join('\n')
		.replace(/(`+)(?:(?!\n[ \t]*\n)[\s\S])+?\1/g, (match, ticks) =>
			match.length > ticks.length * 2 ? blank(match) : match,
		);
}

/**
 * Cuts the URL at the first closing bracket it never opened, which ends a
 * Markdown link even when text follows, as in `[출처](url)[^2]`. Balanced
 * brackets such as `wiki/Foo_(bar)` stay. Then drops trailing punctuation.
 */
export function trimUrl(raw) {
	const url = raw.replaceAll('&amp;', '&');
	const depth = { ')': 0, ']': 0 };
	const opener = { '(': ')', '[': ']' };
	let end = url.length;

	for (let index = 0; index < url.length; index += 1) {
		const character = url[index];
		if (opener[character]) {
			depth[opener[character]] += 1;
		} else if (character in depth) {
			if (depth[character] === 0) {
				end = index;
				break;
			}
			depth[character] -= 1;
		}
	}

	return url.slice(0, end).replace(TRAILING_PUNCTUATION, '');
}

/** Lists `{ url, line }` for every external link in a post's source. */
export function extractExternalLinks(content) {
	const masked = maskNonLinkText(content);
	const links = [];
	const lines = masked.split('\n');

	lines.forEach((lineText, index) => {
		for (const match of lineText.matchAll(URL_PATTERN)) {
			const url = trimUrl(match[0]);
			try {
				new URL(url);
			} catch {
				continue;
			}
			links.push({ url, line: index + 1 });
		}
	});

	return links;
}

/** The URL actually requested: fragments never reach the server. */
export function toRequestUrl(url) {
	const parsed = new URL(url);
	parsed.hash = '';
	return parsed.href;
}

export function classifyResult({ url, status, finalUrl, errorCode }) {
	if (errorCode) {
		return BROKEN_ERROR_CODES.has(errorCode) ? 'broken' : 'check';
	}
	const from = new URL(url).hostname.replace(/^www\./, '');
	if (BROKEN_STATUSES.has(status)) {
		return UNRELIABLE_NOT_FOUND_HOSTS.has(from) ? 'check' : 'broken';
	}
	if (status >= 200 && status < 300) {
		const to = new URL(finalUrl ?? url).hostname.replace(/^www\./, '');
		return from === to ? 'ok' : 'moved';
	}
	return 'check';
}

function getErrorCode(error) {
	if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return 'TIMEOUT';
	// Sites that set a cookie and redirect to themselves loop without a cookie jar.
	if (error?.cause?.message === 'redirect count exceeded') return 'REDIRECT_LOOP';
	return error?.cause?.code ?? error?.code ?? error?.name ?? 'ERROR';
}

async function request(url, method, timeoutMs, fetchImpl) {
	const response = await fetchImpl(url, {
		method,
		redirect: 'follow',
		headers: { 'user-agent': USER_AGENT, accept: '*/*' },
		signal: AbortSignal.timeout(timeoutMs),
	});
	// Only the status matters; do not download bodies.
	await response.body?.cancel().catch(() => {});
	return { status: response.status, finalUrl: response.url || url };
}

/** Checks one URL: HEAD first, then GET when the HEAD answer is unreliable. */
export async function checkUrl(url, { timeoutMs = 15_000, fetchImpl = fetch } = {}) {
	let result;
	try {
		result = await request(url, 'HEAD', timeoutMs, fetchImpl);
		if (RETRY_WITH_GET.has(result.status)) {
			result = await request(url, 'GET', timeoutMs, fetchImpl);
		}
	} catch (error) {
		result = { errorCode: getErrorCode(error) };
	}

	return { url, ...result, kind: classifyResult({ url, ...result }) };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Checks many URLs. Each host is worked through one request at a time with
 * `hostGapMs` between requests, and at most `concurrency` hosts run at once.
 */
export async function checkUrls(
	urls,
	{ concurrency = 8, hostGapMs = 500, timeoutMs, fetchImpl, onResult } = {},
) {
	const byHost = new Map();
	for (const url of urls) {
		const host = new URL(url).host;
		if (!byHost.has(host)) byHost.set(host, []);
		byHost.get(host).push(url);
	}

	const hostQueues = [...byHost.values()];
	const results = [];
	let nextHost = 0;

	const worker = async () => {
		while (nextHost < hostQueues.length) {
			const queue = hostQueues[nextHost++];
			for (const [index, url] of queue.entries()) {
				if (index > 0) await sleep(hostGapMs);
				const result = await checkUrl(url, { timeoutMs, fetchImpl });
				results.push(result);
				onResult?.(result, results.length);
			}
		}
	};

	await Promise.all(Array.from({ length: Math.min(concurrency, hostQueues.length) }, worker));
	return results;
}
