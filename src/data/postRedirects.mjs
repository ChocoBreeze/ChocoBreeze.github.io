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
export const POST_REDIRECTS = [
	{
		from: '/blog/etf/artificial-intelligence-and-robotics/robt/robt/',
		to: '/blog/etf/artificial-intelligence-and-robotics/robt/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/basics/readme/',
		to: '/blog/etf/basics/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the readme filename segment',
	},
	{
		from: '/blog/etf/broad-market/nasdaq-100/esg/qqmg/qqmg/',
		to: '/blog/etf/broad-market/nasdaq-100/esg/qqmg/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/broad-market/nasdaq-100/ex-technology/qqxt/qqxt/',
		to: '/blog/etf/broad-market/nasdaq-100/ex-technology/qqxt/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/broad-market/nasdaq-100/qqq/qqq/',
		to: '/blog/etf/broad-market/nasdaq-100/qqq/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/broad-market/nasdaq-100/top-30/qtop/qtop/',
		to: '/blog/etf/broad-market/nasdaq-100/top-30/qtop/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/broad-market/nasdaq-next-gen-100/qqqj/qqqj/',
		to: '/blog/etf/broad-market/nasdaq-next-gen-100/qqqj/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/clean-energy/qcln/qcln/',
		to: '/blog/etf/clean-energy/qcln/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/defined-outcome/buffer/qbuf/qbuf/',
		to: '/blog/etf/defined-outcome/buffer/qbuf/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/defined-outcome/managed-floor/qflr/qflr/',
		to: '/blog/etf/defined-outcome/managed-floor/qflr/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/dividend-income/equity-dividend/technology/tdiv/tdiv/',
		to: '/blog/etf/dividend-income/equity-dividend/technology/tdiv/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/dividend-income/option-income/leveraged-semiconductor/semy/semy/',
		to: '/blog/etf/dividend-income/option-income/leveraged-semiconductor/semy/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/dividend-income/option-income/nasdaq-100/qdte/qdte/',
		to: '/blog/etf/dividend-income/option-income/nasdaq-100/qdte/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/dividend-income/option-income/nasdaq-100/qqqi/qqqi/',
		to: '/blog/etf/dividend-income/option-income/nasdaq-100/qqqi/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/dividend-income/option-income/nasdaq-100/qqqy/qqqy/',
		to: '/blog/etf/dividend-income/option-income/nasdaq-100/qqqy/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/dividend-income/option-income/nasdaq-100/qxq/qxq/',
		to: '/blog/etf/dividend-income/option-income/nasdaq-100/qxq/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/dividend-income/option-income/nasdaq-100/qyld/qyld/',
		to: '/blog/etf/dividend-income/option-income/nasdaq-100/qyld/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/dividend-income/option-income/nasdaq-100/qylg/qylg/',
		to: '/blog/etf/dividend-income/option-income/nasdaq-100/qylg/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/internet/pnqi/pnqi/',
		to: '/blog/etf/internet/pnqi/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/leveraged-inverse/nasdaq-100/psq/psq/',
		to: '/blog/etf/leveraged-inverse/nasdaq-100/psq/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/leveraged-inverse/nasdaq-100/qid/qid/',
		to: '/blog/etf/leveraged-inverse/nasdaq-100/qid/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/leveraged-inverse/nasdaq-100/sqqq/sqqq/',
		to: '/blog/etf/leveraged-inverse/nasdaq-100/sqqq/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/leveraged-inverse/nasdaq-100/tqqq/tqqq/',
		to: '/blog/etf/leveraged-inverse/nasdaq-100/tqqq/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/leveraged-inverse/semiconductor/soxl/soxl/',
		to: '/blog/etf/leveraged-inverse/semiconductor/soxl/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/leveraged-inverse/semiconductor/soxs/soxs/',
		to: '/blog/etf/leveraged-inverse/semiconductor/soxs/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/leveraged-inverse/semiconductor/usd/usd/',
		to: '/blog/etf/leveraged-inverse/semiconductor/usd/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/power-infrastructure/nuclear-and-uranium/nlr/nlr/',
		to: '/blog/etf/power-infrastructure/nuclear-and-uranium/nlr/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/power-infrastructure/nuclear-and-uranium/ura/ura/',
		to: '/blog/etf/power-infrastructure/nuclear-and-uranium/ura/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/power-infrastructure/nuclear-and-uranium/urnj/urnj/',
		to: '/blog/etf/power-infrastructure/nuclear-and-uranium/urnj/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/power-infrastructure/nuclear-and-uranium/urnm/urnm/',
		to: '/blog/etf/power-infrastructure/nuclear-and-uranium/urnm/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/quantum-computing/qtum/qtum/',
		to: '/blog/etf/quantum-computing/qtum/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/sector/financials/banks/qaba/qaba/',
		to: '/blog/etf/sector/financials/banks/qaba/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/sector/technology/equal-weight/qtec/qtec/',
		to: '/blog/etf/sector/technology/equal-weight/qtec/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/semiconductor/fabless/smhx/smhx/',
		to: '/blog/etf/semiconductor/fabless/smhx/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/semiconductor/psi/psi/',
		to: '/blog/etf/semiconductor/psi/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/semiconductor/semi/semi/',
		to: '/blog/etf/semiconductor/semi/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/semiconductor/shoc/shoc/',
		to: '/blog/etf/semiconductor/shoc/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/semiconductor/smh/smh/',
		to: '/blog/etf/semiconductor/smh/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/semiconductor/soxq/soxq/',
		to: '/blog/etf/semiconductor/soxq/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/semiconductor/soxx/soxx/',
		to: '/blog/etf/semiconductor/soxx/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/semiconductor/xsd/xsd/',
		to: '/blog/etf/semiconductor/xsd/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/etf/style-factor/defensive-tactical/qqh/qqh/',
		to: '/blog/etf/style-factor/defensive-tactical/qqh/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the repeated last segment',
	},
	{
		from: '/blog/problem-solving/readme/',
		to: '/blog/problem-solving/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the readme filename segment',
	},
	{
		from: '/blog/programming/260405-rag-day1/readme/',
		to: '/blog/programming/260405-rag-day1/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the readme filename segment',
	},
	{
		from: '/blog/programming/260405-rag-day2/readme/',
		to: '/blog/programming/260405-rag-day2/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the readme filename segment',
	},
	{
		from: '/blog/programming/260408-rag-day3/readme/',
		to: '/blog/programming/260408-rag-day3/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the readme filename segment',
	},
	{
		from: '/blog/programming/260408-rag-day4/readme/',
		to: '/blog/programming/260408-rag-day4/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the readme filename segment',
	},
	{
		from: '/blog/programming/260413-rag-day5/readme/',
		to: '/blog/programming/260413-rag-day5/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the readme filename segment',
	},
	{
		from: '/blog/programming/260414-rag-day6/readme/',
		to: '/blog/programming/260414-rag-day6/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the readme filename segment',
	},
	{
		from: '/blog/programming/260415-rag-day7/readme/',
		to: '/blog/programming/260415-rag-day7/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the readme filename segment',
	},
	{
		from: '/blog/programming/260525-chatgpt-shortcuts/readme/',
		to: '/blog/programming/260525-chatgpt-shortcuts/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the readme filename segment',
	},
	{
		from: '/blog/programming/260525-powershell-profile-guide/readme/',
		to: '/blog/programming/260525-powershell-profile-guide/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the readme filename segment',
	},
	{
		from: '/blog/programming/260525-powershell-shortcuts/readme/',
		to: '/blog/programming/260525-powershell-shortcuts/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the readme filename segment',
	},
	{
		from: '/blog/programming/260525-windows-terminal-shortcuts/readme/',
		to: '/blog/programming/260525-windows-terminal-shortcuts/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the readme filename segment',
	},
	{
		from: '/blog/reports/readme/',
		to: '/blog/reports/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the readme filename segment',
	},
	{
		from: '/blog/semiconductor/readme/',
		to: '/blog/semiconductor/',
		since: '2026-10-16',
		reason: 'slug backfill: dropped the readme filename segment',
	},
];

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
