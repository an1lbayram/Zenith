import { test, expect } from './fixtures.js';

// End-to-End (Functional QA) coverage of the core task-management journey,
// driven purely through real browser interaction - no direct store access.
// Runs against every configured project (desktop Chromium/Firefox/WebKit +
// mobile viewports), which doubles as this suite's Cross-Browser and
// Responsive Testing coverage.

test.describe('Task management journey', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('Genel Bakış')).toBeVisible();
    });

    test('creating a task via the quick-add modal shows it on the Tasks board', async ({ page }) => {
        const taskTitle = `E2E görevi ${Date.now()}`;

        await page.locator('[data-testid="add-task-trigger"]:visible').first().click();
        await page.getByPlaceholder('Ne yapılması gerekiyor?').fill(taskTitle);
        await page.getByRole('button', { name: 'Görev Oluştur' }).click();

        await expect(page.getByText('Görev başarıyla eklendi!')).toBeVisible();

        await page.locator('[data-nav-route="tasks"]:visible').first().click();
        await expect(page.getByText('Görev Yönetimi')).toBeVisible();
        await expect(page.locator('#todo-list')).toContainText(taskTitle);
    });

    test('completing a task moves it to the Tamamlananlar column and awards XP', async ({ page }) => {
        const taskTitle = `Tamamlanacak görev ${Date.now()}`;

        await page.locator('[data-testid="add-task-trigger"]:visible').first().click();
        await page.getByPlaceholder('Ne yapılması gerekiyor?').fill(taskTitle);
        await page.getByRole('button', { name: 'Görev Oluştur' }).click();
        await expect(page.getByText('Görev başarıyla eklendi!')).toBeVisible();

        await page.locator('[data-nav-route="tasks"]:visible').first().click();
        const card = page.locator('.task-item', { hasText: taskTitle });
        await card.getByRole('button', { name: /Tamamla/ }).click();

        await expect(page.getByText(/Görev tamamlandı!.*XP/)).toBeVisible();
        await expect(page.locator('#done-list')).toContainText(taskTitle);
    });

    test('deleting a task offers an undo action that restores it', async ({ page }) => {
        const taskTitle = `Silinecek görev ${Date.now()}`;

        await page.locator('[data-testid="add-task-trigger"]:visible').first().click();
        await page.getByPlaceholder('Ne yapılması gerekiyor?').fill(taskTitle);
        await page.getByRole('button', { name: 'Görev Oluştur' }).click();

        await page.locator('[data-nav-route="tasks"]:visible').first().click();
        const card = page.locator('.task-item', { hasText: taskTitle });
        await card.getByTitle('Sil').click();

        await expect(page.getByText('Görev silindi')).toBeVisible();
        await page.getByRole('button', { name: 'GERİ AL' }).click();

        await expect(page.locator('#todo-list')).toContainText(taskTitle);
    });

    test('searching filters the task board by title', async ({ page }) => {
        const uniqueTitle = `Aranabilir-${Date.now()}`;

        await page.locator('[data-testid="add-task-trigger"]:visible').first().click();
        await page.getByPlaceholder('Ne yapılması gerekiyor?').fill(uniqueTitle);
        await page.getByRole('button', { name: 'Görev Oluştur' }).click();

        await page.locator('[data-nav-route="tasks"]:visible').first().click();
        await page.locator('#task-search-input').fill(uniqueTitle);

        await expect(page.locator('#todo-list')).toContainText(uniqueTitle);
        await expect(page.locator('#todo-list')).not.toContainText('Haftalık Proje Planlaması');
    });
});
