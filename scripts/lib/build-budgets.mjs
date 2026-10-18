// Size budgets for the generated site (plan 32).
//
// The build grows quietly: one more post adds an OG card and a page, one more
// library adds to the bundle, one careless image adds megabytes. These budgets
// turn that into a build failure instead of something noticed months later.
//
// Values were set from the 2026-10-18 build with roughly 20-25% headroom.
// Raising one is fine when the growth is intended — change it in the same
// commit as the growth and say why in the message.

/**
 * `total` budgets apply to the whole group; `perPost` budgets are divided by
 * the number of published posts, because those groups grow with the corpus by
 * design.
 *
 * @type {{ key: string, label: string, total?: number, perPost?: number, measured: number }[]}
 */
export const BUILD_BUDGETS = [
	// 2026-10-18: 28,354,926 B for 506 posts (56,037 B per post).
	{ key: 'og', label: 'generated OG cards', perPost: 70_000, measured: 28_354_926 },
	// 2026-10-18: 28,267,593 B for 506 posts (55,865 B per post).
	{ key: 'blog', label: 'post pages', perPost: 70_000, measured: 28_267_593 },
	// Fixed assets: these must not grow with the corpus.
	{ key: '_astro', label: 'bundled CSS and JS', total: 5_500_000, measured: 4_182_835 },
	{ key: 'images', label: 'public images', total: 8_500_000, measured: 7_274_306 },
	{ key: 'katex', label: 'vendored KaTeX', total: 400_000, measured: 282_654 },
	// Search indexes. Keep these in step with `npm run report:search-size`.
	{ key: 'search.json', label: 'full search index', total: 5_500_000, measured: 4_455_007 },
	{ key: 'code-search.json', label: 'code search index', total: 3_000_000, measured: 2_446_480 },
	{ key: 'search', label: 'category and quick indexes', total: 5_500_000, measured: 4_573_895 },
];

export function formatBudgetBytes(bytes) {
	const value = Number(bytes) || 0;
	return `${(value / 1_048_576).toFixed(2)} MiB (${value.toLocaleString('en-US')} B)`;
}

/**
 * @param {{ key: string, bytes: number, fileCount: number }[]} measurements
 * @param {number} postCount
 * @param {typeof BUILD_BUDGETS} budgets
 * @returns {string[]} one issue per exceeded budget
 */
export function checkBuildBudgets(measurements = [], postCount = 0, budgets = BUILD_BUDGETS) {
	const issues = [];
	const measuredByKey = new Map(measurements.map((entry) => [entry.key, entry]));

	for (const budget of budgets) {
		const measurement = measuredByKey.get(budget.key);
		if (!measurement) {
			issues.push(`Build budget group is missing from the build: ${budget.key}`);
			continue;
		}

		const limit =
			typeof budget.perPost === 'number' ? budget.perPost * Math.max(postCount, 1) : budget.total;
		if (typeof limit !== 'number') {
			issues.push(`Build budget for ${budget.key} defines neither a total nor a per-post limit`);
			continue;
		}

		if (measurement.bytes > limit) {
			const over = measurement.bytes - limit;
			const perPostNote =
				typeof budget.perPost === 'number'
					? ` (${budget.perPost.toLocaleString('en-US')} B per post x ${postCount} posts)`
					: '';
			issues.push(
				`Build budget exceeded for ${budget.key} (${budget.label}): ${formatBudgetBytes(
					measurement.bytes,
				)} over a limit of ${formatBudgetBytes(limit)}${perPostNote}, ${formatBudgetBytes(
					over,
				)} too much`,
			);
		}
	}

	return issues;
}
