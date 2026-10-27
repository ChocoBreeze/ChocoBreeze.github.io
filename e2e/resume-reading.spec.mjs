// Resume reading (plan 37): progress through a long post is saved and the
// next visit offers to return to it.

import { expect, test } from '@playwright/test';

const POST_PATH = '/blog/git-add-command-guide/';
const STORE_KEY = 'reading-positions';

const seedPosition = (page, progress, heading) =>
	page.addInitScript(
		([key, path, entry]) => {
			if (!sessionStorage.getItem('seeded')) {
				localStorage.setItem(key, JSON.stringify({ [path]: { ...entry, savedAt: Date.now() } }));
				sessionStorage.setItem('seeded', '1');
			}
		},
		[STORE_KEY, POST_PATH, { progress, heading }],
	);

const readingProgress = (page) =>
	page.evaluate(() => {
		const body = document.querySelector('.post-body');
		const top = window.scrollY + body.getBoundingClientRect().top;
		return (window.scrollY - top) / (body.offsetHeight - window.innerHeight);
	});

test('a reader who left mid-post is offered to resume there', async ({ page }) => {
	await page.goto(POST_PATH);
	const prompt = page.locator('[data-resume-reading]');
	await expect(prompt).toBeHidden();

	await page.evaluate(() => {
		const body = document.querySelector('.post-body');
		const top = window.scrollY + body.getBoundingClientRect().top;
		window.scrollTo(0, top + 0.5 * (body.offsetHeight - window.innerHeight));
	});
	await page.goto('about:blank'); // pagehide saves the position

	await page.goto(POST_PATH);
	await expect(prompt).toBeVisible();
	await expect(prompt).toContainText('읽던 위치가 있습니다');

	await prompt.getByRole('button', { name: '이어 읽기', exact: true }).click();
	await expect(prompt).toBeHidden();
	await expect.poll(() => readingProgress(page)).toBeGreaterThan(0.45);
	expect(await readingProgress(page)).toBeLessThan(0.55);
});

test('the prompt names the heading and can be dismissed', async ({ page }) => {
	await seedPosition(page, 0.4, '스테이징이란?');
	await page.goto(POST_PATH);

	const prompt = page.locator('[data-resume-reading]');
	await expect(prompt).toContainText('스테이징이란?');
	await prompt.getByRole('button', { name: '이어 읽기 안내 닫기' }).click();
	await expect(prompt).toBeHidden();
	expect(await page.evaluate(() => window.scrollY)).toBeLessThan(200);
});

test('no prompt when the visit targets a heading or the post was finished', async ({ page }) => {
	await seedPosition(page, 0.4);
	await page.goto(`${POST_PATH}#1-스테이징이란`);
	await expect(page.locator('h1')).toBeVisible();
	await page.waitForLoadState('load');
	await expect(page.locator('[data-resume-reading]')).toBeHidden();

	await page.evaluate(
		([key, path]) =>
			localStorage.setItem(
				key,
				JSON.stringify({ [path]: { progress: 0.97, savedAt: Date.now() } }),
			),
		[STORE_KEY, POST_PATH],
	);
	await page.goto(POST_PATH);
	await page.waitForLoadState('load');
	await expect(page.locator('[data-resume-reading]')).toBeHidden();
});
