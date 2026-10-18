// Vendors the installed KaTeX stylesheet and fonts into `public/katex/` so the
// site serves them itself instead of loading them from a CDN (plan 30).
//
// Run this after changing the `katex` dependency version:
//
//   node scripts/vendor-katex.mjs
//
// `scripts/test/vendored-katex.test.mjs` fails when the vendored copy and the
// installed version drift apart.

import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const VERSION_COMMENT_PREFIX = '/* vendored from katex@';

export function getInstalledKatexVersion(rootDir = process.cwd()) {
	const packageJsonPath = path.join(rootDir, 'node_modules', 'katex', 'package.json');
	return JSON.parse(readFileSync(packageJsonPath, 'utf8')).version;
}

export function getVendoredKatexVersion(rootDir = process.cwd()) {
	const cssPath = path.join(rootDir, 'public', 'katex', 'katex.min.css');
	const firstLine = readFileSync(cssPath, 'utf8').split('\n', 1)[0];
	if (!firstLine.startsWith(VERSION_COMMENT_PREFIX)) {
		return undefined;
	}

	return firstLine.slice(VERSION_COMMENT_PREFIX.length).split(' ')[0];
}

/**
 * Drops the `woff` and `ttf` sources from every `src:` list, keeping `woff2`.
 *
 * Only the woff2 files are vendored, so leaving the other sources in place
 * would point browsers at files that are not served.
 */
export function keepOnlyWoff2Sources(css) {
	return css.replace(/src:([^;}]*)/g, (match, sources) => {
		const kept = sources
			.split(',')
			.map((source) => source.trim())
			.filter((source) => source.includes('.woff2'));

		return kept.length > 0 ? `src:${kept.join(',')}` : match;
	});
}

function vendorKatex(rootDir = process.cwd()) {
	const version = getInstalledKatexVersion(rootDir);
	const distDir = path.dirname(require.resolve('katex/package.json'));
	const sourceDir = path.join(distDir, 'dist');
	const targetDir = path.join(rootDir, 'public', 'katex');
	const targetFontsDir = path.join(targetDir, 'fonts');

	rmSync(targetDir, { recursive: true, force: true });
	mkdirSync(targetFontsDir, { recursive: true });

	const css = readFileSync(path.join(sourceDir, 'katex.min.css'), 'utf8');
	writeFileSync(
		path.join(targetDir, 'katex.min.css'),
		`${VERSION_COMMENT_PREFIX}${version} by scripts/vendor-katex.mjs */\n${keepOnlyWoff2Sources(css)}`,
	);

	const fontFiles = readdirSync(path.join(sourceDir, 'fonts')).filter((file) =>
		file.endsWith('.woff2'),
	);
	for (const file of fontFiles) {
		copyFileSync(path.join(sourceDir, 'fonts', file), path.join(targetFontsDir, file));
	}

	copyFileSync(path.join(distDir, 'LICENSE'), path.join(targetDir, 'LICENSE'));

	console.log(`Vendored katex@${version}: 1 stylesheet, ${fontFiles.length} woff2 font(s).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
	vendorKatex();
}

export { vendorKatex };
