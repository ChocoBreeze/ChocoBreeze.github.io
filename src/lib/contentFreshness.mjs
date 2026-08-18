const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export const FRESHNESS_MAX_AGE_DAYS = Object.freeze({
	ETF: 365,
	Reports: 365,
});

export function getFreshnessStatus(category, referenceDate, now = new Date()) {
	const maxAgeDays = FRESHNESS_MAX_AGE_DAYS[category];
	if (!maxAgeDays || !referenceDate) {
		return undefined;
	}

	const referenceTime = new Date(referenceDate).getTime();
	const nowTime = new Date(now).getTime();
	if (Number.isNaN(referenceTime) || Number.isNaN(nowTime)) {
		return undefined;
	}

	const ageDays = Math.floor((nowTime - referenceTime) / DAY_IN_MILLISECONDS);
	return {
		ageDays: Math.max(0, ageDays),
		isStale: ageDays > maxAgeDays,
		maxAgeDays,
	};
}
