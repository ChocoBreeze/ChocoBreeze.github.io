import assert from 'node:assert/strict';
import { existsSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';
import path from 'node:path';

import { getFreshnessStatus } from '../../src/lib/contentFreshness.mjs';

describe('getFreshnessStatus', () => {
	const now = new Date('2026-08-17T00:00:00+09:00');

	it('marks ETF data as stale after the category threshold', () => {
		const result = getFreshnessStatus('ETF', '2025-07-01T00:00:00+09:00', now);

		assert.equal(result?.isStale, true);
		assert.equal(result?.maxAgeDays, 365);
	});

	it('ages the supplied data snapshot date even when verification is newer', () => {
		const result = getFreshnessStatus('ETF', '2024-01-01T00:00:00+09:00', now);

		assert.equal(result?.isStale, true);
	});

	it('keeps a recently verified Reports post current', () => {
		const result = getFreshnessStatus('Reports', '2026-08-01T00:00:00+09:00', now);

		assert.equal(result?.isStale, false);
	});

	it('does not apply a financial freshness policy to Market Brief', () => {
		assert.equal(getFreshnessStatus('Market Brief', '2020-01-01T00:00:00+09:00', now), undefined);
	});

	it('returns no status when verification is missing or invalid', () => {
		assert.equal(getFreshnessStatus('ETF', undefined, now), undefined);
		assert.equal(getFreshnessStatus('ETF', 'not-a-date', now), undefined);
	});
});

describe('new-post freshness options', () => {
	it('rejects data snapshots later than their verification date before writing', () => {
		const relativeFile = `__review-freshness-order-${process.pid}.md`;
		const expectedPath = path.join(process.cwd(), 'src', 'content', 'blog', relativeFile);
		assert.equal(existsSync(expectedPath), false);

		try {
			const result = spawnSync(
				process.execPath,
				[
					'scripts/new-post.mjs',
					'--title',
					'Freshness validation fixture',
					'--date',
					'2026-08-18',
					'--verified-date',
					'2026-08-01',
					'--data-as-of',
					'2026-08-02',
					'--file',
					relativeFile,
				],
				{ cwd: process.cwd(), encoding: 'utf8' },
			);

			assert.notEqual(result.status, 0);
			assert.match(result.stderr, /data-as-of cannot be later than --verified-date/);
			assert.equal(existsSync(expectedPath), false);
		} finally {
			rmSync(expectedPath, { force: true });
		}
	});
});
