import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: 0,
	reporter: 'list',
	use: {
		baseURL: 'http://127.0.0.1:4321',
		browserName: 'chromium',
		headless: true,
	},
	webServer: {
		command: 'npm run preview -- --host 127.0.0.1',
		url: 'http://127.0.0.1:4321',
		reuseExistingServer: !process.env.CI,
		// A cold start on Windows (first run after the files left the disk cache)
		// took 29.5 s before `astro preview` answered; a warm one takes about 7 s.
		// The wait ends as soon as the server answers, so this costs nothing
		// when startup is fast.
		timeout: 120_000,
	},
});
