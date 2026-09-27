import { expect, test } from '@playwright/test';

test('restores a shared full-search query after reload', async ({ page }) => {
	await page.goto('/search/?q=IDL%EC%9D%B4%EB%9E%80');

	const searchInput = page.getByRole('textbox', { name: '게시글 검색' });
	const idlResult = page.locator('#results-list a[href="/blog/cs/what-is-idl/"]');
	await expect(searchInput).toHaveValue('IDL이란');
	await expect(idlResult).toBeVisible();

	await page.reload();
	await expect(searchInput).toHaveValue('IDL이란');
	await expect(idlResult).toBeVisible();
});

test('shares filter changes and restores them with browser back', async ({ page }) => {
	await page.goto('/search/');

	const searchInput = page.getByRole('textbox', { name: '게시글 검색' });
	const category = page.getByRole('combobox', { name: '검색 카테고리' });
	const mode = page.getByRole('combobox', { name: '검색 대상' });

	await searchInput.fill('IDL이란');
	await expect(page).toHaveURL(/q=IDL/);
	await category.selectOption('/search/programming.json');
	await expect(page).toHaveURL(/category=%2Fsearch%2Fprogramming.json/);
	await page.goBack();
	await expect(category).toHaveValue('/search.json');
	await expect(searchInput).toHaveValue('IDL이란');

	await mode.selectOption('code');
	await expect(page).toHaveURL(/mode=code/);
	await expect(category).toHaveValue('/search.json');
	await expect(category).toBeDisabled();
	await page.goBack();
	await expect(mode).toHaveValue('post');
	await page.goForward();
	await expect(mode).toHaveValue('code');
});

test('restores a direct category URL after reload', async ({ page }) => {
	await page.goto('/search/?q=IDL%EC%9D%B4%EB%9E%80&category=%2Fsearch%2Fprogramming.json');
	const category = page.getByRole('combobox', { name: '검색 카테고리' });
	await expect(category).toHaveValue('/search/programming.json');
	await page.reload();
	await expect(category).toHaveValue('/search/programming.json');
	await expect(page.getByRole('textbox', { name: '게시글 검색' })).toHaveValue('IDL이란');
});

test('recovers from a full-search index failure when retried', async ({ page }) => {
	let requests = 0;
	await page.route('**/search.json*', async (route) => {
		requests += 1;
		if (requests === 1) await route.abort();
		else await route.continue();
	});
	await page.goto('/search/?q=IDL%EC%9D%B4%EB%9E%80');
	await expect(page.getByRole('status')).toContainText('불러오지 못했습니다');
	await page.getByRole('button', { name: '다시 시도' }).click();
	await expect(page.locator('#results-list a[href="/blog/cs/what-is-idl/"]')).toBeVisible();
	await expect.poll(() => requests).toBe(2);
});

test('keeps the latest category when an earlier index request finishes last', async ({ page }) => {
	let releaseFirstRequest;
	const firstRequest = new Promise((resolve) => (releaseFirstRequest = resolve));
	let finishFirstRequest;
	const firstRequestFinished = new Promise((resolve) => (finishFirstRequest = resolve));
	await page.route('**/search.json*', async (route) => {
		await firstRequest;
		const response = await route.fetch();
		await route.fulfill({ response });
		finishFirstRequest();
	});
	await page.goto('/search/');
	await page.getByRole('textbox', { name: '게시글 검색' }).fill('IDL이란');
	await page
		.getByRole('combobox', { name: '검색 카테고리' })
		.selectOption('/search/programming.json');
	await expect(page.locator('#results-list a[href="/blog/cs/what-is-idl/"]')).toHaveCount(0);
	releaseFirstRequest();
	await firstRequestFinished;
	await expect(page.locator('#results-list a[href="/blog/cs/what-is-idl/"]')).toHaveCount(0);
	await expect(page).toHaveURL(/category=%2Fsearch%2Fprogramming.json/);
	await expect(page.getByRole('combobox', { name: '검색 카테고리' })).toHaveValue(
		'/search/programming.json',
	);
});

test('opens the quick-search palette by keyboard and returns focus on Escape', async ({ page }) => {
	let quickIndexRequests = 0;
	page.on('request', (request) => {
		if (request.url().includes('/search/quick.json')) quickIndexRequests += 1;
	});
	await page.goto('/');
	await expect.poll(() => quickIndexRequests).toBe(0);

	await page.keyboard.press('Control+k');
	const dialog = page.getByRole('dialog', { name: '빠른 검색' });
	const quickInput = page.getByRole('searchbox', { name: '게시글 검색' });
	await expect(dialog).toBeVisible();
	await expect(quickInput).toBeFocused();
	await expect.poll(() => quickIndexRequests).toBe(1);

	await quickInput.fill('IDL');
	const result = dialog.locator('a[href="/blog/cs/what-is-idl/"]');
	await expect(result).toBeVisible();
	await page.keyboard.press('ArrowDown');
	await expect(result).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	await expect(page.locator('[data-global-search-trigger]')).toBeFocused();
});

test('activates a focused quick-search result with Enter', async ({ page }) => {
	await page.goto('/');
	await page.keyboard.press('Control+k');
	const dialog = page.getByRole('dialog', { name: '빠른 검색' });
	const quickInput = page.getByRole('searchbox', { name: '게시글 검색' });
	await quickInput.fill('IDL');
	const result = dialog.locator('a[href="/blog/cs/what-is-idl/"]');
	await expect(result).toBeVisible();
	await page.keyboard.press('ArrowDown');
	await expect(result).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/blog\/cs\/what-is-idl\/$/);
});

test('recovers from a quick-index failure when retried', async ({ page }) => {
	let requests = 0;
	await page.route('**/search/quick.json*', async (route) => {
		requests += 1;
		if (requests === 1) await route.abort();
		else await route.continue();
	});
	await page.goto('/');
	await page.keyboard.press('Control+k');

	const dialog = page.getByRole('dialog', { name: '빠른 검색' });
	await expect(dialog.getByRole('status')).toContainText('불러오지 못했습니다');
	await dialog.getByRole('button', { name: '다시 시도' }).click();
	await expect(dialog.getByRole('status')).toContainText('두 글자 이상 입력하면 검색합니다');
	await expect.poll(() => requests).toBe(2);
});
