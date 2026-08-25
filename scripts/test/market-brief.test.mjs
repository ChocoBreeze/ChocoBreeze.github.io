import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, it } from 'node:test';

import {
	buildCalendarCells,
	formatBriefMonthKey,
	getBriefDateKey,
	getBriefMonthKey,
	getBriefType,
	getRelatedDailyPosts,
	getRelatedWeeklyPosts,
	getWeeklyCoverage,
} from '../../src/lib/marketBrief.mjs';

const post = (data) => ({ data });

describe('Market Brief metadata', () => {
	it('prefers explicit type and date metadata over legacy fallbacks', () => {
		const weekly = post({
			title: 'Daily Brief',
			briefType: 'Weekly',
			marketDate: '2026-08-07',
			pubDate: new Date('2026-08-08T00:00:00+09:00'),
		});

		assert.equal(getBriefType(weekly), 'Weekly');
		assert.equal(getBriefDateKey(weekly), '2026-08-07');
		assert.equal(getBriefMonthKey(weekly), '2026-08');
		assert.equal(formatBriefMonthKey('2026-08'), '26.08');
	});

	it('falls back to title type and published date for legacy posts', () => {
		const weekly = post({
			title: '2026년 8월 8일 Weekly Brief',
			pubDate: '2026-08-08T00:00:01+09:00',
		});
		const daily = post({
			title: '2026년 8월 7일 Daily Brief',
			pubDate: '2026-08-07T00:00:00+09:00',
		});

		assert.equal(getBriefType(weekly), 'Weekly');
		assert.equal(getBriefType(daily), 'Daily');
		assert.equal(getBriefDateKey(daily), '2026-08-07');
	});
});

describe('Market Brief weekly connections', () => {
	const dailyA = post({ briefType: 'Daily', marketDate: '2026-08-03', title: 'Daily A' });
	const dailyB = post({ briefType: 'Daily', marketDate: '2026-08-07', title: 'Daily B' });
	const outside = post({ briefType: 'Daily', marketDate: '2026-08-08', title: 'Outside' });
	const weekly = post({
		briefType: 'Weekly',
		marketDate: '2026-08-08',
		coverageStart: '2026-08-03',
		coverageEnd: '2026-08-07',
		title: 'Weekly',
	});

	it('uses explicit coverage and preserves all matching daily posts', () => {
		assert.deepEqual(getWeeklyCoverage(weekly), {
			start: '2026-08-03',
			end: '2026-08-07',
			explicit: true,
		});
		assert.deepEqual(getRelatedDailyPosts(weekly, [dailyB, outside, dailyA]), [dailyA, dailyB]);
		assert.deepEqual(getRelatedWeeklyPosts(dailyB, [weekly]), [weekly]);
	});

	it('falls back to the six days before a weekly date', () => {
		const legacyWeekly = post({ title: 'Weekly Brief', pubDate: '2026-08-08T00:00:01+09:00' });
		assert.deepEqual(getWeeklyCoverage(legacyWeekly), {
			start: '2026-08-02',
			end: '2026-08-08',
			explicit: false,
		});
	});
});

describe('Market Brief calendar', () => {
	it('handles month starts and leap-year February', () => {
		const march = buildCalendarCells('2026-03', []);
		const february = buildCalendarCells('2028-02', []);

		assert.equal(march[0]?.day, 1); // March 1, 2026 is Sunday.
		assert.equal(february.filter(Boolean).length, 29);
		assert.equal(february.filter(Boolean).at(-1)?.day, 29);
	});

	it('places multiple posts in the same calendar cell', () => {
		const posts = [
			post({ marketDate: '2026-08-07', title: 'Daily' }),
			post({ marketDate: '2026-08-07', title: 'Weekly' }),
		];
		const cells = buildCalendarCells('2026-08', posts);

		assert.deepEqual(cells.find((cell) => cell?.day === 7)?.posts, posts);
	});
});

describe('new-post Market Brief fields', () => {
	it('writes explicit type, market date, and weekly coverage', () => {
		const relativeFile = `__review-market-brief-${process.pid}.md`;
		const expectedPath = path.join(process.cwd(), 'src', 'content', 'blog', relativeFile);
		assert.equal(existsSync(expectedPath), false);

		try {
			const result = spawnSync(
				process.execPath,
				[
					'scripts/new-post.mjs',
					'--type',
					'market-weekly',
					'--date',
					'2026-08-08',
					'--market-date',
					'2026-08-07',
					'--coverage-start',
					'2026-08-03',
					'--coverage-end',
					'2026-08-07',
					'--file',
					relativeFile,
				],
				{ cwd: process.cwd(), encoding: 'utf8' },
			);

			assert.equal(result.status, 0, result.stderr);
			const content = readFileSync(expectedPath, 'utf8');
			assert.match(content, /^briefType: "Weekly"$/m);
			assert.match(content, /^marketDate: "2026-08-07T00:00:00\+09:00"$/m);
			assert.match(content, /^coverageStart: "2026-08-03T00:00:00\+09:00"$/m);
			assert.match(content, /^coverageEnd: "2026-08-07T00:00:00\+09:00"$/m);
		} finally {
			rmSync(expectedPath, { force: true });
		}
	});

	it('rejects incomplete weekly coverage before writing', () => {
		const relativeFile = `__review-market-brief-invalid-${process.pid}.md`;
		const expectedPath = path.join(process.cwd(), 'src', 'content', 'blog', relativeFile);
		const result = spawnSync(
			process.execPath,
			[
				'scripts/new-post.mjs',
				'--type',
				'market-weekly',
				'--date',
				'2026-08-08',
				'--coverage-start',
				'2026-08-07',
				'--file',
				relativeFile,
			],
			{ cwd: process.cwd(), encoding: 'utf8' },
		);

		assert.notEqual(result.status, 0);
		assert.equal(existsSync(expectedPath), false);
	});
});
