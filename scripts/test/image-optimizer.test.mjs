import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	MIN_PSNR_DB,
	SERVED_IMAGE_MAX_WIDTH,
	computePsnr,
	planImageOptimization,
	shouldReplaceImage,
} from '../lib/image-optimizer.mjs';

const OVER_BUDGET = 2 * 1024 * 1024;

describe('planImageOptimization', () => {
	it('leaves an image inside the budget alone', () => {
		const plan = planImageOptimization({ assetPath: 'a/b.png', format: 'png', bytes: 1024 });
		assert.equal(plan.action, 'skip');
		assert.match(plan.reason, /budget/);
	});

	it('quantises an oversized PNG without resizing it', () => {
		const plan = planImageOptimization({
			assetPath: 'a/b.png',
			format: 'png',
			width: 1055,
			bytes: OVER_BUDGET,
		});
		assert.equal(plan.action, 'encode');
		assert.equal(plan.encoder, 'png');
		assert.equal(plan.options.palette, true);
		assert.equal(plan.resizeWidth, undefined);
		// Same pixel grid, so quality can be measured against the original.
		assert.equal(plan.comparable, true);
	});

	it('resizes an oversized photo that is wider than the largest rendered size', () => {
		const plan = planImageOptimization({
			assetPath: 'public/images/photo.jpg',
			format: 'jpeg',
			width: 4000,
			bytes: OVER_BUDGET,
		});
		assert.equal(plan.encoder, 'jpeg');
		assert.equal(plan.resizeWidth, SERVED_IMAGE_MAX_WIDTH);
		assert.equal(plan.comparable, false);
	});

	it('re-encodes a narrow photo without resizing it', () => {
		const plan = planImageOptimization({
			assetPath: 'public/images/photo.jpg',
			format: 'jpeg',
			width: 1200,
			bytes: OVER_BUDGET,
		});
		assert.equal(plan.resizeWidth, undefined);
		assert.equal(plan.comparable, true);
	});

	it('falls back to the file extension when the format is unknown', () => {
		const plan = planImageOptimization({ assetPath: 'a/b.PNG', bytes: OVER_BUDGET });
		assert.equal(plan.encoder, 'png');
	});

	it('refuses formats that need an editor rather than a re-encoder', () => {
		for (const assetPath of ['a/b.svg', 'a/b.gif']) {
			const plan = planImageOptimization({ assetPath, bytes: OVER_BUDGET });
			assert.equal(plan.action, 'skip');
			assert.match(plan.reason, /no re-encoding rule/);
		}
	});
});

describe('computePsnr', () => {
	it('reports identical buffers as infinite', () => {
		const pixels = Uint8Array.from([0, 128, 255, 7]);
		assert.equal(computePsnr(pixels, Uint8Array.from(pixels)), Number.POSITIVE_INFINITY);
	});

	it('falls as the difference grows', () => {
		const original = Uint8Array.from([100, 100, 100, 100]);
		const near = computePsnr(original, Uint8Array.from([101, 100, 100, 99]));
		const far = computePsnr(original, Uint8Array.from([160, 40, 150, 50]));
		assert.ok(near > far);
		assert.ok(near > MIN_PSNR_DB);
		assert.ok(far < MIN_PSNR_DB);
	});

	it('returns NaN for mismatched or empty buffers', () => {
		assert.ok(Number.isNaN(computePsnr(Uint8Array.from([1, 2]), Uint8Array.from([1]))));
		assert.ok(Number.isNaN(computePsnr(new Uint8Array(), new Uint8Array())));
	});
});

describe('shouldReplaceImage', () => {
	it('accepts a much smaller, visually identical encoding', () => {
		const verdict = shouldReplaceImage({
			originalBytes: 2_000_000,
			encodedBytes: 700_000,
			psnr: 45,
		});
		assert.equal(verdict.replace, true);
	});

	it('rejects an encoding that barely saves anything', () => {
		const verdict = shouldReplaceImage({
			originalBytes: 2_000_000,
			encodedBytes: 1_950_000,
			psnr: Number.POSITIVE_INFINITY,
		});
		assert.equal(verdict.replace, false);
		assert.match(verdict.reason, /saves only/);
	});

	it('rejects a visible quality drop even when it saves a lot', () => {
		const verdict = shouldReplaceImage({
			originalBytes: 2_000_000,
			encodedBytes: 200_000,
			psnr: 22,
		});
		assert.equal(verdict.replace, false);
		assert.match(verdict.reason, /quality drop/);
	});

	it('skips the quality check when the image was resized', () => {
		const verdict = shouldReplaceImage({
			originalBytes: 2_000_000,
			encodedBytes: 545_000,
			psnr: Number.NaN,
			comparable: false,
		});
		assert.equal(verdict.replace, true);
	});

	it('refuses to decide without both byte counts', () => {
		assert.equal(shouldReplaceImage({ originalBytes: 0, encodedBytes: 10 }).replace, false);
		assert.equal(shouldReplaceImage({ originalBytes: 10, encodedBytes: 0 }).replace, false);
	});

	it('refuses a comparable encoding whose quality could not be measured', () => {
		const verdict = shouldReplaceImage({
			originalBytes: 2_000_000,
			encodedBytes: 700_000,
			psnr: Number.NaN,
		});
		assert.equal(verdict.replace, false);
		assert.match(verdict.reason, /could not measure/);
	});
});
