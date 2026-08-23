import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, it } from 'node:test';

describe('new-post Problem Solving fields', () => {
	it('writes optional platform and problem number fields', () => {
		const relativeFile = `__review-problem-solving-fields-${process.pid}.md`;
		const expectedPath = path.join(process.cwd(), 'src', 'content', 'blog', relativeFile);
		assert.equal(existsSync(expectedPath), false);

		try {
			const result = spawnSync(
				process.execPath,
				[
					'scripts/new-post.mjs',
					'--title',
					'Problem Solving fields fixture',
					'--category',
					'Problem_Solving',
					'--date',
					'2026-08-23',
					'--platform',
					'LeetCode',
					'--problem-number',
					'1234',
					'--file',
					relativeFile,
				],
				{ cwd: process.cwd(), encoding: 'utf8' },
			);

			assert.equal(result.status, 0, result.stderr);
			const content = readFileSync(expectedPath, 'utf8');
			assert.match(content, /^platform: "LeetCode"$/m);
			assert.match(content, /^problemNumber: 1234$/m);
		} finally {
			rmSync(expectedPath, { force: true });
		}
	});
});
