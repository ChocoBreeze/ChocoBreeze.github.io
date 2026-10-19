// Re-encoding rules for oversized source images (plan 31, step 5).
//
// `check:content` reports images over `MAX_IMAGE_BYTES`; this decides what to
// do with each one. The two cases are different:
//
// - A post-local PNG is an infographic or screenshot exported without
//   compression. Quantising it to a 256-colour palette keeps text crisp and
//   typically cuts two thirds of the file. Astro re-encodes it for delivery
//   anyway, so this is about repository weight.
// - A `public/images` photo is served byte-for-byte to every reader, so its
//   pixel dimensions matter too. Those get resized before re-encoding.
//
// Every replacement is checked twice before it lands: it must save enough to be
// worth a content change, and it must stay visually identical by PSNR.

import path from 'node:path';

import { MAX_IMAGE_BYTES } from './content-rules.mjs';

// Photos served straight from `public/` only ever render at 1020 CSS pixels
// (the post hero) or 1200 (the Open Graph card), so 1600 covers both with room
// for a high-density display.
export const SERVED_IMAGE_MAX_WIDTH = 1600;

// Below this, the rewrite costs more in diff noise than it saves.
export const MIN_SAVING_RATIO = 0.15;

// 40 dB is the usual "visually lossless" mark; 38 leaves a little slack for
// images that are almost entirely flat colour, where a few quantised edge
// pixels move the average more than they move the eye.
export const MIN_PSNR_DB = 38;

const PNG_PALETTE_OPTIONS = { compressionLevel: 9, effort: 10, palette: true };
const JPEG_OPTIONS = { quality: 80, mozjpeg: true };

/**
 * Decide how to re-encode one image, or why to leave it alone.
 *
 * @param {{ assetPath?: string, format?: string, width?: number, bytes?: number, limit?: number }} image
 * @returns {{ action: 'skip', reason: string }
 *   | { action: 'encode', encoder: 'png' | 'jpeg', options: object, resizeWidth?: number, comparable: boolean }}
 */
export function planImageOptimization({
	assetPath = '',
	format = '',
	width = 0,
	bytes = 0,
	limit = MAX_IMAGE_BYTES,
} = {}) {
	if (!(Number(bytes) > Number(limit))) {
		return { action: 'skip', reason: 'within the size budget' };
	}

	const normalizedFormat = String(format).toLowerCase() || inferFormat(assetPath);

	if (normalizedFormat === 'png') {
		return {
			action: 'encode',
			encoder: 'png',
			options: { ...PNG_PALETTE_OPTIONS },
			// Same pixel grid, so the result can be compared to the original.
			comparable: true,
		};
	}

	if (normalizedFormat === 'jpeg' || normalizedFormat === 'jpg') {
		const resizeWidth = Number(width) > SERVED_IMAGE_MAX_WIDTH ? SERVED_IMAGE_MAX_WIDTH : undefined;
		return {
			action: 'encode',
			encoder: 'jpeg',
			options: { ...JPEG_OPTIONS },
			...(resizeWidth ? { resizeWidth } : {}),
			comparable: !resizeWidth,
		};
	}

	// Vector and animated formats need an editor, not a re-encoder.
	return {
		action: 'skip',
		reason: `no re-encoding rule for ${normalizedFormat || 'unknown format'}`,
	};
}

function inferFormat(assetPath) {
	const extension = path.extname(String(assetPath)).toLowerCase();
	return extension ? extension.slice(1) : '';
}

/**
 * Peak signal-to-noise ratio between two equally sized raw pixel buffers.
 * Returns `Infinity` when they are identical.
 *
 * @param {Uint8Array | number[]} original
 * @param {Uint8Array | number[]} encoded
 * @returns {number} decibels
 */
export function computePsnr(original, encoded) {
	if (!original || !encoded || original.length === 0 || original.length !== encoded.length) {
		return Number.NaN;
	}

	let squaredError = 0;
	for (let index = 0; index < original.length; index += 1) {
		const delta = original[index] - encoded[index];
		squaredError += delta * delta;
	}

	const meanSquaredError = squaredError / original.length;
	if (meanSquaredError === 0) {
		return Number.POSITIVE_INFINITY;
	}

	return 10 * Math.log10((255 * 255) / meanSquaredError);
}

/**
 * Whether a re-encoded image is worth writing back.
 *
 * @param {{ originalBytes?: number, encodedBytes?: number, psnr?: number, comparable?: boolean }} result
 * @returns {{ replace: boolean, reason: string }}
 */
export function shouldReplaceImage({
	originalBytes = 0,
	encodedBytes = 0,
	psnr = Number.NaN,
	comparable = true,
} = {}) {
	if (!(originalBytes > 0) || !(encodedBytes > 0)) {
		return { replace: false, reason: 'missing byte counts' };
	}

	const saved = originalBytes - encodedBytes;
	if (saved / originalBytes < MIN_SAVING_RATIO) {
		return {
			replace: false,
			reason: `saves only ${((saved / originalBytes) * 100).toFixed(1)}% of the original`,
		};
	}

	if (comparable) {
		if (!Number.isFinite(psnr) && psnr !== Number.POSITIVE_INFINITY) {
			return { replace: false, reason: 'could not measure the quality difference' };
		}

		if (psnr < MIN_PSNR_DB) {
			return { replace: false, reason: `quality drop too large (${psnr.toFixed(1)} dB)` };
		}
	}

	return { replace: true, reason: 'smaller and visually identical' };
}
