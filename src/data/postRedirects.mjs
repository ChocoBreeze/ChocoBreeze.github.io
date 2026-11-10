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
	{
		from: '/blog/etf/basics/1-왜-etf에-투자해야-하는가/',
		to: '/blog/etf/basics/1-why-invest-in-etfs/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/etf/basics/2-etf란-무엇인가/',
		to: '/blog/etf/basics/2-what-is-an-etf/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/etf/basics/3-etf의-종류/',
		to: '/blog/etf/basics/3-types-of-etfs/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/etf/basics/4-etf를-읽는-방법/',
		to: '/blog/etf/basics/4-how-to-read-an-etf/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251202-뉴로모픽-반도체/',
		to: '/blog/reports/neuromorphic-semiconductors/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251202-실리콘-포토닉스-투자-아이디어/',
		to: '/blog/reports/silicon-photonics-investment-ideas/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251202-저전력-메모리-분석/',
		to: '/blog/reports/low-power-memory/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251202-저전력-ai-칩/',
		to: '/blog/reports/low-power-ai-chips/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251202-wbg-반도체/',
		to: '/blog/reports/wide-bandgap-semiconductors/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251203-hbmhigh-bandwidth-memory-개요/',
		to: '/blog/reports/hbm-overview/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251208-반도체용-cnt탄소-나노튜브-기술-종합-분석-리포트/',
		to: '/blog/reports/carbon-nanotubes-for-semiconductors/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251208-hvdc-기술-개요/',
		to: '/blog/reports/hvdc-technology-overview/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251212-반도체-유리기판/',
		to: '/blog/reports/glass-substrates/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251212-us-monetary-aggregates/',
		to: '/blog/reports/us-monetary-aggregates/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251217-nvts-navitas-semiconductor/',
		to: '/blog/reports/navitas-semiconductor-investment-research/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251217-poet-poet-technologies/',
		to: '/blog/reports/poet-technologies-investment-research/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251217-rdw-redwire/',
		to: '/blog/reports/redwire-investment-research/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251221-crdo-credo-technology/',
		to: '/blog/reports/credo-technology-investment-research/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251221-iren-bitcoin-hpc/',
		to: '/blog/reports/iren-investment-research/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251221-rklb-rocket-lab/',
		to: '/blog/reports/rocket-lab-investment-research/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251221-smr-nuscale-power/',
		to: '/blog/reports/nuscale-power-investment-research/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251221-vrt-vertiv-holdings/',
		to: '/blog/reports/vertiv-holdings-investment-research/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/25년-12월/251230-mrvl-marvell-technology/',
		to: '/blog/reports/marvell-technology-investment-research/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/26년-1월/260116-반도체-후공정-병목_-기술-이슈를-넘어-구조적-변화의-핵심/',
		to: '/blog/reports/back-end-process-bottleneck/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/26년-1월/260116-osat와-파운드리의-첨단-패키징-전략-비교_-ase-amkor-tsmc의-산업-구조-분석/',
		to: '/blog/reports/osat-vs-foundry-advanced-packaging/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/26년-1월/260122-aihbm-시대의-검사-공정_-병목으로-부상한-이유와-투자-시사점/',
		to: '/blog/reports/ai-hbm-test-process/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/26년-1월/260122-hbm-본딩-기술-진화와-장비-공급망-재편_-중장기-투자-관점-분석/',
		to: '/blog/reports/hbm-bonding-equipment-supply-chain/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/26년-2월/260210-msr-밸류체인별-유망-상장기업/',
		to: '/blog/reports/msr-value-chain-listed-companies/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/26년-2월/260210-msr-투자-리서치/',
		to: '/blog/reports/msr-investment-research/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/26년-2월/260210-msr용융염원전-기술-주장-팩트체크/',
		to: '/blog/reports/msr-fact-check/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/26년-2월/260211-소듐냉각고속로sfr-투자-개요/',
		to: '/blog/reports/sfr-investment-overview/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/26년-2월/260211-소듐냉각고속로sfr-투자-관점-주요-주장-팩트체크/',
		to: '/blog/reports/sfr-fact-check/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/26년-2월/260211-소듐냉각고속로sfr-투자-리서치/',
		to: '/blog/reports/sfr-investment-research/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/26년-2월/260225-ase-technology-holding-adr_-패키징-병목-시대의-투자-매력-분석/',
		to: '/blog/reports/ase-technology-investment-research/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/26년-2월/260226-coherent-corp-투자-리서치/',
		to: '/blog/reports/coherent-investment-research/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/26년-2월/260228-centrus-energy-leu/',
		to: '/blog/reports/centrus-energy-investment-research/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/26년-2월/260228-hbf-투자-리서치/',
		to: '/blog/reports/hbf-investment-research/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
	},
	{
		from: '/blog/reports/26년-2월/260228-lumentum-holdings-nasdaq-lite/',
		to: '/blog/reports/lumentum-holdings-investment-research/',
		since: '2026-11-10',
		reason: 'slug backfill: replaced the non-ASCII path with an English slug',
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
