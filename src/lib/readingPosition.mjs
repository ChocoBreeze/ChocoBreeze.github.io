// Remembers how far a reader got through a long post so the next visit can
// offer to resume there (plan 37). Pure functions over a plain object store;
// BlogPost.astro owns localStorage access and the DOM.

export const READING_POSITIONS_KEY = 'reading-positions';
export const MIN_PROGRESS = 0.1;
export const FINISHED_PROGRESS = 0.95;
export const MAX_ENTRIES = 30;
export const MAX_AGE_DAYS = 90;

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function isValidEntry(entry) {
	return (
		entry !== null &&
		typeof entry === 'object' &&
		Number.isFinite(entry.progress) &&
		Number.isFinite(entry.savedAt) &&
		(entry.heading === undefined || typeof entry.heading === 'string')
	);
}

function isExpired(entry, now) {
	return now - entry.savedAt > MAX_AGE_DAYS * DAY_IN_MILLISECONDS;
}

/** Parses the stored JSON, dropping anything malformed or expired. */
export function parseStore(raw, now = Date.now()) {
	let parsed;
	try {
		parsed = JSON.parse(raw ?? '{}');
	} catch {
		return {};
	}
	if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

	return Object.fromEntries(
		Object.entries(parsed).filter(([, entry]) => isValidEntry(entry) && !isExpired(entry, now)),
	);
}

/**
 * Returns the store after reading `path` to `progress`. Below MIN_PROGRESS the
 * store is unchanged, so landing at the top of a post never erases its record;
 * at FINISHED_PROGRESS or beyond the record is removed. Keeps the newest
 * MAX_ENTRIES records.
 */
export function recordPosition(store, path, { progress, heading }, now = Date.now()) {
	if (!Number.isFinite(progress) || progress < MIN_PROGRESS) return store;

	const next = { ...store };
	delete next[path];
	if (progress >= FINISHED_PROGRESS) return next;

	next[path] = {
		progress: Math.min(1, progress),
		...(heading ? { heading } : {}),
		savedAt: now,
	};

	const newest = Object.entries(next)
		.sort(([, a], [, b]) => b.savedAt - a.savedAt)
		.slice(0, MAX_ENTRIES);
	return Object.fromEntries(newest);
}

/** The saved entry worth offering to resume, or undefined. */
export function getResumeOffer(store, path, now = Date.now()) {
	const entry = store[path];
	if (!entry || !isValidEntry(entry) || isExpired(entry, now)) return undefined;
	if (entry.progress < MIN_PROGRESS || entry.progress >= FINISHED_PROGRESS) return undefined;
	return entry;
}
