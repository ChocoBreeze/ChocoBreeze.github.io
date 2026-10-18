// Accessibility smoke tests (plan 32).
//
// These check the few things that break silently and are cheap to assert:
// landmark and heading structure, image alt text, in-page anchors, and
// keyboard-only operation. They are not a substitute for the manual review in
// AGENTS.md — Korean copy, dark mode readability and mobile layout still need
// eyes on them.

import { expect, test } from '@playwright/test';

const POST_PATH = '/blog/git-add-command-guide/';
const CATEGORY_PATH = '/programming/';

test('a post page has one main landmark and an ordered heading outline', async ({ page }) => {
	await page.goto(POST_PATH);

	await expect(page.locator('main')).toHaveCount(1);
	await expect(page.locator('h1')).toHaveCount(1);

	const levels = await page
		.locator('main :is(h1, h2, h3, h4, h5, h6)')
		.evaluateAll((headings) => headings.map((heading) => Number(heading.tagName.slice(1))));

	expect(levels.length).toBeGreaterThan(1);
	expect(levels[0]).toBe(1);
	for (let index = 1; index < levels.length; index += 1) {
		// A heading may close several levels at once, but may only open one.
		expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
	}
});

test('every content image on a post page has alt text', async ({ page }) => {
	await page.goto(POST_PATH);

	const missing = await page.locator('main img').evaluateAll((images) =>
		images
			.filter((image) => image.getAttribute('src'))
			.filter((image) => image.getAttribute('alt') === null)
			.map((image) => image.getAttribute('src')),
	);

	expect(missing).toEqual([]);
});

test('table-of-contents links point at headings that exist', async ({ page }) => {
	await page.goto(POST_PATH);

	const fragments = await page
		.locator('.toc a, .mobile-toc a')
		.evaluateAll((links) =>
			links.map((link) => decodeURIComponent((link.getAttribute('href') ?? '').replace('#', ''))),
		);

	expect(fragments.length).toBeGreaterThan(0);
	for (const fragment of new Set(fragments)) {
		await expect(page.locator(`[id="${fragment}"]`)).toHaveCount(1);
	}
});

test('the search page is usable with the keyboard alone', async ({ page }) => {
	await page.goto('/search/');

	const searchInput = page.getByRole('textbox', { name: '게시글 검색' });
	await searchInput.focus();
	await expect(searchInput).toBeFocused();

	await page.keyboard.type('IDL이란');
	const firstResult = page.locator('#results-list > li a').first();
	await expect(firstResult).toBeVisible();

	// Tab forward until a result link takes focus, without using the mouse.
	let reachedResult = false;
	for (let step = 0; step < 12 && !reachedResult; step += 1) {
		await page.keyboard.press('Tab');
		reachedResult = await page.evaluate(
			() => document.activeElement?.closest('#results-list') !== null,
		);
	}

	expect(reachedResult).toBe(true);
});

test('category list links have accessible names and a visible focus ring', async ({ page }) => {
	await page.goto(CATEGORY_PATH);

	const unnamed = await page
		.locator('main a')
		.evaluateAll((links) =>
			links
				.filter(
					(link) =>
						!(link.textContent ?? '').trim() &&
						!link.getAttribute('aria-label') &&
						!link.getAttribute('title'),
				)
				.map((link) => link.getAttribute('href')),
		);
	expect(unnamed).toEqual([]);

	const firstLink = page.locator('main a').first();
	await firstLink.focus();
	const outline = await firstLink.evaluate((element) => {
		const style = getComputedStyle(element);
		return { width: style.outlineWidth, style: style.outlineStyle, shadow: style.boxShadow };
	});

	const hasFocusIndicator =
		(outline.style !== 'none' && Number.parseFloat(outline.width) > 0) ||
		(outline.shadow !== 'none' && outline.shadow !== '');
	expect(hasFocusIndicator).toBe(true);
});
