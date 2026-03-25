import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    retries: 0,
    workers: 1,
    reporter: 'list',
    use: {
        baseURL: process.env.E2E_BASE_URL ?? 'https://localhost',
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
    ],
});
