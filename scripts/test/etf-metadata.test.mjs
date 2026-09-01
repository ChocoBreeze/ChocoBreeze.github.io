import assert from 'node:assert/strict';
import { existsSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, it } from 'node:test';

import {
	getEtfMetadataAllowedValues,
	isValidEtfMetadataValue,
	normalizeEtfMetadataValue,
} from '../../src/data/etfMetadata.mjs';

describe('ETF metadata validation', () => {
	it('accepts the pilot vocabulary and flexible leverage multiples', () => {
		assert.equal(isValidEtfMetadataValue('assetClass', 'Equity'), true);
		assert.equal(isValidEtfMetadataValue('strategy', 'Equal Weight'), true);
		assert.equal(isValidEtfMetadataValue('strategy', 'Inverse'), true);
		assert.equal(isValidEtfMetadataValue('leverage', '-3x'), true);
		assert.equal(isValidEtfMetadataValue('leverage', '2.5x'), true);
		assert.equal(isValidEtfMetadataValue('incomeStyle', 'None'), true);
	});

	it('rejects malformed or unregistered values', () => {
		assert.equal(isValidEtfMetadataValue('ticker', 'qqq'), false);
		assert.equal(isValidEtfMetadataValue('ticker', 'QQQ/1'), false);
		assert.equal(isValidEtfMetadataValue('strategy', 'Mystery'), false);
		assert.equal(isValidEtfMetadataValue('assetClass', 'Theme'), false);
		assert.equal(isValidEtfMetadataValue('leverage', 'three times'), false);
		assert.equal(isValidEtfMetadataValue('leverage', '0x'), false);
		assert.equal(isValidEtfMetadataValue('incomeStyle', 'Tactical'), false);
		assert.deepEqual(getEtfMetadataAllowedValues('strategy').includes('Index'), true);
	});

	it('normalizes ticker casing without accepting lowercase input as valid', () => {
		assert.equal(normalizeEtfMetadataValue('ticker', ' qqq '), 'QQQ');
		assert.equal(isValidEtfMetadataValue('ticker', ' QQQ '), true);
		assert.equal(isValidEtfMetadataValue('ticker', 'qqq'), false);
	});
});

describe('new-post ETF metadata validation', () => {
	it('rejects invalid ETF metadata before writing a file', () => {
		const relativeFile = `__review-etf-invalid-${process.pid}.md`;
		const expectedPath = path.join(process.cwd(), 'src', 'content', 'blog', relativeFile);
		assert.equal(existsSync(expectedPath), false);

		try {
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
				{ cwd: process.cwd(), encoding: 'utf8' },
			);

			assert.notEqual(result.status, 0);
			assert.match(result.stderr, /Invalid --strategy value/);
			assert.equal(existsSync(expectedPath), false);
		} finally {
			rmSync(expectedPath, { force: true });
		}
	});
});
