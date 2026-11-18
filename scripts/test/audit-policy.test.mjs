import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { collectAdvisories, evaluateAudit } from '../lib/audit-policy.mjs';

function advisory(id, name, severity) {
	return {
		source: 1,
		name,
		dependency: name,
		title: `${name} issue`,
		url: `https://github.com/advisories/${id}`,
		severity,
		range: '<=1.0.0',
	};
}

function report(...advisories) {
	const vulnerabilities = {};
	for (const entry of advisories) {
		vulnerabilities[entry.name] = { name: entry.name, severity: entry.severity, via: [entry] };
	}
	// A derived entry: its severity comes from a dependency, not its own advisory.
	vulnerabilities.parent = { name: 'parent', severity: 'high', via: advisories.map((a) => a.name) };
	return { vulnerabilities, metadata: { vulnerabilities: {} } };
}

const NOW = new Date('2026-11-18T00:00:00Z');
const exception = (id, expires = '2027-01-31') => ({ id, package: 'x', reason: 'test', expires });

describe('audit policy', () => {
	it('collects each advisory once and skips derived entries', () => {
		const shared = advisory('GHSA-aaaa', 'lib', 'high');
		const input = report(shared);
		input.vulnerabilities.other = { name: 'other', severity: 'high', via: [shared] };
		assert.deepEqual(
			collectAdvisories(input).map((a) => a.id),
			['GHSA-aaaa'],
		);
	});

	it('blocks a high advisory without an exception', () => {
		const result = evaluateAudit(report(advisory('GHSA-aaaa', 'lib', 'high')), {
			exceptions: [],
			now: NOW,
		});
		assert.equal(result.ok, false);
		assert.deepEqual(
			result.blocking.map((a) => a.id),
			['GHSA-aaaa'],
		);
	});

	it('blocks critical but ignores moderate and low advisories', () => {
		const result = evaluateAudit(
			report(
				advisory('GHSA-crit', 'a', 'critical'),
				advisory('GHSA-mod', 'b', 'moderate'),
				advisory('GHSA-low', 'c', 'low'),
			),
			{ exceptions: [], now: NOW },
		);
		assert.deepEqual(
			result.blocking.map((a) => a.id),
			['GHSA-crit'],
		);
	});

	it('allows only the excepted advisory and still blocks others', () => {
		const result = evaluateAudit(
			report(advisory('GHSA-aaaa', 'lib', 'high'), advisory('GHSA-bbbb', 'other', 'high')),
			{ exceptions: [exception('GHSA-aaaa')], now: NOW },
		);
		assert.equal(result.ok, false);
		assert.deepEqual(
			result.allowed.map((a) => a.id),
			['GHSA-aaaa'],
		);
		assert.deepEqual(
			result.blocking.map((a) => a.id),
			['GHSA-bbbb'],
		);
	});

	it('passes when every high advisory has a live exception', () => {
		const result = evaluateAudit(report(advisory('GHSA-aaaa', 'lib', 'high')), {
			exceptions: [exception('GHSA-aaaa')],
			now: NOW,
		});
		assert.equal(result.ok, true);
	});

	it('keeps an exception valid through its expiry day and blocks the day after', () => {
		const input = report(advisory('GHSA-aaaa', 'lib', 'high'));
		const onDay = evaluateAudit(input, {
			exceptions: [exception('GHSA-aaaa', '2026-11-18')],
			now: NOW,
		});
		assert.equal(onDay.ok, true);
		const after = evaluateAudit(input, {
			exceptions: [exception('GHSA-aaaa', '2026-11-17')],
			now: NOW,
		});
		assert.equal(after.ok, false);
		assert.match(after.problems[0], /expired on 2026-11-17/);
	});

	it('reports exceptions that no longer match any advisory', () => {
		const result = evaluateAudit(report(), {
			exceptions: [exception('GHSA-gone')],
			now: NOW,
		});
		assert.equal(result.ok, true);
		assert.deepEqual(
			result.unused.map((e) => e.id),
			['GHSA-gone'],
		);
	});
});
