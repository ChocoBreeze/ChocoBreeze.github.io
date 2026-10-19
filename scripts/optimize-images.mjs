#!/usr/bin/env node
// Re-encode source images that exceed the image size budget (plan 31).
//
//   node scripts/optimize-images.mjs --dry-run      # report what would change
//   node scripts/optimize-images.mjs                # rewrite the files
//   node scripts/optimize-images.mjs <path> ...     # only these files
//
// Rules and safety checks live in `scripts/lib/image-optimizer.mjs`. Files are
// only replaced when the new encoding is meaningfully smaller and measures as
// visually identical, so running this twice is a no-op.

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { ASSET_EXTENSIONS, MAX_IMAGE_BYTES, formatByteSize } from './lib/content-rules.mjs';
import { computePsnr, planImageOptimization, shouldReplaceImage } from './lib/image-optimizer.mjs';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEARCH_DIRECTORIES = [
	path.join(ROOT_DIR, 'src', 'content', 'blog'),
	path.join(ROOT_DIR, 'public', 'images'),
];

const dryRun = process.argv.includes('--dry-run');
const explicitPaths = process.argv
	.slice(2)
	.filter((argument) => !argument.startsWith('--'))
	.map((argument) => path.resolve(ROOT_DIR, argument));

function walkImageFiles(directory) {
	if (!existsSync(directory)) {
		return [];
	}

	const results = [];
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const fullPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			results.push(...walkImageFiles(fullPath));
			continue;
		}

		if (ASSET_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
			results.push(fullPath);
		}
	}

	return results;
}

function toRepoRelativePosixPath(absolutePath) {
	return path.relative(ROOT_DIR, absolutePath).split(path.sep).join('/');
}

async function rawPixels(input) {
	const { data } = await sharp(input).raw().toBuffer({ resolveWithObject: true });
	return data;
}

async function optimizeFile(absolutePath) {
	const assetPath = toRepoRelativePosixPath(absolutePath);
	// Read the source up front. sharp keeps a file it was opened by path with
	// mapped, and on Windows that blocks writing back over it.
	const source = readFileSync(absolutePath);
	const bytes = source.length;
	const metadata = await sharp(source).metadata();

	const plan = planImageOptimization({
		assetPath,
		format: metadata.format,
		width: metadata.width,
		bytes,
	});

	if (plan.action === 'skip') {
		return { assetPath, bytes, skipped: plan.reason };
	}

	let pipeline = sharp(source);
	if (plan.resizeWidth) {
		pipeline = pipeline.resize({ width: plan.resizeWidth, withoutEnlargement: true });
	}

	const encoded = await pipeline[plan.encoder](plan.options).toBuffer();

	let psnr = Number.NaN;
	if (plan.comparable) {
		psnr = computePsnr(await rawPixels(source), await rawPixels(encoded));
	}

	const verdict = shouldReplaceImage({
		originalBytes: bytes,
		encodedBytes: encoded.length,
		psnr,
		comparable: plan.comparable,
	});

	if (!verdict.replace) {
		return { assetPath, bytes, skipped: verdict.reason };
	}

	if (!dryRun) {
		writeFileSync(absolutePath, encoded);
	}

	const after = await sharp(encoded).metadata();
	return {
		assetPath,
		bytes,
		encodedBytes: encoded.length,
		psnr,
		resized: plan.resizeWidth
			? `${metadata.width}x${metadata.height} to ${after.width}x${after.height}`
			: '',
	};
}

async function main() {
	const candidates = (
		explicitPaths.length > 0 ? explicitPaths : SEARCH_DIRECTORIES.flatMap(walkImageFiles)
	).filter(
		(absolutePath) => existsSync(absolutePath) && statSync(absolutePath).size > MAX_IMAGE_BYTES,
	);

	if (candidates.length === 0) {
		console.log(`No images over ${formatByteSize(MAX_IMAGE_BYTES)}.`);
		return;
	}

	let originalTotal = 0;
	let encodedTotal = 0;
	let changed = 0;

	for (const absolutePath of candidates.sort()) {
		const result = await optimizeFile(absolutePath);

		if (result.skipped) {
			console.log(`SKIP  ${result.assetPath} (${formatByteSize(result.bytes)}): ${result.skipped}`);
			continue;
		}

		changed += 1;
		originalTotal += result.bytes;
		encodedTotal += result.encodedBytes;
		const quality = Number.isFinite(result.psnr) ? `${result.psnr.toFixed(1)} dB` : 'resized';
		console.log(
			`${dryRun ? 'WOULD' : 'WROTE'} ${result.assetPath}: ${formatByteSize(result.bytes)} to ${formatByteSize(result.encodedBytes)} (${quality})${result.resized ? `, ${result.resized}` : ''}`,
		);
	}

	console.log(
		`\n${changed} of ${candidates.length} image(s) ${dryRun ? 'would be' : 'were'} re-encoded: ${formatByteSize(originalTotal)} to ${formatByteSize(encodedTotal)}.`,
	);
}

await main();
