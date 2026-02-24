import { test, expect } from '../helpers/test-fixtures';

// Create an invoice and upload the timesheet
// https://playwright.dev/docs/input#upload-files

test.describe('invoice attachments', () => {
  test('upload timesheet', async ({ page, loginAs }) => {
    await loginAs('admin');
    await page.goto('/invoices/create');

    // Create & upload
  });
});
