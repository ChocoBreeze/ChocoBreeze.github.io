import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	buildSyntheticSearchIndex,
	formatScaleBenchmarkReport,
	getPercentile,
	getScaleTargets,
	measureScaleIndex,
} from '../benchmark-search-scale.mjs';

const sourceItems = [
	{ t: 'ETF 비용', d: 'ETF 수수료 정리', c: 'ETF', g: ['ETF'], s: 'etf/fees' },
	{ t: '반도체 시장', d: '메모리 반도체 공급', c: 'Reports', g: [], s: 'reports/chips' },
];

describe('synthetic search scale benchmark', () => {
	it('round-robins source records without changing searchable fields and makes slugs unique', () => {
		const synthetic = buildSyntheticSearchIndex(sourceItems, 5);
		assert.equal(synthetic.length, 5);
		assert.deepEqual(synthetic[0], sourceItems[0]);
		assert.equal(synthetic[2].t, sourceItems[0].t);
		assert.equal(synthetic[2].c, sourceItems[0].c);
		assert.notEqual(synthetic[0].s, synthetic[2].s);
		assert.equal(new Set(synthetic.map(({ s }) => s)).size, 5);
		const colliding = buildSyntheticSearchIndex(
			[
				{ t: 'A', s: 'a' },
				{ t: 'B', s: 'a--scale-1' },
			],
			4,
		);
		assert.equal(new Set(colliding.map(({ s }) => s)).size, 4);
		assert.throws(() => buildSyntheticSearchIndex([], 2), /at least one item/);
		assert.throws(
			() =>
				buildSyntheticSearchIndex(
					[
						{ t: 'A', s: 'a' },
						{ t: 'B', s: 'a' },
					],
					3,
				),
			/unique string slugs/,
		);
		assert.throws(() => buildSyntheticSearchIndex(sourceItems, 1), /integer/);
	});

	it('calculates nearest-rank percentiles deterministically', () => {
		assert.equal(getPercentile([9, 1, 5, 3, 7], 50), 5);
		assert.equal(getPercentile([9, 1, 5, 3, 7], 95), 9);
		assert.ok(Number.isNaN(getPercentile([], 50)));
		assert.throws(() => getPercentile([1], 101), /between 0 and 100/);
	});

	it('always measures the real source size and skips targets below it', () => {
		assert.deepEqual(getScaleTargets(503), [503, 1000, 2000]);
		assert.deepEqual(getScaleTargets(2500), [2500]);
		assert.throws(() => getScaleTargets(0), /positive integer/);
	});

	it('measures JSON size, parsing, and query response while retaining result evidence', () => {
		const measured = measureScaleIndex(
			buildSyntheticSearchIndex(sourceItems, 6),
			['ETF', 'no-match'],
			2,
		);
		assert.equal(measured.itemCount, 6);
		assert.ok(measured.jsonBytes > measured.gzipBytes);
		assert.ok(measured.parse.p50Ms >= 0);
		assert.ok(measured.coldFirstSearchMs >= 0);
		assert.deepEqual(
			measured.queries.map(({ resultCount }) => resultCount),
			[3, 0],
		);
		assert.equal(measured.queries[0].topSlugs[0], 'etf/fees');
	});

	it('prints environment, methodology, compressed size, and p50/p95 columns', () => {
		const report = formatScaleBenchmarkReport({
			sourceCount: 503,
			iterations: 30,
			generatedAt: '2026-09-27T00:00:00.000Z',
			environment: {
				node: 'v22',
				platform: 'win32',
				arch: 'x64',
				cpu: 'Test CPU',
				logicalCores: 8,
			},
			scales: [
				{
					itemCount: 1000,
					jsonBytes: 2048,
					gzipBytes: 1024,
					parse: { p50Ms: 1, p95Ms: 2 },
					coldFirstSearchMs: 3,
					queries: [
						{
							query: 'ETF',
							resultCount: 12,
							p50Ms: 3,
							p95Ms: 4,
							topSlugs: ['etf/fees'],
						},
					],
				},
			],
		});
		assert.match(report, /Source posts: 503/);
		assert.match(report, /Gzip uses local level 9/);
		assert.match(report, /nearest-rank over 30 timed runs/);
		assert.match(report, /Parse p50/);
		assert.match(report, /Cold first search/);
		assert.match(report, /Search p95/);
		assert.match(report, /Test CPU/);
	});
});
