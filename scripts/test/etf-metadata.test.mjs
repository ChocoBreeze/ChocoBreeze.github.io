import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, it } from 'node:test';

import {
	ETF_VOLATILE_METADATA_FIELDS,
	getEtfMetadataAllowedValues,
	hasEtfVolatileMetadata,
	isValidEtfMetadataValue,
	normalizeEtfMetadataValue,
} from '../../src/data/etfMetadata.mjs';
import { createContentFixture } from './helpers/content-fixture.mjs';

describe('ETF metadata validation', () => {
	it('accepts the pilot vocabulary and flexible leverage multiples', () => {
		assert.equal(isValidEtfMetadataValue('assetClass', 'Equity'), true);
		assert.equal(isValidEtfMetadataValue('strategy', 'Equal Weight'), true);
		assert.equal(isValidEtfMetadataValue('strategy', 'Inverse'), true);
		assert.equal(isValidEtfMetadataValue('leverage', '-3x'), true);
		assert.equal(isValidEtfMetadataValue('leverage', '2.5x'), true);
		assert.equal(isValidEtfMetadataValue('incomeStyle', 'None'), true);
		assert.equal(isValidEtfMetadataValue('instrumentType', 'CEF'), true);
	});

	it('rejects malformed or unregistered values', () => {
		assert.equal(isValidEtfMetadataValue('ticker', 'qqq'), false);
		assert.equal(isValidEtfMetadataValue('ticker', 'QQQ/1'), false);
		assert.equal(isValidEtfMetadataValue('strategy', 'Mystery'), false);
		assert.equal(isValidEtfMetadataValue('assetClass', 'Theme'), false);
		assert.equal(isValidEtfMetadataValue('leverage', 'three times'), false);
		assert.equal(isValidEtfMetadataValue('leverage', '0x'), false);
		assert.equal(isValidEtfMetadataValue('incomeStyle', 'Tactical'), false);
		assert.equal(isValidEtfMetadataValue('instrumentType', 'Fund'), false);
		assert.deepEqual(getEtfMetadataAllowedValues('strategy').includes('Index'), true);
	});

	it('normalizes ticker casing without accepting lowercase input as valid', () => {
		assert.equal(normalizeEtfMetadataValue('ticker', ' qqq '), 'QQQ');
		assert.equal(isValidEtfMetadataValue('ticker', ' QQQ '), true);
		assert.equal(isValidEtfMetadataValue('ticker', 'qqq'), false);
	});

	it('identifies changing values without requiring a guessed unit', () => {
		assert.deepEqual(ETF_VOLATILE_METADATA_FIELDS, ['expenseRatio', 'aum', 'yield']);
		assert.equal(hasEtfVolatileMetadata({ expenseRatio: '0.2%' }), true);
		assert.equal(hasEtfVolatileMetadata({ aum: 0 }), true);
		assert.equal(hasEtfVolatileMetadata({ yield: '  ' }), false);
		assert.equal(hasEtfVolatileMetadata({}), false);
	});
});

describe('new-post ETF metadata validation', () => {
	it('rejects invalid ETF metadata before writing a file', () => {
		const fixture = createContentFixture();
		const relativeFile = `__review-etf-invalid-${process.pid}.md`;
		const expectedPath = path.join(fixture.contentDir, relativeFile);

		try {
			assert.equal(existsSync(expectedPath), false);
			const result = spawnSync(
				process.execPath,
				[
					'scripts/new-post.mjs',
					'--title',
					'ETF invalid fields fixture',
					'--category',
					'ETF',
					'--date',
					'2026-08-24',
					'--strategy',
					'Unknown Strategy',
					'--file',
					relativeFile,
				],
				{ cwd: process.cwd(), env: fixture.env, encoding: 'utf8' },
			);

			assert.notEqual(result.status, 0);
			assert.match(result.stderr, /Invalid --strategy value/);
			assert.equal(existsSync(expectedPath), false);
		} finally {
			fixture.cleanup();
		}
	});

	it('requires a snapshot date for volatile ETF metadata', () => {
		const fixture = createContentFixture();
		const relativeFile = `__review-etf-volatile-${process.pid}.md`;
		const expectedPath = path.join(fixture.contentDir, relativeFile);

		try {
			assert.equal(existsSync(expectedPath), false);
			const result = spawnSync(
				process.execPath,
				[
					'scripts/new-post.mjs',
					'--title',
					'ETF volatile fields fixture',
					'--category',
					'ETF',
					'--date',
					'2026-08-24',
					'--yield',
					'4%',
					'--file',
					relativeFile,
				],
				{ cwd: process.cwd(), env: fixture.env, encoding: 'utf8' },
			);

			assert.notEqual(result.status, 0);
			assert.match(result.stderr, /requires --data-as-of/);
			assert.equal(existsSync(expectedPath), false);
		} finally {
			fixture.cleanup();
		}
	});

	it('writes volatile ETF metadata with its snapshot date', () => {
		const fixture = createContentFixture();
		const relativeFile = `__review-etf-volatile-valid-${process.pid}.md`;
		const expectedPath = path.join(fixture.contentDir, relativeFile);

		try {
			assert.equal(existsSync(expectedPath), false);
			const result = spawnSync(
				process.execPath,
				[
					'scripts/new-post.mjs',
					'--title',
					'ETF volatile fields fixture',
					'--category',
					'ETF',
					'--date',
					'2026-08-24',
					'--expense-ratio',
					'0.2%',
					'--data-as-of',
					'2026-08-20',
					'--file',
					relativeFile,
				],
				{ cwd: process.cwd(), env: fixture.env, encoding: 'utf8' },
			);

			assert.equal(result.status, 0, result.stderr);
			const content = readFileSync(expectedPath, 'utf8');
			assert.match(content, /^expenseRatio: "0.2%"$/m);
			assert.match(content, /^dataAsOf: "2026-08-20T00:00:00\+09:00"$/m);
		} finally {
			fixture.cleanup();
		}
	});
});

describe('content check ETF volatile metadata validation', () => {
	it('rejects changing ETF values without a field-specific or fallback snapshot date', () => {
		const fixture = createContentFixture();
		const relativeFile = `__review-etf-content-${process.pid}.md`;
		const expectedPath = path.join(fixture.contentDir, relativeFile);

		try {
			assert.equal(existsSync(expectedPath), false);
			writeFileSync(
				expectedPath,
				`---\ntitle: "ETF content fixture"\npubDate: "2026-08-24T00:00:00+09:00"\ncategories: ["Reports", "ETF"]\nyield: "4%"\n---\n\nContent.\n`,
				'utf8',
			);
			const result = spawnSync(process.execPath, ['scripts/check-content.mjs'], {
				cwd: process.cwd(),
				env: fixture.env,
				encoding: 'utf8',
			});
			assert.notEqual(result.status, 0);
			assert.match(
				result.stderr,
				/ETF volatile metadata `yield` requires `yieldAsOf` or `dataAsOf`/i,
			);
		} finally {
			fixture.cleanup();
		}
	});
});
