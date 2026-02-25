import { test, expect } from '../helpers/test-fixtures';

// Fixtures: https://playwright.dev/docs/test-fixtures
// Global setup: https://playwright.dev/docs/test-global-setup-teardown
// Snapshot testing: https://playwright.dev/docs/aria-snapshots

// npx playwright test --update-snapshots --update-source-method=3way

test.describe('admin role', () => {
  test('sees navigation links', async ({ page, loginAs }) => {
    await loginAs('admin');
    await page.goto('/');

    // Verify main navigation links are visible
    await expect(page.getByRole('link', { name: 'Facturatie' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Projecten' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Klanten' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Facturen' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Config' })).toBeVisible();
  });
});
