import { test, expect } from '../helpers/test-fixtures';

// Add multiple lines to an invoice
// Use drag & drop to change the order of the lines
// https://playwright.dev/docs/input#drag-and-drop

test.describe('edit invoice', () => {
  test('re-order invoice lines', async ({ page, loginAs }) => {
    await loginAs('admin');
    await page.goto('/invoices/create');

    await page.getByText('Factuurlijn toevoegen').click();
    await expect(page.getByTestId('desc')).toHaveCount(2);

    const descs = await page.getByTestId('desc').all();
    for (const [index, desc] of descs.entries())
      await desc.fill('desc ' + index);

    // Swap em ;)
  });
});
