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
		timeout: 30_000,
	},
});
