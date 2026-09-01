import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
	collectSearchIndexSizes,
	formatBytes,
	formatSearchSizeReport,
	getSearchIndexFiles,
} from '../report-search-size.mjs';

async function withFixture(callback) {
	const root = await mkdtemp(join(tmpdir(), 'search-size-'));
	try {
		await mkdir(join(root, 'search'));
		await writeFile(join(root, 'search.json'), '12345');
		await writeFile(join(root, 'code-search.json'), '123');
		await writeFile(join(root, 'search', 'quick.json'), '1234567');
		await writeFile(join(root, 'search', 'zeta.json'), '12');
		await writeFile(join(root, 'search', 'etf.json'), '123456');
		await writeFile(join(root, 'search', 'ignored.txt'), 'ignored');
		return await callback(root);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
}

describe('search index size reporting', () => {
	it('finds core and sorted category indexes without non-index files', async () => {
		await withFixture((root) => {
			assert.deepEqual(
				getSearchIndexFiles(root).map(({ relativePath }) => relativePath.replaceAll('\\', '/')),
				[
					'search.json',
					'search/quick.json',
					'code-search.json',
					'search/etf.json',
					'search/zeta.json',
				],
			);
		});
	});

	it('collects exact byte sizes and formats human-readable units', async () => {
		await withFixture((root) => {
			assert.deepEqual(
				collectSearchIndexSizes(root).map(({ bytes }) => bytes),
				[5, 7, 3, 6, 2],
			);
			assert.equal(formatBytes(1024), '1.00 KiB');
			assert.equal(formatBytes(1024 * 1024), '1.00 MiB');
			assert.match(
				formatSearchSizeReport([{ label: '전체', relativePath: 'search.json', bytes: 1024 }]),
				/1\.00 KiB/,
			);
		});
	});

	it('fails when a required index artifact is missing', async () => {
		await withFixture(async (root) => {
			await rm(join(root, 'search', 'quick.json'));
			assert.throws(() => collectSearchIndexSizes(root), /search[\\/]quick\.json/);
		});
	});
});
