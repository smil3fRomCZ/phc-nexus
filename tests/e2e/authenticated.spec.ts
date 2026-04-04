import { test, expect, type Page } from '@playwright/test';

/**
 * Přihlásí se jako seeded uživatel přes E2E login bypass.
 * Vyžaduje: APP_ENV=local|testing a proběhnutý seed (DemoSeeder).
 */
async function loginAs(page: Page, email: string) {
    await page.goto(`/_e2e/login/${email}`);
    await page.waitForURL('**/');
}

const PM_EMAIL = 'monika.fialova@example.cz';
const READER_EMAIL = 'barbora.ticha@example.cz';

test.describe('Dashboard', () => {
    test('přihlášený uživatel vidí dashboard', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    });
});

test.describe('Projekty', () => {
    test('PM vidí seznam projektů', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        await page.goto('/projects');
        await expect(page.getByRole('link', { name: 'Replatform E-shop' })).toBeVisible();
    });

    test('PM vidí detail projektu', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        await page.goto('/projects');
        await page.getByRole('link', { name: 'Replatform E-shop' }).first().click();
        await expect(page.getByRole('heading').first()).toBeVisible();
    });
});

test.describe('Kanban a tabulka', () => {
    test('PM vidí kanban board', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        await page.goto('/projects');

        // Získat project ID z odkazu
        const href = await page.getByRole('link', { name: 'Replatform E-shop' }).first().getAttribute('href');
        const projectId = href?.split('/projects/')[1]?.split('/')[0] ?? '';

        await page.goto(`/projects/${projectId}/board`);
        await expect(page.getByText('Backlog').first()).toBeVisible();
        await expect(page.getByText('Hotovo').first()).toBeVisible();
    });

    test('PM vidí tabulkový view', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        await page.goto('/projects');

        const href = await page.getByRole('link', { name: 'Replatform E-shop' }).first().getAttribute('href');
        const projectId = href?.split('/projects/')[1]?.split('/')[0] ?? '';

        await page.goto(`/projects/${projectId}/table`);
        await expect(page.getByRole('columnheader', { name: 'Název' })).toBeVisible();
    });
});

test.describe('Approvals', () => {
    test('PM vidí approval requesty', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        await page.goto('/projects');

        const href = await page.getByRole('link', { name: 'Replatform E-shop' }).first().getAttribute('href');
        const projectId = href?.split('/projects/')[1]?.split('/')[0] ?? '';

        await page.goto(`/projects/${projectId}/approvals`);
        // Stránka se načte — ověříme přítomnost tabulky nebo prázdný stav
        await expect(page.locator('table').or(page.getByText('Žádné'))).toBeVisible();
    });
});

test.describe('Notifikace', () => {
    test('přihlášený uživatel vidí stránku notifikací', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        await page.goto('/notifications');
        await expect(page.locator('h1', { hasText: 'Notifikace' })).toBeVisible();
    });
});

test.describe('Autorizace', () => {
    test('logout přesměruje na login', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

        // Logout je POST — simulujeme přes fetch
        await page.evaluate(() => {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/logout';
            const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
            if (csrf) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = '_token';
                input.value = csrf.content;
                form.appendChild(input);
            }
            document.body.appendChild(form);
            form.submit();
        });
        await page.waitForURL(/\/login/);
        await expect(page).toHaveURL(/\/login/);
    });
});

test.describe('Audit log — date filter', () => {
    test('audit log zobrazuje date range picker', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        await page.goto('/admin/audit-log');

        await expect(page.locator('input[type="date"]').first()).toBeVisible();
        await expect(page.locator('input[type="date"]').nth(1)).toBeVisible();
    });
});
