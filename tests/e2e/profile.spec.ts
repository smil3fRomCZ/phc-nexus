import { test, expect, type Page } from '@playwright/test';

async function loginAs(page: Page, email: string) {
    await page.goto(`/_e2e/login/${email}`);
    await page.waitForURL('**/');
}

const EXEC_EMAIL = 'melicherikjan84@gmail.com';

test.describe('Profil uživatele', () => {
    test('Uživatel vidí svůj profil', async ({ page }) => {
        await loginAs(page, EXEC_EMAIL);
        await page.goto('/profile');

        await expect(page.locator('h1', { hasText: 'Můj profil' })).toBeVisible();
        await expect(page.getByText('Email')).toBeVisible();
    });

    test('Uživatel může editovat profil', async ({ page }) => {
        await loginAs(page, EXEC_EMAIL);
        await page.goto('/profile');

        const suffix = Date.now().toString().slice(-6);
        const jobTitle = `Test Position ${suffix}`;

        await page.locator('#profile-job-title').fill(jobTitle);
        await page.getByRole('button', { name: 'Uložit' }).click();

        // Page reloads — verify data persisted
        await page.goto('/profile');
        const input = page.locator('#profile-job-title');
        await expect(input).toHaveValue(jobTitle);
    });

    test('Executive vidí user detail stránku', async ({ page }) => {
        await loginAs(page, EXEC_EMAIL);
        await page.goto('/admin/users');

        // Click first user row to navigate to detail
        const firstRow = page.locator('tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForURL(/\/admin\/users\/[a-f0-9-]+$/);
            await expect(page.getByText('Email')).toBeVisible();
        }
    });

    test('Executive vidí správu uživatele s editací', async ({ page }) => {
        await loginAs(page, EXEC_EMAIL);
        await page.goto('/admin/users');

        // Navigate to a non-self user detail
        const rows = page.locator('tbody tr');
        const count = await rows.count();
        if (count > 1) {
            await rows.nth(1).click();
            await page.waitForURL(/\/admin\/users\/[a-f0-9-]+$/);
            await expect(page.getByText('Správa uživatele')).toBeVisible();
        }
    });
});
