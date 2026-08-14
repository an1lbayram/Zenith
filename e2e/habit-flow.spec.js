import { test, expect } from './fixtures.js';

test.describe('Habit tracking journey', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.locator('[data-nav-route="habits"]:visible').first().click();
        await expect(page.getByText('Alışkanlık Takibi').first()).toBeVisible();
    });

    test('creating a habit and completing it today builds a 1-day streak', async ({ page }) => {
        const habitTitle = `E2E alışkanlığı ${Date.now()}`;

        await page.getByRole('button', { name: /Yeni Alışkanlık/ }).first().click();
        await page.getByPlaceholder(/2 Litre Su İç/).fill(habitTitle);
        await page.getByRole('button', { name: /Alışkanlık Ekle/ }).click();

        await expect(page.getByText('Yeni alışkanlık başarıyla oluşturuldu!')).toBeVisible();

        const card = page.locator('.glass-panel', { hasText: habitTitle });
        await card.getByRole('button', { name: 'Bugün Tamamla' }).click();

        await expect(card.getByText('✓ Tamamlandı')).toBeVisible();
        await expect(card).toContainText('1 Gün Seri');
    });

    test('deleting a habit removes it from the board after confirmation', async ({ page }) => {
        const habitTitle = `Silinecek alışkanlık ${Date.now()}`;

        await page.getByRole('button', { name: /Yeni Alışkanlık/ }).first().click();
        await page.getByPlaceholder(/2 Litre Su İç/).fill(habitTitle);
        await page.getByRole('button', { name: /Alışkanlık Ekle/ }).click();

        const card = page.locator('.glass-panel', { hasText: habitTitle });
        page.once('dialog', (dialog) => dialog.accept());
        await card.getByText('🗑️').click();

        await expect(page.getByText(habitTitle)).toHaveCount(0);
    });
});
