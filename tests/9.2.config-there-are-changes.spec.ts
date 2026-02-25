import { test, expect } from '../helpers/test-fixtures';

test.describe('edit config', () => {
  test.skip('leaving page should trigger "there are changes" modal', async ({ page, loginAs }) => {
    // TODO: Fix this test - modal text or timing issues
    await loginAs('admin');
    await page.goto('/config');

    await page.getByPlaceholder('Bedrijfsnaam').fill('itenium');
    await page.getByRole('link', {name: 'Facturen'}).click();

    await expect(page).toHaveTitle(/Configuratie/);
    await expect(page.getByText('Er zijn wijzigingen')).toBeVisible();
  });

  test.skip('"Nee, blijf op de pagina" stays on the page', async ({ page }) => {});
  test.skip('"Ja, verder zonder bewaren" does navigate', async ({ page }) => {});
});
