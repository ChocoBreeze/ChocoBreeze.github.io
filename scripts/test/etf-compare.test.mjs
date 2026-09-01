import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	createComparableEtfs,
	getEtfComparisonCoverage,
	hasDatedEtfVolatileValue,
	parseCompareTickers,
	selectComparableEtfs,
} from '../../src/lib/etfCompare.mjs';

function post(id, data = {}) {
	return {
		id,
		data: {
			title: data.title ?? id,
			ticker: data.ticker,
			slug: data.slug,
			issuer: data.issuer,
			assetClass: data.assetClass,
			strategy: data.strategy,
			exposure: data.exposure,
			leverage: data.leverage,
			incomeStyle: data.incomeStyle,
			expenseRatio: data.expenseRatio,
			aum: data.aum,
			yield: data.yield,
			dataAsOf: data.dataAsOf,
		},
	};
}

describe('ETF comparison data', () => {
	it('keeps only unique ticker entries and normalizes stable metadata', () => {
		const entries = createComparableEtfs([
			post('spy-post', {
				title: 'SPY guide',
				ticker: ' spy ',
				slug: 'spy-guide',
				issuer: ' State Street ',
				assetClass: ' Equity ',
				strategy: ' Index ',
			}),
			post('no-ticker'),
			post('qqq-post', { ticker: 'QQQ' }),
			post('duplicate-spy', { ticker: 'SPY', title: 'Duplicate' }),
		]);

		assert.deepEqual(
			entries.map(({ ticker }) => ticker),
			['QQQ', 'SPY'],
		);
		assert.deepEqual(entries[1], {
			ticker: 'SPY',
			title: 'SPY guide',
			href: '/blog/spy-guide/',
			issuer: 'State Street',
			assetClass: 'Equity',
			strategy: 'Index',
			exposure: '',
			leverage: '',
			incomeStyle: '',
			expenseRatio: '',
			aum: '',
			yield: '',
			dataAsOf: '',
		});
	});

	it('keeps volatile values available only with a valid snapshot date', () => {
		const entries = createComparableEtfs([
			post('dated', {
				ticker: 'DATED',
				expenseRatio: '0.20%',
				dataAsOf: '2026-08-24T00:00:00+09:00',
			}),
			post('undated', {
				ticker: 'UNDATED',
				aum: '$10B',
			}),
		]);

		const dated = entries.find((entry) => entry.ticker === 'DATED');
		const undated = entries.find((entry) => entry.ticker === 'UNDATED');
		assert.equal(dated.expenseRatio, '0.20%');
		assert.equal(dated.dataAsOf, '2026-08-23T15:00:00.000Z');
		assert.equal(undated.aum, '$10B');
		assert.equal(undated.dataAsOf, '');
		assert.equal(hasDatedEtfVolatileValue(dated, 'expenseRatio'), true);
		assert.equal(hasDatedEtfVolatileValue(undated, 'aum'), false);
		assert.equal(hasDatedEtfVolatileValue(dated, 'issuer'), false);
	});

	it('parses comma-separated and repeated query values with a four-item limit', () => {
		assert.deepEqual(parseCompareTickers([' qqq,SPY,QQQ ', 'iau', 'gld', 'tqqq']), [
			'QQQ',
			'SPY',
			'IAU',
			'GLD',
		]);
		assert.deepEqual(parseCompareTickers(' , , '), []);
	});

	it('selects known entries in requested order and ignores unknown tickers', () => {
		const entries = createComparableEtfs([
			post('spy', { ticker: 'SPY' }),
			post('qqq', { ticker: 'QQQ' }),
			post('iau', { ticker: 'IAU' }),
			post('gld', { ticker: 'GLD' }),
		]);

		assert.deepEqual(
			selectComparableEtfs(entries, 'IAU,UNKNOWN,QQQ,SPY,GLD').map(({ ticker }) => ticker),
			['IAU', 'QQQ', 'SPY', 'GLD'],
		);
	});

	it('summarizes the comparison coverage without changing the source counts', () => {
		assert.deepEqual(getEtfComparisonCoverage(new Array(135), new Array(10)), {
			total: 135,
			comparable: 10,
			percentage: 7,
		});
		assert.deepEqual(getEtfComparisonCoverage([], []), {
			total: 0,
			comparable: 0,
			percentage: 0,
		});
		assert.deepEqual(getEtfComparisonCoverage(undefined, undefined), {
			total: 0,
			comparable: 0,
			percentage: 0,
		});
	});
});
