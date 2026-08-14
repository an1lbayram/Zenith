import { test, expect } from './fixtures.js';

// Visual Regression Testing: pixel snapshots only make sense compared
// within one rendering engine, so this spec runs on chromium-desktop only
// (see playwright.config.js's project list) - Cross-Browser correctness is
// covered functionally by task-flow/habit-flow instead.
//
// The Calendar view is intentionally excluded: it renders the real current
// day-of-month with a highlighted ring, which shifts every day and would
// make the baseline flaky by design, not by bug.
test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Visual snapshots run on one engine only');
});

const routes = [
    { name: 'dashboard', route: 'dashboard', heading: 'Genel Bakış' },
    { name: 'tasks', route: 'tasks', heading: 'Görev Yönetimi' },
    { name: 'habits', route: 'habits', heading: 'Alışkanlık Takibi' },
    { name: 'shop', route: 'shop', heading: 'XP Ödül Marketi' },
    { name: 'journal', route: 'journal', heading: 'Günlük & Zihin Notları' },
    { name: 'focus', route: 'focus', heading: 'Odak Modu (Pomodoro)' },
];

for (const { name, route, heading } of routes) {
    test(`${name} view matches its visual baseline (light mode)`, async ({ page }) => {
        await page.goto('/');
        if (route !== 'dashboard') {
            await page.locator(`[data-nav-route="${route}"]:visible`).first().click();
            await expect(page.getByText(heading).first()).toBeVisible();
        }
        // Let the 150ms route-transition + chart rendering settle.
        await page.waitForTimeout(300);

        await expect(page).toHaveScreenshot(`${name}-light.png`, {
            fullPage: true,
            maxDiffPixelRatio: 0.02,
            mask: [page.locator('#offline-indicator')],
        });
    });
}

test('dashboard matches its visual baseline (dark mode)', async ({ page }) => {
    await page.goto('/');
    await page.getByTitle('Tema Değiştir').click();
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('dashboard-dark.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
        mask: [page.locator('#offline-indicator')],
    });
});
