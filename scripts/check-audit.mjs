// Runs `npm audit --json` and fails on high or critical advisories that are not
// listed in AUDIT_EXCEPTIONS (scripts/lib/audit-policy.mjs). Used by ci.yml and
// deploy.yml in place of `npm audit --audit-level=high`.
import { spawnSync } from 'node:child_process';

import { evaluateAudit } from './lib/audit-policy.mjs';

// npm audit exits non-zero whenever it finds anything, so the exit code is not
// the verdict; the JSON report is.
const result = spawnSync('npm audit --json', {
	shell: true,
	encoding: 'utf8',
	maxBuffer: 64 * 1024 * 1024,
});

let report;
try {
	report = JSON.parse(result.stdout);
} catch {
	console.error('npm audit did not return a JSON report.');
	console.error(result.stderr || result.stdout);
	process.exit(1);
}
if (report.error) {
	console.error(`npm audit failed: ${report.error.summary ?? JSON.stringify(report.error)}`);
	process.exit(1);
}

const { blocking, allowed, unused, problems, ok } = evaluateAudit(report);

for (const advisory of allowed) {
	console.log(
		`ALLOWED  ${advisory.severity} ${advisory.id} ${advisory.package} ${advisory.range} (exception expires ${advisory.expires})`,
	);
}
for (const exception of unused) {
	console.log(
		`UNUSED   exception ${exception.id} (${exception.package}) is no longer reported; remove it.`,
	);
}
for (const problem of problems) {
	console.error(problem);
}
for (const advisory of blocking) {
	console.error(
		`BLOCKING ${advisory.severity} ${advisory.id} ${advisory.package} ${advisory.range}: ${advisory.title}`,
	);
}

const counts = report.metadata?.vulnerabilities ?? {};
console.log(
	`npm audit: ${counts.critical ?? 0} critical, ${counts.high ?? 0} high, ${counts.moderate ?? 0} moderate, ${counts.low ?? 0} low package entries.`,
);
if (!ok) {
	console.error(`Audit failed: ${blocking.length} blocking advisory(ies).`);
	process.exit(1);
}
console.log('Audit passed.');
