import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures.js';

// Accessibility Testing: automated WCAG2A/AA scans via axe-core on every
// route. Runs on chromium-desktop only - axe evaluates the DOM/ARIA tree,
// which doesn't meaningfully differ by rendering engine, so there's no
// value in tripling the run time across browsers.
test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'axe DOM scans run on one engine only');
});

const routes = [
    { route: 'dashboard', heading: 'Genel Bakış' },
    { route: 'tasks', heading: 'Görev Yönetimi' },
    { route: 'habits', heading: 'Alışkanlık Takibi' },
    { route: 'calendar', heading: 'Takvim & Planlayıcı' },
    { route: 'shop', heading: 'XP Ödül Marketi' },
    { route: 'journal', heading: 'Günlük & Zihin Notları' },
    { route: 'focus', heading: 'Odak Modu (Pomodoro)' },
];

for (const { route, heading } of routes) {
    test(`${route} view has no serious/critical accessibility violations`, async ({ page }) => {
        await page.goto('/');
        if (route !== 'dashboard') {
            await page.locator(`[data-nav-route="${route}"]:visible`).first().click();
            await expect(page.getByText(heading).first()).toBeVisible();
        }

        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        const seriousOrCritical = results.violations.filter(
            (v) => v.impact === 'serious' || v.impact === 'critical'
        );

        if (seriousOrCritical.length) {
            console.log(JSON.stringify(seriousOrCritical, null, 2));
        }
        expect(seriousOrCritical).toEqual([]);
    });
}

test('the quick-add task modal is accessible while open', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="add-task-trigger"]:visible').first().click();
    await expect(page.locator('#modal-backdrop')).toBeVisible();

    const results = await new AxeBuilder({ page })
        .include('#modal-content')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

    const seriousOrCritical = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(seriousOrCritical).toEqual([]);
});
