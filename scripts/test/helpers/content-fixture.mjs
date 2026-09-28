import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function createContentFixture() {
	const contentDir = mkdtempSync(path.join(os.tmpdir(), 'chocobreeze-content-'));
	const env = {
		...process.env,
		ASTRA_BLOG_CONTENT_DIR: contentDir,
	};

	return {
		contentDir,
		env,
		cleanup() {
			rmSync(contentDir, { recursive: true, force: true });
		},
	};
}
