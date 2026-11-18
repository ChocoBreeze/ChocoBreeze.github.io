// Dependency audit policy for CI and deploy.
//
// `npm audit --audit-level=high` cannot ignore a single advisory, so one
// advisory with no patched release blocks every deploy. This policy fails on
// any high or critical advisory except those listed here, and each listed
// exception expires so it cannot be forgotten.

/**
 * @typedef {{ id: string, package: string, reason: string, expires: string }} AuditException
 */

/** @type {AuditException[]} */
export const AUDIT_EXCEPTIONS = [
	{
		id: 'GHSA-fc5q-39xc-vjpf',
		package: 'picomatch',
		reason:
			'ReDoS through repeated extglobs. No patched release exists (<= 4.0.7). picomatch only runs at build time on glob patterns this repository defines, so visitors cannot reach it. Remove once a fixed version ships.',
		expires: '2027-01-31',
	},
];

const BLOCKING_SEVERITIES = new Set(['high', 'critical']);

function advisoryId(advisory) {
	const url = String(advisory.url ?? '');
	return url.split('/').pop() || String(advisory.source ?? advisory.name ?? 'unknown');
}

/**
 * Lists the advisories in an `npm audit --json` report. Package entries whose
 * `via` is only another package name are derived and carry no advisory of
 * their own, so only advisory objects are returned, once per id.
 *
 * @param {any} report
 */
export function collectAdvisories(report) {
	const advisories = new Map();
	for (const vulnerability of Object.values(report?.vulnerabilities ?? {})) {
		for (const via of vulnerability.via ?? []) {
			if (typeof via !== 'object' || via === null) continue;
			const id = advisoryId(via);
			if (!advisories.has(id)) {
				advisories.set(id, {
					id,
					package: via.name,
					severity: via.severity,
					title: via.title,
					range: via.range,
				});
			}
		}
	}
	return [...advisories.values()];
}

/**
 * @param {any} report parsed `npm audit --json` output
 * @param {{ exceptions?: AuditException[], now?: Date }} [options]
 */
export function evaluateAudit(report, { exceptions = AUDIT_EXCEPTIONS, now = new Date() } = {}) {
	const today = now.toISOString().slice(0, 10);
	const exceptionById = new Map(exceptions.map((exception) => [exception.id, exception]));
	const advisories = collectAdvisories(report);
	const blocking = [];
	const allowed = [];
	const problems = [];

	for (const advisory of advisories) {
		if (!BLOCKING_SEVERITIES.has(advisory.severity)) continue;
		const exception = exceptionById.get(advisory.id);
		if (!exception) {
			blocking.push(advisory);
		} else if (exception.expires < today) {
			problems.push(
				`Audit exception for ${advisory.id} (${exception.package}) expired on ${exception.expires}. Update the dependency or renew the exception with a new reason.`,
			);
			blocking.push(advisory);
		} else {
			allowed.push({ ...advisory, expires: exception.expires });
		}
	}

	const reportedIds = new Set(advisories.map((advisory) => advisory.id));
	const unused = exceptions.filter((exception) => !reportedIds.has(exception.id));

	return { blocking, allowed, unused, problems, ok: blocking.length === 0 };
}
