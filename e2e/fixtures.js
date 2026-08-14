import { test as base, expect } from '@playwright/test';

// Shared fixture: block slow/unreachable third-party requests (Google Fonts,
// Vercel Analytics) so E2E runs are fast and deterministic regardless of
// the test machine's outbound network access. None of these are exercised
// by the app's own functionality.
const THIRD_PARTY_HOSTS = /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|va\.vercel-scripts\.com|vitals\.vercel-insights\.com)/;

export const test = base.extend({
    page: async ({ page }, use) => {
        await page.route(THIRD_PARTY_HOSTS, (route) => route.abort());
        await use(page);
    },
});

export { expect };
