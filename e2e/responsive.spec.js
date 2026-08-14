import { test, expect } from './fixtures.js';

// Responsive Testing: Zenith switches from a desktop sidebar layout to a
// mobile bottom-nav layout at Tailwind's `md` breakpoint (768px). Assert
// against the *actual* viewport each project is configured with, so this
// spec self-adapts across desktop and mobile projects without duplication.
test.describe('Responsive layout', () => {
    test('shows the layout appropriate for the current viewport width', async ({ page }) => {
        await page.goto('/');

        const viewport = page.viewportSize();
        const isDesktop = viewport.width >= 768;

        const sidebar = page.locator('[data-testid="desktop-sidebar"]');
        const bottomNav = page.locator('[data-testid="mobile-bottom-nav"]');

        if (isDesktop) {
            await expect(sidebar).toBeVisible();
            await expect(bottomNav).toBeHidden();
        } else {
            await expect(sidebar).toBeHidden();
            await expect(bottomNav).toBeVisible();
        }
    });

    test('the Tasks kanban board stacks to a single column below the md breakpoint', async ({ page }) => {
        await page.goto('/');
        await page.locator('[data-nav-route="tasks"]:visible').first().click();
        await expect(page.getByText('Görev Yönetimi')).toBeVisible();

        const viewport = page.viewportSize();
        const grid = page.locator('#todo-list').locator('xpath=../..');
        const columnClass = await grid.getAttribute('class');

        if (viewport.width < 768) {
            expect(columnClass).toContain('grid-cols-1');
        } else {
            expect(columnClass).toContain('md:grid-cols-3');
        }
    });

    test('no horizontal overflow on the dashboard at the current viewport', async ({ page }) => {
        await page.goto('/');
        const hasHorizontalScroll = await page.evaluate(
            () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
        );
        expect(hasHorizontalScroll).toBe(false);
    });
});
