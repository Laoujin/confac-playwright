import { test, expect } from '@playwright/test';
import { ConfigPage } from '../../helpers/pages/ConfigPage';

/**
 * Config CRUD Tests
 *
 * Tests the configuration page functionality:
 * - Read: Verify config values are loaded correctly
 * - Update: Modify and save config values
 * - Validation: Ensure changes are detected and persisted
 */
test.describe('Config CRUD', () => {

  test('should display current config values', async ({ page }) => {
    const configPage = new ConfigPage(page);
    await configPage.goto();

    // Verify the page loaded with seeded data
    const companyName = await configPage.getCompanyName();
    expect(companyName).toBeTruthy();
    expect(companyName).toBe('Test Company');
  });

  test('should update company name and save', async ({ page }) => {
    const configPage = new ConfigPage(page);
    await configPage.goto();

    // Read original value
    const originalName = await configPage.getCompanyName();
    expect(originalName).toBe('Test Company');

    // Update the company name
    const newName = 'Updated Company Name';
    await configPage.setCompanyName(newName);

    // Save changes
    await configPage.save();
    await configPage.expectSaveSuccess();

    // Reload the page to verify persistence
    await configPage.goto();

    // Verify the change persisted
    const savedName = await configPage.getCompanyName();
    expect(savedName).toBe(newName);

    // Restore original value for other tests
    await configPage.setCompanyName(originalName);
    await configPage.save();
  });

  test('should update multiple fields and save', async ({ page }) => {
    const configPage = new ConfigPage(page);
    await configPage.goto();

    // Store original values
    const originalName = await configPage.getCompanyName();
    const originalAddress = await configPage.getCompanyAddress();

    // Update multiple fields
    const newName = 'Multi-Update Test Company';
    const newAddress = 'New Test Address 123';

    await configPage.setCompanyName(newName);
    await configPage.setCompanyAddress(newAddress);

    // Save changes
    await configPage.save();
    await configPage.expectSaveSuccess();

    // Reload and verify
    await configPage.goto();

    expect(await configPage.getCompanyName()).toBe(newName);
    expect(await configPage.getCompanyAddress()).toBe(newAddress);

    // Restore original values
    await configPage.setCompanyName(originalName);
    await configPage.setCompanyAddress(originalAddress);
    await configPage.save();
  });

  test('should show changes modal when navigating away with unsaved changes', async ({ page }) => {
    const configPage = new ConfigPage(page);
    await configPage.goto();

    // Make a change
    await configPage.setCompanyName('Unsaved Change');

    // Try to navigate away
    await configPage.navigateAway();

    // Verify the changes modal appears
    await configPage.expectChangesModal();
    await expect(page).toHaveTitle(/Configuratie/);
  });

  test('should stay on page when clicking "stay" in changes modal', async ({ page }) => {
    const configPage = new ConfigPage(page);
    await configPage.goto();

    // Make a change
    const changedName = 'Stay Test';
    await configPage.setCompanyName(changedName);

    // Try to navigate away
    await configPage.navigateAway();

    // Click "stay on page"
    await configPage.stayOnPage();

    // Verify we're still on the config page with our changes
    await expect(page).toHaveTitle(/Configuratie/);
    expect(await configPage.getCompanyName()).toBe(changedName);
  });

  test('should navigate away when discarding changes', async ({ page }) => {
    const configPage = new ConfigPage(page);
    await configPage.goto();

    // Make a change
    await configPage.setCompanyName('Discarded Change');

    // Try to navigate away
    await configPage.navigateAway();

    // Click "discard changes"
    await configPage.discardChanges();

    // Verify we navigated to the invoices page
    await expect(page).toHaveURL(/\/invoices/);
  });

  test('should not show changes modal when navigating without changes', async ({ page }) => {
    const configPage = new ConfigPage(page);
    await configPage.goto();

    // Navigate away without making changes
    await page.getByRole('link', { name: 'Facturen' }).click();

    // Should navigate directly without modal
    await expect(page).toHaveURL(/\/invoices/);
  });
});
