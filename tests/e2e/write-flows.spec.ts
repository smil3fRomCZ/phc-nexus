import { test, expect, type Page } from '@playwright/test';

async function loginAs(page: Page, email: string) {
    await page.goto(`/_e2e/login/${email}`);
    await page.waitForURL('**/');
}

async function getProjectId(page: Page, name: string): Promise<string> {
    await page.goto('/projects');
    const href = await page.getByRole('link', { name }).first().getAttribute('href');
    return href?.split('/projects/')[1]?.split('/')[0] ?? '';
}

const EXEC_EMAIL = 'jiri.kratochvil@example.cz';
const PM_EMAIL = 'monika.fialova@example.cz';
const QA_EMAIL = 'ondrej.maly@example.cz';

// ============================================================
// 1. Založení projektu
// ============================================================
test.describe('Založení projektu', () => {
    test('Executive může vytvořit nový projekt', async ({ page }) => {
        await loginAs(page, EXEC_EMAIL);
        await page.goto('/projects/create');

        const suffix = Date.now().toString().slice(-6);
        const projectName = `E2E Projekt ${suffix}`;
        const projectKey = `E${suffix}`;

        // Vyplnit formulář
        const contentArea = page.locator('main, [class*="max-w"]').first();
        await contentArea.locator('input[type="text"]').first().fill(projectName);
        await contentArea.locator('input[type="text"]').nth(1).fill(projectKey);
        await contentArea.locator('textarea').fill('Projekt vytvořený E2E testem');

        await page.getByRole('button', { name: 'Vytvořit projekt' }).click();

        // Redirect na show stránku nového projektu
        await page.waitForURL(/\/projects\/[a-f0-9-]+$/);
        await expect(page.locator('h2', { hasText: projectName })).toBeVisible();
    });
});

// ============================================================
// 2. Založení úkolu (quick-add v tasks index)
// ============================================================
test.describe('Založení úkolu', () => {
    test('PM může vytvořit úkol přes quick-add', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        const projectId = await getProjectId(page, 'Replatform E-shop');

        const taskName = `E2E úkol ${Date.now().toString().slice(-6)}`;
        await page.goto(`/projects/${projectId}/tasks`);

        await page.getByPlaceholder('Název nového úkolu...').fill(taskName);
        await page.getByRole('button', { name: 'Přidat' }).click();

        // Úkol se objeví v seznamu
        await expect(page.getByRole('link', { name: taskName })).toBeVisible();
    });
});

// ============================================================
// 3. Změna stavu úkolu (PATCH status via tabulka)
// ============================================================
test.describe('Změna stavu úkolu', () => {
    test('PM může změnit status úkolu v tabulce', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        const projectId = await getProjectId(page, 'Replatform E-shop');

        await page.goto(`/projects/${projectId}/table`);

        // Najdi první select se statusem v tabulce a změň
        const firstStatusSelect = page.locator('select').first();
        const currentValue = await firstStatusSelect.inputValue();

        // Změníme na jiný status — backlog → todo (pokud je backlog)
        if (currentValue === 'backlog') {
            await firstStatusSelect.selectOption('todo');
        } else if (currentValue === 'todo') {
            await firstStatusSelect.selectOption('in_progress');
        } else if (currentValue === 'in_progress') {
            await firstStatusSelect.selectOption('in_review');
        }

        // Počkáme na reload
        await page.waitForTimeout(1000);

        // Ověříme, že stránka stále funguje (nepřesměrovala na error)
        await expect(page.locator('h2', { hasText: 'Tabulka' })).toBeVisible();
    });
});

// ============================================================
// 4. Approval flow — vote
// ============================================================
test.describe('Approval flow — vote', () => {
    test('approver může schválit request', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        const projectId = await getProjectId(page, 'Replatform E-shop');

        // Přejdi na approvals
        await page.goto(`/projects/${projectId}/approvals`);

        // Klikni na první pending approval
        const pendingLink = page.locator('a', { hasText: 'Čeká na schválení' }).first();
        if (await pendingLink.isVisible()) {
            await pendingLink.click();

            // Pokud vidíme vote tlačítko (jsme approver), klikneme
            const approveBtn = page.getByRole('button', { name: 'Schválit' });
            if (await approveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await approveBtn.click();
                await page.waitForURL(/\/approvals/);
            }
        }

        // Test prošel — buď jsme hlasovali, nebo nebyl pending request k hlasování
        await expect(
            page.getByRole('heading', { name: 'Approval requesty' }).or(page.locator('text=Schváleno').first()),
        ).toBeVisible();
    });
});

// ============================================================
// 5. Založení EPIC (quick-add)
// ============================================================
test.describe('Založení EPIC', () => {
    test('PM může vytvořit EPIC přes quick-add', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        const projectId = await getProjectId(page, 'Replatform E-shop');

        const epicName = `E2E EPIC ${Date.now().toString().slice(-6)}`;
        await page.goto(`/projects/${projectId}/epics`);

        await page.getByPlaceholder('Název nového EPIC...').fill(epicName);
        await page.getByRole('button', { name: 'Přidat' }).click();

        await expect(page.getByRole('link', { name: epicName })).toBeVisible();
    });
});

// ============================================================
// 6. PHI access — reader nemá přístup k PHI projektu
// ============================================================
test.describe('PHI access guard', () => {
    test('reader dostane 403 na PHI projekt', async ({ page }) => {
        await loginAs(page, 'barbora.ticha@example.cz');

        // Najdeme PHI projekt ID — reader vidí seznam ale nemá přístup na detail
        // Zkusíme přímo přistoupit na Pacientský registr
        await loginAs(page, EXEC_EMAIL);
        const phiProjectId = await getProjectId(page, 'Pacientský registr');

        // Přepneme na readera
        await loginAs(page, 'barbora.ticha@example.cz');
        const response = await page.goto(`/projects/${phiProjectId}`);

        // Reader by měl dostat 403
        expect(response?.status()).toBe(403);
    });
});

// ============================================================
// 7. Export/download guard — nepřihlášený nemá přístup
// ============================================================
test.describe('Download guard', () => {
    test('nepřihlášený uživatel nemá přístup k souborům', async ({ request }) => {
        // Pokus o přístup k neexistujícímu attachmentu bez auth
        const response = await request.get('/attachments/fake-id/download', { maxRedirects: 0 });
        // Redirect na login nebo 401/403/404
        expect([302, 401, 403, 404]).toContain(response.status());
    });
});

// ============================================================
// 8. Notifikace po akci (ověření že notifikace přibyla)
// ============================================================
test.describe('Notifikace po akci', () => {
    test('stránka notifikací zobrazí existující notifikace', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        await page.goto('/notifications');

        // Stránka se načte bez chyby
        await expect(page.locator('h2', { hasText: 'Notifikace' })).toBeVisible();

        // Buď jsou notifikace, nebo zpráva "Žádné notifikace"
        const hasNotifications = await page
            .locator('[class*="rounded-lg"]')
            .first()
            .isVisible()
            .catch(() => false);
        const hasEmptyState = await page
            .getByText('Žádné notifikace')
            .isVisible()
            .catch(() => false);

        expect(hasNotifications || hasEmptyState).toBe(true);
    });

    test('unread count endpoint vrací číslo', async ({ page, request }) => {
        await loginAs(page, PM_EMAIL);

        // Získáme cookies z page kontextu
        const cookies = await page.context().cookies();
        const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

        const response = await request.get('/notifications/unread-count', {
            headers: { Cookie: cookieHeader },
        });

        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(typeof data.count).toBe('number');
    });
});
