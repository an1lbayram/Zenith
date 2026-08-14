import { test, chromium } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

// Performance & SEO Testing via Lighthouse. This needs a raw CDP debugging
// port, so it launches its own Chromium instance rather than using the
// Playwright Test-managed browser/page fixtures - the standard pattern for
// playwright-lighthouse. Chromium-only: Lighthouse audits via the Chrome
// DevTools Protocol, which Firefox/WebKit don't expose.
test.describe('Lighthouse audits', () => {
    test.setTimeout(90_000);

    test('dashboard meets baseline performance/SEO/accessibility/best-practices scores', async ({}, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-desktop', 'Lighthouse audits via CDP run on one engine only');

        const port = 9222;
        const browser = await chromium.launch({ args: [`--remote-debugging-port=${port}`] });
        const page = await browser.newPage();

        try {
            await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });

            await playAudit({
                page,
                port,
                // accessibility caps out around 90 today: Lighthouse's
                // target-size check flags the app's many small icon buttons
                // (nav icons, theme swatches, task edit/delete icons) as
                // under the 24x24px touch-target minimum - a real, known gap
                // that needs a dedicated touch-target sizing pass across the
                // UI, not a one-line fix. axe-core's WCAG2A/AA scan
                // (accessibility.spec.js) already enforces zero serious/
                // critical violations on every route; this threshold leaves
                // a small margin below the measured ~90 for run-to-run
                // score variance rather than pinning an exact number.
                thresholds: {
                    performance: 60,
                    accessibility: 85,
                    'best-practices': 80,
                    seo: 85,
                },
                reports: {
                    formats: { html: false },
                },
            });
        } finally {
            await browser.close();
        }
    });
});
