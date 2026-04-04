import { test, expect, type Page } from '@playwright/test';

async function loginAs(page: Page, email: string) {
    await page.goto(`/_e2e/login/${email}`);
    await page.waitForURL('**/');
}

const EXEC_EMAIL = 'melicherikjan84@gmail.com';

test.describe('Organizační struktura', () => {
    test('Executive vidí organizační přehled se stat kartami', async ({ page }) => {
        await loginAs(page, EXEC_EMAIL);
        await page.goto('/admin/organization');

        await expect(page.locator('h1', { hasText: 'Organizační struktura' })).toBeVisible();
        // Stat cards should be visible
        await expect(page.getByText('Aktivních uživatelů')).toBeVisible();
        await expect(page.getByText('Divize', { exact: true })).toBeVisible();
        await expect(page.getByText('Týmy', { exact: true })).toBeVisible();
    });

    test('Executive může vytvořit divizi', async ({ page }) => {
        await loginAs(page, EXEC_EMAIL);
        await page.goto('/admin/organization');

        const suffix = Date.now().toString().slice(-6);
        const divisionName = `E2E Divize ${suffix}`;

        await page.getByRole('button', { name: 'Nová divize' }).click();
        await page.locator('#div-name').fill(divisionName);
        await page.getByRole('button', { name: 'Vytvořit' }).click();

        await expect(page.getByText(divisionName)).toBeVisible();
    });

    test('Klik na divizi naviguje na detail', async ({ page }) => {
        await loginAs(page, EXEC_EMAIL);
        await page.goto('/admin/organization');

        // Click first division card
        const firstCard = page.locator('main [class*="cursor-pointer"][class*="rounded-lg"]').first();
        if (await firstCard.isVisible()) {
            await firstCard.click();
            await page.waitForURL(/\/admin\/organization\/divisions\//);
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('Detail divize zobrazuje tabulku týmů', async ({ page }) => {
        await loginAs(page, EXEC_EMAIL);
        await page.goto('/admin/organization');

        const firstCard = page.locator('main [class*="cursor-pointer"][class*="rounded-lg"]').first();
        if (await firstCard.isVisible()) {
            await firstCard.click();
            await page.waitForURL(/\/admin\/organization\/divisions\//);
            await expect(page.getByRole('columnheader', { name: 'Tým' })).toBeVisible();
        }
    });

    test('Klik na tým naviguje na detail členů', async ({ page }) => {
        await loginAs(page, EXEC_EMAIL);
        await page.goto('/admin/organization');

        const firstCard = page.locator('main [class*="cursor-pointer"][class*="rounded-lg"]').first();
        if (await firstCard.isVisible()) {
            await firstCard.click();
            await page.waitForURL(/\/admin\/organization\/divisions\//);

            // Click first team row
            const teamRow = page.locator('tbody tr').first();
            if (await teamRow.isVisible()) {
                await teamRow.click();
                await page.waitForURL(/\/admin\/organization\/teams\//);
                await expect(page.getByText('Jméno')).toBeVisible();
            }
        }
    });

    test('Detail týmu zobrazuje členskou tabulku', async ({ page }) => {
        await loginAs(page, EXEC_EMAIL);
        await page.goto('/admin/organization');

        const firstCard = page.locator('main [class*="cursor-pointer"][class*="rounded-lg"]').first();
        if (await firstCard.isVisible()) {
            await firstCard.click();
            await page.waitForURL(/\/admin\/organization\/divisions\//);

            const teamRow = page.locator('tbody tr').first();
            if (await teamRow.isVisible()) {
                await teamRow.click();
                await page.waitForURL(/\/admin\/organization\/teams\//);
                await expect(page.getByText('Email')).toBeVisible();
                await expect(page.getByText('Pozice')).toBeVisible();
            }
        }
    });
});
