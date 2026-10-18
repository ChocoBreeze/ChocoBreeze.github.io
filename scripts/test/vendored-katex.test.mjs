import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { describe, it } from 'node:test';

import {
	getInstalledKatexVersion,
	getVendoredKatexVersion,
	keepOnlyWoff2Sources,
} from '../vendor-katex.mjs';

const ROOT_DIR = process.cwd();
const KATEX_DIR = path.join(ROOT_DIR, 'public', 'katex');

describe('keepOnlyWoff2Sources', () => {
	it('keeps the woff2 source and drops woff and ttf', () => {
		const css =
			'@font-face{src:url(fonts/A.woff2) format("woff2"),url(fonts/A.woff) format("woff"),url(fonts/A.ttf) format("truetype")}';

		const result = keepOnlyWoff2Sources(css);

		assert.ok(result.includes('A.woff2'));
		assert.ok(!result.includes('A.woff)'));
		assert.ok(!result.includes('A.ttf'));
	});

	it('leaves a declaration without any woff2 source untouched', () => {
		const css = '@font-face{src:url(fonts/A.ttf) format("truetype")}';

		assert.equal(keepOnlyWoff2Sources(css), css);
	});

	it('rewrites every declaration in the stylesheet', () => {
		const css = [
			'@font-face{src:url(a.woff2) format("woff2"),url(a.ttf) format("truetype")}',
			'@font-face{src:url(b.woff2) format("woff2"),url(b.ttf) format("truetype")}',
		].join('');

		assert.equal(keepOnlyWoff2Sources(css).includes('.ttf'), false);
	});
});

describe('vendored KaTeX assets', () => {
	it('matches the installed katex version', () => {
		assert.equal(getVendoredKatexVersion(ROOT_DIR), getInstalledKatexVersion(ROOT_DIR));
	});

	it('ships a stylesheet, its fonts, and the license', () => {
		const fonts = readdirSync(path.join(KATEX_DIR, 'fonts'));

		assert.ok(existsSync(path.join(KATEX_DIR, 'katex.min.css')));
		assert.ok(existsSync(path.join(KATEX_DIR, 'LICENSE')));
		assert.ok(fonts.length > 0);
		assert.ok(fonts.every((file) => file.endsWith('.woff2')));
	});

	it('references only fonts that are actually vendored', () => {
		const css = readFileSync(path.join(KATEX_DIR, 'katex.min.css'), 'utf8');
		const referenced = [...css.matchAll(/url\((fonts\/[^)]+)\)/g)].map((match) => match[1]);

		assert.ok(referenced.length > 0);
		for (const reference of new Set(referenced)) {
			assert.ok(existsSync(path.join(KATEX_DIR, reference)), `missing vendored font: ${reference}`);
		}
	});

	it('is referenced by BaseHead instead of a CDN', () => {
		const baseHead = readFileSync(
			path.join(ROOT_DIR, 'src', 'components', 'BaseHead.astro'),
			'utf8',
		);

		assert.ok(baseHead.includes('/katex/katex.min.css'));
		assert.ok(!baseHead.includes('cdn.jsdelivr.net'));
	});
});
