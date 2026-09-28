import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, it } from 'node:test';
import { createContentFixture } from './helpers/content-fixture.mjs';

describe('new-post ETF fields', () => {
	it('writes optional stable ETF metadata fields', () => {
		const fixture = createContentFixture();
		const relativeFile = `__review-etf-fields-${process.pid}.md`;
		const expectedPath = path.join(fixture.contentDir, relativeFile);

		try {
			assert.equal(existsSync(expectedPath), false);
			const result = spawnSync(
				process.execPath,
				[
					'scripts/new-post.mjs',
					'--title',
					'ETF fields fixture',
					'--category',
					'ETF',
					'--date',
					'2026-08-24',
					'--ticker',
					'QQQ',
					'--instrument-type',
					'ETF',
					'--issuer',
					'Invesco',
					'--asset-class',
					'Equity',
					'--strategy',
					'Index',
					'--exposure',
					'Nasdaq-100',
					'--leverage',
					'1x',
					'--income-style',
					'Core',
					'--file',
					relativeFile,
				],
				{ cwd: process.cwd(), env: fixture.env, encoding: 'utf8' },
			);

			assert.equal(result.status, 0, result.stderr);
			const content = readFileSync(expectedPath, 'utf8');
			assert.match(content, /^ticker: "QQQ"$/m);
			assert.match(content, /^instrumentType: "ETF"$/m);
			assert.match(content, /^issuer: "Invesco"$/m);
			assert.match(content, /^assetClass: "Equity"$/m);
			assert.match(content, /^strategy: "Index"$/m);
			assert.match(content, /^exposure: "Nasdaq-100"$/m);
			assert.match(content, /^leverage: "1x"$/m);
			assert.match(content, /^incomeStyle: "Core"$/m);
		} finally {
			fixture.cleanup();
		}
	});
});
