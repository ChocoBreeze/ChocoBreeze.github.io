// Print stylesheet checks (plan 35). Print media is emulated, so these cover
// what CSS hides and adds; the beforeprint theme switch is driven by
// dispatching the event, because emulation does not fire it.

import { expect, test } from '@playwright/test';

// Has internal ticker links and external source links inside its tables.
const POST_PATH = '/blog/market-brief/2604/260411-weekly/';
const HIDDEN_IN_PRINT = [
	'body > header',
	'footer',
	'.blog-sidebar',
	'.toc',
	'.post-actions',
	'.related-posts',
	'.post-navigation',
];

test('print media keeps the post body and hides site chrome', async ({ page }) => {
	await page.setViewportSize({ width: 1500, height: 900 });
	await page.goto(POST_PATH);

	for (const selector of HIDDEN_IN_PRINT) {
		await expect(page.locator(selector).first(), `${selector} on screen`).toBeVisible();
	}

	await page.emulateMedia({ media: 'print' });

	for (const selector of HIDDEN_IN_PRINT) {
		await expect(page.locator(selector).first(), `${selector} in print`).toBeHidden();
	}
	await expect(page.locator('h1')).toBeVisible();
	await expect(page.locator('.post-body')).toBeVisible();
	expect(await page.locator('body').evaluate((el) => getComputedStyle(el).transitionDuration)).toBe(
		'0s',
	);
	expect(
		await page.locator('.blog-post-shell').evaluate((el) => getComputedStyle(el).display),
	).toBe('block');
});

test('print media hides code copy buttons but keeps the code', async ({ page }) => {
	await page.goto('/blog/git-add-command-guide/');
	await expect(page.locator('.code-copy-button').first()).toBeVisible();

	await page.emulateMedia({ media: 'print' });

	await expect(page.locator('.code-copy-button').first()).toBeHidden();
	await expect(page.locator('.post-body pre').first()).toBeVisible();
});

test('print media spells out external link addresses only', async ({ page }) => {
	await page.goto(POST_PATH);
	await page.emulateMedia({ media: 'print' });

	const afterContent = (selector) =>
		page
			.locator(selector)
			.first()
			.evaluate((el) => getComputedStyle(el, '::after').content);

	const external = page.locator('.post-body a[href^="http"]').first();
	const href = await external.getAttribute('href');
	expect(await afterContent('.post-body a[href^="http"]')).toBe(`" <${href}>"`);
	expect(await afterContent('.post-body a[href^="/blog/"]')).toBe('none');
});

test('printing switches a dark page to light and restores it afterwards', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
	await page.goto(POST_PATH);
	const root = page.locator('html');
	await expect(root).toHaveAttribute('data-theme', 'dark');

	await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
	await expect(root).toHaveAttribute('data-theme', 'light');
	await expect(root).not.toHaveClass(/\bdark\b/);

	await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
	await expect(root).toHaveAttribute('data-theme', 'dark');
	await expect(root).toHaveClass(/\bdark\b/);
	expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
});
