// Accent text contrast (plan 39): green text must stay readable on the surfaces
// it sits on in both themes. Solid and translucent backgrounds are blended;
// gradients and images behind text are not modelled.

import { expect, test } from '@playwright/test';

const AA_NORMAL_TEXT = 4.5;

const measureContrast = (element) => {
	const parse = (value) => {
		const numbers = value.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0];
		// color-mix() computes to color(srgb r g b / a) with channels from 0 to 1.
		const scale = value.startsWith('color(') ? 255 : 1;
		return { rgb: numbers.slice(0, 3).map((v) => v * scale), alpha: numbers[3] ?? 1 };
	};
	const luminance = (rgb) => {
		const [r, g, b] = rgb.map((v) => {
			const c = v / 255;
			return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
		});
		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	};

	const layers = [];
	for (let node = element; node; node = node.parentElement) {
		const { rgb, alpha } = parse(getComputedStyle(node).backgroundColor);
		if (alpha > 0) layers.push({ rgb, alpha });
		if (alpha === 1) break;
	}
	let background = [255, 255, 255];
	for (const { rgb, alpha } of layers.reverse()) {
		background = rgb.map((v, i) => v * alpha + background[i] * (1 - alpha));
	}

	const [high, low] = [
		luminance(parse(getComputedStyle(element).color).rgb),
		luminance(background),
	].sort((a, b) => b - a);
	return (high + 0.05) / (low + 0.05);
};

const CASES = [
	[
		'a body link',
		'/blog/problem-solving/2024-11-08-1829-maximum-xor-for-each-query/',
		'.post-body p a',
	],
	['inline code', '/blog/git-add-command-guide/', '.post-body p code'],
	['a table link', '/blog/market-brief/2604/260411-weekly/', '.post-body td a'],
	['a tinted section badge', '/programming/git-commands/', '.section-number'],
	['the filled feedback button', '/feedback/', '.feedback-link'],
];

for (const theme of ['light', 'dark']) {
	test.describe(`${theme} theme`, () => {
		test.beforeEach(async ({ page }) => {
			await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
			// The theme fade would otherwise be measured mid-transition.
			await page.emulateMedia({ reducedMotion: 'reduce' });
		});

		for (const [name, path, selector] of CASES) {
			test(`${name} meets AA contrast`, async ({ page }) => {
				await page.goto(path);
				const contrast = await page.locator(selector).first().evaluate(measureContrast);
				expect(contrast).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
			});
		}
	});
}
