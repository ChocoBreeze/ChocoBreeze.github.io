import { DISPLAY_TIME_ZONE } from './listFilters.mjs';

const BRIEF_TYPES = new Set(['Daily', 'Weekly']);
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function asDate(value) {
	if (!value) return undefined;
	const date = value instanceof Date ? value : new Date(value);
	return Number.isFinite(date.valueOf()) ? date : undefined;
}

function toDateKey(value) {
	if (typeof value === 'string') {
		const match = value.match(DATE_KEY_PATTERN);
		if (match) return value;
	}

	const date = asDate(value);
	if (!date) return undefined;

	return new Intl.DateTimeFormat('en-CA', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		timeZone: DISPLAY_TIME_ZONE,
	}).format(date);
}

function dateKeyToUtc(dateKey) {
	const match = dateKey?.match(DATE_KEY_PATTERN);
	if (!match) return undefined;
	const date = new Date(`${dateKey}T00:00:00Z`);
	return Number.isFinite(date.valueOf()) ? date : undefined;
}

function shiftDateKey(dateKey, days) {
	const date = dateKeyToUtc(dateKey);
	if (!date) return undefined;
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().slice(0, 10);
}

export function getBriefType(post) {
	const explicitType = post?.data?.briefType;
	if (BRIEF_TYPES.has(explicitType)) return explicitType;
	return post?.data?.title?.toLowerCase().includes('weekly') ? 'Weekly' : 'Daily';
}

export function getBriefDateKey(post) {
	return toDateKey(post?.data?.marketDate ?? post?.data?.pubDate ?? post?.data?.date);
}

export function isBriefDateExplicit(post) {
	return Boolean(toDateKey(post?.data?.marketDate));
}

export function getBriefMonthKey(post) {
	return getBriefDateKey(post)?.slice(0, 7);
}

export function formatBriefMonthKey(monthKey) {
	const match = monthKey?.match(/^(\d{4})-(\d{2})$/);
	return match ? `${match[1].slice(2)}.${match[2]}` : monthKey;
}

export function getWeeklyCoverage(post) {
	if (getBriefType(post) !== 'Weekly') return undefined;

	const explicitStart = toDateKey(post?.data?.coverageStart);
	const explicitEnd = toDateKey(post?.data?.coverageEnd);
	if (explicitStart && explicitEnd && explicitStart <= explicitEnd) {
		return { start: explicitStart, end: explicitEnd, explicit: true };
	}

	const end = getBriefDateKey(post);
	const start = end ? shiftDateKey(end, -6) : undefined;
	return start && end ? { start, end, explicit: false } : undefined;
}

export function isDateInBriefCoverage(dateKey, coverage) {
	return Boolean(
		dateKey &&
		coverage?.start &&
		coverage?.end &&
		dateKey >= coverage.start &&
		dateKey <= coverage.end,
	);
}

export function getRelatedDailyPosts(weeklyPost, posts) {
	const coverage = getWeeklyCoverage(weeklyPost);
	if (!coverage) return [];

	return posts
		.filter(
			(post) =>
				getBriefType(post) === 'Daily' && isDateInBriefCoverage(getBriefDateKey(post), coverage),
		)
		.sort((a, b) => (getBriefDateKey(a) ?? '').localeCompare(getBriefDateKey(b) ?? ''));
}

export function getRelatedWeeklyPosts(dailyPost, posts) {
	const dateKey = getBriefDateKey(dailyPost);
	if (!dateKey) return [];

	return posts.filter(
		(post) =>
			getBriefType(post) === 'Weekly' && isDateInBriefCoverage(dateKey, getWeeklyCoverage(post)),
	);
}

export function buildCalendarCells(monthKey, posts) {
	const match = monthKey?.match(/^(\d{4})-(\d{2})$/);
	if (!match) return [];

	const year = Number(match[1]);
	const month = Number(match[2]);
	const firstDay = new Date(Date.UTC(year, month - 1, 1));
	const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
	const postsByDate = new Map();

	for (const post of posts) {
		const dateKey = getBriefDateKey(post);
		if (!dateKey || !dateKey.startsWith(`${monthKey}-`)) continue;
		const dayPosts = postsByDate.get(dateKey) ?? [];
		dayPosts.push(post);
		postsByDate.set(dateKey, dayPosts);
	}

	const cells = Array.from({ length: firstDay.getUTCDay() }, () => null);
	for (let day = 1; day <= daysInMonth; day += 1) {
		const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`;
		cells.push({ day, dateKey, posts: postsByDate.get(dateKey) ?? [] });
	}
	while (cells.length % 7 !== 0) cells.push(null);
	return cells;
}
