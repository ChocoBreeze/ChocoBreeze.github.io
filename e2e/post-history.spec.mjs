// Post history link (plan 36): the post tools link to the source file's
// GitHub commit history and open it in a new tab.

import { expect, test } from '@playwright/test';

test('post tools link to the source file history in a new tab', async ({ page }) => {
	await page.goto('/blog/market-brief/2604/260411-weekly/');

	const link = page.locator('.post-actions a', { hasText: '수정 이력' });
	await expect(link).toBeVisible();
	await expect(link).toHaveAttribute('target', '_blank');
	await expect(link).toHaveAttribute('rel', 'noopener noreferrer');

	const href = await link.getAttribute('href');
	const url = new URL(href);
	expect(url.origin).toBe('https://github.com');
	expect(decodeURIComponent(url.pathname)).toMatch(
		/^\/ChocoBreeze\/ChocoBreeze\.github\.io\/commits\/main\/src\/content\/blog\/Market Brief\/.+\.md$/,
	);
});
