import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { createContentFixture } from './helpers/content-fixture.mjs';

const FRONTMATTER =
	'title: "{title}"\npubDate: "2026-11-11T00:00:00+09:00"\ncategories: "Programming"\ndescription: "Fixture post."\n';

function runCheckContent(files) {
	const fixture = createContentFixture();
	try {
		for (const [relativePath, extraFrontmatter] of files) {
			const filePath = path.join(fixture.contentDir, relativePath);
			mkdirSync(path.dirname(filePath), { recursive: true });
			const title = path.basename(relativePath, '.md');
			writeFileSync(
				filePath,
				`---\n${FRONTMATTER.replace('{title}', title)}${extraFrontmatter}---\n\nBody.\n`,
				'utf8',
			);
		}
		return spawnSync(process.execPath, ['scripts/check-content.mjs'], {
			cwd: process.cwd(),
			env: fixture.env,
			encoding: 'utf8',
		});
	} finally {
		fixture.cleanup();
	}
}

describe('check-content derived routes', () => {
	it('fails a post whose file path derives a non-ASCII route', () => {
		const result = runCheckContent([['Programming/한글 제목.md', '']]);
		assert.notEqual(result.status, 0);
		assert.match(result.stderr, /non-ASCII segment/);
	});

	it('fails a post whose derived route ends with a readme segment', () => {
		const result = runCheckContent([['Programming/topic/README.md', '']]);
		assert.notEqual(result.status, 0);
		assert.match(result.stderr, /filename segment "readme"/);
	});

	it('passes the same paths once each post sets an explicit slug', () => {
		const result = runCheckContent([
			['Programming/한글 제목.md', 'slug: programming/korean-title\n'],
			['Programming/topic/README.md', 'slug: programming/topic\n'],
		]);
		assert.equal(result.status, 0, result.stderr);
	});

	it('passes an ASCII file path without a slug', () => {
		const result = runCheckContent([['Programming/plain-ascii-title.md', '']]);
		assert.equal(result.status, 0, result.stderr);
	});
});
