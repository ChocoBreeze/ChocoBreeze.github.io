// Old post URLs that must keep working after a slug change (plan 26).
//
// A post without an explicit frontmatter `slug` takes its URL from its file
// path, so giving it a stable slug changes the public URL. Every such change
// records the previous URL here, and Astro emits a redirect page for it at
// build time. Entries are the single source of truth for the redirect pages,
// for the sitemap exclusion, and for the build-artifact check.
//
// Both sides are absolute site paths with a trailing slash.

/** @typedef {{ from: string, to: string, since: string, reason: string }} PostRedirect */

/** @type {PostRedirect[]} */
export const POST_REDIRECTS = [];


export function normalizeRedirectPath(value) {
	const trimmed = String(value ?? '').trim();
	if (!trimmed) {
		return '';
	}

	const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
	return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

// Astro's `redirects` config takes a `{ [from]: to }` map and, in a static
// build, emits a page with a meta refresh, a canonical link, and robots
// noindex at each `from` path.
export function toAstroRedirects(redirects = POST_REDIRECTS) {
	return Object.fromEntries(
		redirects.map((redirect) => [
			normalizeRedirectPath(redirect.from),
			normalizeRedirectPath(redirect.to),
		]),
	);
}

export function getRedirectSourcePaths(redirects = POST_REDIRECTS) {
	return redirects.map((redirect) => normalizeRedirectPath(redirect.from));
}

// A redirect must not point at another redirect's source, at itself, or share a
// source with another entry — otherwise the old URL never reaches a real page.
export function findRedirectProblems(redirects = POST_REDIRECTS) {
	const problems = [];
	const sources = new Set();

	for (const redirect of redirects) {
		const from = normalizeRedirectPath(redirect.from);
		const to = normalizeRedirectPath(redirect.to);

		if (!from || !to) {
			problems.push(`Redirect needs both "from" and "to": ${JSON.stringify(redirect)}.`);
			continue;
		}

		if (from === to) {
			problems.push(`Redirect points at itself: ${from}.`);
		}

		if (sources.has(from)) {
			problems.push(`Duplicate redirect source: ${from}.`);
		}

		sources.add(from);
	}

	for (const redirect of redirects) {
		const to = normalizeRedirectPath(redirect.to);
		if (sources.has(to)) {
			problems.push(`Redirect target is itself a redirect source: ${to}.`);
		}
	}

	return problems;
}
