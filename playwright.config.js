import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'html',
    timeout: 30_000,

    use: {
        baseURL: 'http://localhost:4173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        // app.js reloads the page on the SW controllerchange event (by design,
        // for production auto-updates) - that mid-test reload would otherwise
        // detach elements and race every E2E interaction.
        serviceWorkers: 'block',
    },

    webServer: {
        command: 'npm run build && node scripts/static-server.js',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
    },

    // Cross-Browser Testing: the same functional specs run against all three
    // engines. Responsive Testing: dedicated mobile-viewport projects.
    // Visual Regression / Accessibility / Lighthouse specs restrict
    // themselves to chromium-desktop internally (see each spec's testMatch
    // guard) since pixel snapshots and CDP-based audits aren't
    // cross-engine-comparable.
    projects: [
        { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit-desktop', use: { ...devices['Desktop Safari'] } },
        { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
        { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
    ],
});
