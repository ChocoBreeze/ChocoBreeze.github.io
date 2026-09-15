import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getPagefindCategoryValues } from '../../src/lib/pagefindFilters.mjs';

describe('Pagefind category metadata', () => {
	const normalizeCategory = (category) => {
		const normalized = category.toLowerCase();
		if (normalized === 'reports') return 'Reports';
		if (normalized === 'etf') return 'ETF';
		return category;
	};

	it('preserves every normalized category in an array', () => {
		assert.deepEqual(getPagefindCategoryValues(['ETF', 'reports'], normalizeCategory), [
			'ETF',
			'Reports',
		]);
	});

	it('handles scalar, missing, and duplicate category values', () => {
		assert.deepEqual(getPagefindCategoryValues('ETF', normalizeCategory), ['ETF']);
		assert.deepEqual(getPagefindCategoryValues(['ETF', 'ETF', 'etf'], normalizeCategory), ['ETF']);
		assert.deepEqual(getPagefindCategoryValues(undefined), []);
	});
});
