import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';
import path from 'node:path';

import { collectStaleFields, getFreshnessStatus } from '../../src/lib/contentFreshness.mjs';
import { createContentFixture } from './helpers/content-fixture.mjs';

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

describe('collectStaleFields', () => {
	const now = new Date('2026-10-26T00:00:00+09:00');
	const fieldsOf = (stale) => stale.map(({ field }) => field);

	it('flags an AUM date only after more than 90 days', () => {
		const atLimit = collectStaleFields(
			{ category: 'ETF', verifiedDate: '2026-10-01', aumAsOf: '2026-07-28T00:00:00+09:00' },
			now,
		);
		const pastLimit = collectStaleFields(
			{ category: 'ETF', verifiedDate: '2026-10-01', aumAsOf: '2026-07-27T00:00:00+09:00' },
			now,
		);

		assert.deepEqual(fieldsOf(atLimit.stale), []);
		assert.deepEqual(pastLimit.stale, [
			{ field: 'aumAsOf', date: '2026-07-27T00:00:00+09:00', ageDays: 91, maxAgeDays: 90 },
		]);
	});

	it('ages dataAsOf ahead of a newer verifiedDate', () => {
		const result = collectStaleFields(
			{
				category: 'Reports',
				dataAsOf: '2025-01-01T00:00:00+09:00',
				verifiedDate: '2026-10-01T00:00:00+09:00',
			},
			now,
		);

		assert.deepEqual(fieldsOf(result.stale), ['dataAsOf']);
		assert.equal(result.missingReference, false);
	});

	it('reports a missing or unparseable reference date and ignores bad field dates', () => {
		const result = collectStaleFields(
			{ category: 'ETF', verifiedDate: 'not-a-date', expenseRatioAsOf: 'soon' },
			now,
		);

		assert.deepEqual(result, { missingReference: true, stale: [] });
	});

	it('applies an override to every limit', () => {
		const result = collectStaleFields(
			{
				category: 'ETF',
				verifiedDate: '2026-10-01T00:00:00+09:00',
				expenseRatioAsOf: '2026-10-01T00:00:00+09:00',
			},
			now,
			7,
		);

		assert.deepEqual(fieldsOf(result.stale), ['verifiedDate', 'expenseRatioAsOf']);
		assert.ok(result.stale.every(({ maxAgeDays }) => maxAgeDays === 7));
	});

	it('skips categories without a freshness policy', () => {
		assert.equal(
			collectStaleFields({ category: 'Market Brief', aumAsOf: '2020-01-01' }, now),
			undefined,
		);
	});
});

describe('report:stale script', () => {
	function writePost(contentDir, relativeFile, frontmatter) {
		const filePath = path.join(contentDir, relativeFile);
		mkdirSync(path.dirname(filePath), { recursive: true });
		writeFileSync(filePath, `---\n${frontmatter}\n---\n\nBody\n`);
	}

	function runReport(env, args) {
		return spawnSync(process.execPath, ['scripts/report-stale-data.mjs', ...args], {
			cwd: process.cwd(),
			env,
			encoding: 'utf8',
		});
	}

	it('groups stale fields, lists missing reference dates, and skips drafts', () => {
		const fixture = createContentFixture();
		try {
			writePost(
				fixture.contentDir,
				'ETF/old-aum.md',
				[
					'title: Old AUM',
					'categories: ETF',
					"ticker: 'OLD'",
					"verifiedDate: '2026-10-01T00:00:00+09:00'",
					"aumAsOf: '2026-05-31T00:00:00+09:00' # quarterly",
				].join('\n'),
			);
			writePost(fixture.contentDir, 'Reports/no-date.md', 'title: No date\ncategories: [Reports]');
			writePost(
				fixture.contentDir,
				'ETF/draft.md',
				"title: Draft\ncategories: ETF\ndraft: true\naumAsOf: '2020-01-01T00:00:00+09:00'",
			);
			writePost(
				fixture.contentDir,
				'Programming/other.md',
				'title: Other\ncategories: Programming',
			);

			const result = runReport(fixture.env, ['--json', '--now', '2026-10-26T00:00:00+09:00']);
			assert.equal(result.status, 0, result.stderr);
			const report = JSON.parse(result.stdout);

			assert.equal(report.checkedPosts, 2);
			assert.deepEqual(
				report.groups.aumAsOf.map(({ file, ticker, ageDays }) => ({ file, ticker, ageDays })),
				[{ file: 'ETF/old-aum.md', ticker: 'OLD', ageDays: 148 }],
			);
			assert.deepEqual(report.groups.reference, []);
			assert.deepEqual(
				report.missingReference.map(({ file }) => file),
				['Reports/no-date.md'],
			);

			const text = runReport(fixture.env, ['--now', '2026-10-26T00:00:00+09:00']);
			assert.equal(text.status, 0, text.stderr);
			assert.match(text.stdout, /AUM 기준일\(aumAsOf\): 90일 초과 1편/);
			assert.match(text.stdout, /148일 {2}2026-05-31 {2}OLD {2}ETF\/old-aum\.md/);
		} finally {
			fixture.cleanup();
		}
	});

	it('rejects an invalid --days value', () => {
		const result = runReport(process.env, ['--days', 'soon']);

		assert.equal(result.status, 1);
		assert.match(result.stderr, /--days/);
	});
});

describe('new-post freshness options', () => {
	it('rejects data snapshots later than their verification date before writing', () => {
		const fixture = createContentFixture();
		const relativeFile = `__review-freshness-order-${process.pid}.md`;
		const expectedPath = path.join(fixture.contentDir, relativeFile);

		try {
			assert.equal(existsSync(expectedPath), false);
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
				{ cwd: process.cwd(), env: fixture.env, encoding: 'utf8' },
			);

			assert.notEqual(result.status, 0);
			assert.match(result.stderr, /data-as-of cannot be later than --verified-date/);
			assert.equal(existsSync(expectedPath), false);
		} finally {
			fixture.cleanup();
		}
	});
});
