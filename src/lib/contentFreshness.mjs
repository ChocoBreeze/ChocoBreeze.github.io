const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export const FRESHNESS_MAX_AGE_DAYS = Object.freeze({
	ETF: 365,
	Reports: 365,
});

// Fast-moving values age out sooner than the post-level reference date. Used
// only by `npm run report:stale`; the on-page notice keeps the category limit.
export const FIELD_MAX_AGE_DAYS = Object.freeze({
	aumAsOf: 90,
	yieldAsOf: 90,
	expenseRatioAsOf: 365,
});

function getAgeDays(referenceDate, now) {
	const referenceTime = new Date(referenceDate).getTime();
	const nowTime = new Date(now).getTime();
	if (Number.isNaN(referenceTime) || Number.isNaN(nowTime)) {
		return undefined;
	}

	return Math.floor((nowTime - referenceTime) / DAY_IN_MILLISECONDS);
}

export function getFreshnessStatus(category, referenceDate, now = new Date()) {
	const maxAgeDays = FRESHNESS_MAX_AGE_DAYS[category];
	if (!maxAgeDays || !referenceDate) {
		return undefined;
	}

	const ageDays = getAgeDays(referenceDate, now);
	if (ageDays === undefined) {
		return undefined;
	}

	return {
		ageDays: Math.max(0, ageDays),
		isStale: ageDays > maxAgeDays,
		maxAgeDays,
	};
}

function isValidDate(value) {
	return Boolean(value) && !Number.isNaN(new Date(value).getTime());
}

/**
 * Lists every freshness date of one post that is older than its limit.
 * Returns undefined for categories without a freshness policy. The reference
 * date follows the on-page rule (`dataAsOf ?? verifiedDate`); a missing or
 * unparseable reference date is reported as `missingReference`.
 * `maxAgeOverride` replaces every limit, for ad-hoc checks.
 */
export function collectStaleFields(fields, now = new Date(), maxAgeOverride) {
	const categoryMaxAgeDays = FRESHNESS_MAX_AGE_DAYS[fields.category];
	if (!categoryMaxAgeDays) {
		return undefined;
	}

	const stale = [];
	const checkField = (field, date, maxAgeDays) => {
		const limit = maxAgeOverride ?? maxAgeDays;
		const ageDays = getAgeDays(date, now);
		if (ageDays !== undefined && ageDays > limit) {
			stale.push({ field, date, ageDays, maxAgeDays: limit });
		}
	};

	const referenceField = isValidDate(fields.dataAsOf)
		? 'dataAsOf'
		: isValidDate(fields.verifiedDate)
			? 'verifiedDate'
			: undefined;
	if (referenceField) {
		checkField(referenceField, fields[referenceField], categoryMaxAgeDays);
	}

	for (const [field, maxAgeDays] of Object.entries(FIELD_MAX_AGE_DAYS)) {
		if (isValidDate(fields[field])) {
			checkField(field, fields[field], maxAgeDays);
		}
	}

	return { missingReference: !referenceField, stale };
}
