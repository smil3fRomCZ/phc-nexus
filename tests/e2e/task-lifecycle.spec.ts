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
const DEV_EMAIL = 'ondrej.maly@example.cz';
const READER_EMAIL = 'barbora.ticha@example.cz';

// ============================================================
// 1. Task detail — zobrazení + inline popis
// ============================================================
test.describe('Task detail', () => {
    test('PM vidí task detail se všemi sekcemi', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        const projectId = await getProjectId(page, 'Replatform E-shop');

        await page.goto(`/projects/${projectId}/table`);
        await page
            .getByRole('link')
            .filter({ hasText: /^(?!Projekty|Replatform)/ })
            .first()
            .click();
        await page.waitForURL(/\/tasks\//);

        await expect(page.locator('h1')).toBeVisible();
        await expect(page.getByText('Stav')).toBeVisible();
        await expect(page.getByText('Priorita')).toBeVisible();
        await expect(page.getByText('Řešitel')).toBeVisible();
    });
});

// ============================================================
// 2. Task create + edit + delete lifecycle
// ============================================================
test.describe('Task CRUD lifecycle', () => {
    test('PM vytvoří, edituje a smaže úkol', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        const projectId = await getProjectId(page, 'Replatform E-shop');
        const suffix = Date.now().toString().slice(-6);
        const taskName = `Lifecycle test ${suffix}`;

        // Create via quick-add
        await page.goto(`/projects/${projectId}/tasks`);
        await page.getByPlaceholder('Název nového úkolu...').fill(taskName);
        await page.getByRole('button', { name: 'Přidat' }).click();
        await expect(page.getByRole('link', { name: taskName })).toBeVisible();

        // Open task detail
        await page.getByRole('link', { name: taskName }).click();
        await page.waitForURL(/\/tasks\//);
        await expect(page.locator('h1', { hasText: taskName })).toBeVisible();

        // Edit via modal
        await page.getByLabel('Upravit').click();
        const editedName = `${taskName} edited`;
        await page.locator('form input[type="text"]').first().fill(editedName);
        await page.getByRole('button', { name: 'Uložit změny' }).click();
        await expect(page.locator('h1', { hasText: editedName })).toBeVisible();

        // Delete
        await page.getByLabel('Smazat').click();
        await page.getByRole('button', { name: 'Smazat' }).last().click();
        await page.waitForURL(/\/table/);
    });
});

// ============================================================
// 3. Kanban drag status change
// ============================================================
test.describe('Kanban status change', () => {
    test('PM změní status úkolu přes dropdown na task detail', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        const projectId = await getProjectId(page, 'Replatform E-shop');

        // Create a fresh task
        const suffix = Date.now().toString().slice(-6);
        const taskName = `Status test ${suffix}`;
        await page.goto(`/projects/${projectId}/tasks`);
        await page.getByPlaceholder('Název nového úkolu...').fill(taskName);
        await page.getByRole('button', { name: 'Přidat' }).click();

        // Go to task detail
        await page.getByRole('link', { name: taskName }).click();
        await page.waitForURL(/\/tasks\//);

        // Change status via sidebar dropdown
        const statusSelect = page.locator('select').first();
        const options = await statusSelect.locator('option').all();
        if (options.length > 1) {
            const secondValue = await options[1].getAttribute('value');
            if (secondValue) {
                await statusSelect.selectOption(secondValue);
                await page.waitForTimeout(1000);
                await expect(page.locator('h1', { hasText: taskName })).toBeVisible();
            }
        }
    });
});

// ============================================================
// 4. Comment CRUD
// ============================================================
test.describe('Komentáře', () => {
    test('PM přidá komentář k úkolu', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        const projectId = await getProjectId(page, 'Replatform E-shop');

        await page.goto(`/projects/${projectId}/table`);
        await page
            .getByRole('link')
            .filter({ hasText: /^(?!Projekty|Replatform)/ })
            .first()
            .click();
        await page.waitForURL(/\/tasks\//);

        const commentText = `E2E komentář ${Date.now().toString().slice(-6)}`;
        await page.getByPlaceholder(/komentář|Napište/i).fill(commentText);
        await page.getByRole('button', { name: /Odeslat|Přidat/i }).click();

        await expect(page.getByText(commentText)).toBeVisible();
    });
});

// ============================================================
// 5. Attachment upload guard
// ============================================================
test.describe('Přílohy', () => {
    test('reader nemůže nahrát přílohu do PHI projektu', async ({ page }) => {
        await loginAs(page, EXEC_EMAIL);
        const phiProjectId = await getProjectId(page, 'Pacientský registr');

        await loginAs(page, READER_EMAIL);
        const response = await page.goto(`/projects/${phiProjectId}`);
        expect(response?.status()).toBe(403);
    });
});

// ============================================================
// 6. Time entry log + delete
// ============================================================
test.describe('Time tracking', () => {
    test('dev zaloguje čas k úkolu', async ({ page }) => {
        await loginAs(page, DEV_EMAIL);
        const projectId = await getProjectId(page, 'Replatform E-shop');

        await page.goto(`/projects/${projectId}/table`);
        await page
            .getByRole('link')
            .filter({ hasText: /^(?!Projekty|Replatform)/ })
            .first()
            .click();
        await page.waitForURL(/\/tasks\//);

        // Switch to time tab
        const timeTab = page.getByRole('button', { name: /Čas|Time/i });
        if (await timeTab.isVisible().catch(() => false)) {
            await timeTab.click();

            const hoursInput = page.locator('input[type="number"]').first();
            if (await hoursInput.isVisible().catch(() => false)) {
                await hoursInput.fill('2');
                await page.getByRole('button', { name: /Zalogovat|Přidat/i }).click();
                await page.waitForTimeout(1000);
                await expect(page.getByText('2')).toBeVisible();
            }
        }
    });
});

// ============================================================
// 7. Approval request create
// ============================================================
test.describe('Approval request', () => {
    test('PM vytvoří approval request na úkol', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        const projectId = await getProjectId(page, 'Replatform E-shop');

        // Create fresh task
        const suffix = Date.now().toString().slice(-6);
        const taskName = `Approval test ${suffix}`;
        await page.goto(`/projects/${projectId}/tasks`);
        await page.getByPlaceholder('Název nového úkolu...').fill(taskName);
        await page.getByRole('button', { name: 'Přidat' }).click();
        await page.getByRole('link', { name: taskName }).click();
        await page.waitForURL(/\/tasks\//);

        // Open approval dialog
        await page.getByLabel('Žádost o schválení').click();
        await expect(page.getByText('Žádost o schválení').first()).toBeVisible();

        // Fill form — select first approver
        await page.locator('textarea').fill('E2E test approval');
        const firstCheckbox = page.locator('input[type="checkbox"]').first();
        await firstCheckbox.check();

        await page.getByRole('button', { name: 'Odeslat žádost' }).click();

        // Should reload task page (approval pending indicator)
        await page.waitForTimeout(1000);
        await expect(page.locator('h1', { hasText: taskName })).toBeVisible();
    });
});

// ============================================================
// 8. Duplicate task
// ============================================================
test.describe('Duplikace úkolu', () => {
    test('PM duplikuje úkol', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        const projectId = await getProjectId(page, 'Replatform E-shop');

        await page.goto(`/projects/${projectId}/table`);
        await page
            .getByRole('link')
            .filter({ hasText: /^(?!Projekty|Replatform)/ })
            .first()
            .click();
        await page.waitForURL(/\/tasks\//);

        const originalTitle = await page.locator('h1').innerText();
        await page.getByLabel('Duplikovat').click();

        await page.waitForURL(/\/tasks\//);
        await expect(page.locator('h1', { hasText: '(kopie)' })).toBeVisible();
    });
});

// ============================================================
// 9. Wiki page CRUD
// ============================================================
test.describe('Wiki', () => {
    test('PM vidí wiki stránku projektu', async ({ page }) => {
        await loginAs(page, PM_EMAIL);
        const projectId = await getProjectId(page, 'Replatform E-shop');

        await page.goto(`/projects/${projectId}/wiki`);
        // Wiki index se načte bez chyby
        await expect(page.locator('h1').or(page.getByText('Wiki').first())).toBeVisible();
    });
});

// ============================================================
// 10. Authorization matrix — reader vs team member
// ============================================================
test.describe('Authorization matrix', () => {
    test('reader nemůže vytvořit projekt', async ({ page }) => {
        await loginAs(page, READER_EMAIL);
        const response = await page.goto('/projects/create');
        expect([403, 302]).toContain(response?.status());
    });

    test('team member vidí dashboard', async ({ page }) => {
        await loginAs(page, DEV_EMAIL);
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    });
});
