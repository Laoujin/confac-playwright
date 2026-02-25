import { test, expect } from '../../../helpers/test-fixtures';
import {
  generateBtwResponse,
  generateConsultant,
  generateInvoiceLine,
} from '../../../helpers/data/test-data-generators';

test.describe('Permission/Claims Enforcement', () => {
  test.describe('Readonly User', () => {
    test.beforeEach(async ({ loginAs }) => {
      // Login as a user with only view permissions
      await loginAs('viewer');
    });

    test('can view consultants list', async ({ consultantPage }) => {
      await consultantPage.gotoList();
      await expect(consultantPage.page).toHaveTitle(/Consultants/);
    });

    test('cannot see add consultant button', async ({ consultantPage }) => {
      await consultantPage.gotoList();
      await expect(consultantPage.addButton).not.toBeVisible();
    });

    test('can view clients list', async ({ clientPage }) => {
      await clientPage.gotoList();
      await expect(clientPage.page).toHaveTitle(/Klanten/);
    });

    test('cannot see add client button', async ({ clientPage }) => {
      await clientPage.gotoList();
      await expect(clientPage.addButton).not.toBeVisible();
    });

    test('can view projects list', async ({ projectPage }) => {
      await projectPage.gotoList();
      await expect(projectPage.page).toHaveTitle(/Projecten/);
    });

    test('cannot see add project button', async ({ projectPage }) => {
      await projectPage.gotoList();
      await expect(projectPage.addButton).not.toBeVisible();
    });

    test('can view invoices list', async ({ invoicePage }) => {
      await invoicePage.gotoList();
      await expect(invoicePage.page).toHaveTitle(/Facturen/);
    });

    test('cannot see add invoice button', async ({ invoicePage }) => {
      await invoicePage.gotoList();
      await expect(invoicePage.addButton).not.toBeVisible();
    });

    test('cannot access config page', async ({ page }) => {
      await page.goto('/config');

      // Should be redirected or shown access denied
      const accessDenied = page.getByText(/toegang|denied|permission/i);
      const redirected = await page.url();

      // Either shows access denied or redirected away from config
      const isDenied = await accessDenied.isVisible().catch(() => false);
      const isRedirected = !redirected.includes('/config');

      expect(isDenied || isRedirected).toBeTruthy();
    });
  });

  test.describe.skip('User Role (Standard User)', () => {
    // TODO: Fix page object models - tests timing out
    test.beforeEach(async ({ loginAs }) => {
      // Login as a standard user with CRUD but no delete/validate
      await loginAs('Test User');
    });

    test('can create consultants', async ({ consultantPage }) => {
      const consultant = generateConsultant();

      await consultantPage.gotoCreate();
      await consultantPage.fill(consultant);
      await consultantPage.expectSaveEnabled();
    });

    test('can edit consultants', async ({ consultantPage, loginAs }) => {
      // First create as admin
      await loginAs('admin');
      const consultant = generateConsultant();
      await consultantPage.create(consultant);

      // Now try to edit as user
      await loginAs('Test User');
      await consultantPage.gotoList();
      await consultantPage.clickEditOnRow(consultant.name);

      // Should be able to access edit form
      await consultantPage.fill({ email: 'updated@test.com' });
      await consultantPage.expectSaveEnabled();
    });

    test('can create clients', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();

      await clientPage.gotoCreate();
      await clientPage.performBtwLookup(btwResponse);
      await clientPage.expectSaveEnabled();
    });

    test('can create projects', async ({ projectPage, consultantPage, clientPage, loginAs }) => {
      // Create prerequisites as admin
      await loginAs('admin');
      const consultant = generateConsultant();
      await consultantPage.create(consultant);

      const btwResponse = generateBtwResponse();
      await clientPage.createWithBtwLookup(btwResponse);

      // Create project as user
      await loginAs('Test User');
      await projectPage.gotoCreate();
      await projectPage.selectConsultant(`${consultant.firstName} ${consultant.name}`);
      await projectPage.selectClient(btwResponse.name);
      await projectPage.setStartDate('2024-01-01');
      await projectPage.expectSaveEnabled();
    });

    test('can create invoices', async ({ invoicePage, clientPage, loginAs }) => {
      // Create client as admin
      await loginAs('admin');
      const btwResponse = generateBtwResponse();
      await clientPage.createWithBtwLookup(btwResponse);

      // Create invoice as user
      await loginAs('Test User');
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(btwResponse.name);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);

      await invoicePage.expectSaveEnabled();
    });

    test('cannot delete projects', async ({ projectPage, consultantPage, clientPage, loginAs }) => {
      // Create project as admin
      await loginAs('admin');
      const consultant = generateConsultant();
      await consultantPage.create(consultant);

      const btwResponse = generateBtwResponse();
      await clientPage.createWithBtwLookup(btwResponse);

      await projectPage.gotoCreate();
      await projectPage.selectConsultant(`${consultant.firstName} ${consultant.name}`);
      await projectPage.selectClient(btwResponse.name);
      await projectPage.setStartDate('2024-01-01');
      await projectPage.setRef('PRJ-USER-TEST');
      await projectPage.save();

      // Try to delete as user
      await loginAs('Test User');
      await projectPage.gotoList();
      await projectPage.clickRowWithText(`${consultant.firstName} ${consultant.name}`);

      // Delete button should not be visible or should be disabled
      const deleteVisible = await projectPage.deleteButton.isVisible().catch(() => false);
      if (deleteVisible) {
        await expect(projectPage.deleteButton).toBeDisabled();
      }
    });

    test('cannot validate invoices', async ({ invoicePage, clientPage, loginAs }) => {
      // Create invoice as admin
      await loginAs('admin');
      const btwResponse = generateBtwResponse();
      await clientPage.createWithBtwLookup(btwResponse);

      await invoicePage.gotoCreate();
      await invoicePage.selectClient(btwResponse.name);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);
      await invoicePage.save();

      // Try to validate as user
      await loginAs('Test User');
      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(btwResponse.name);

      // Validate button should not be visible or should be disabled
      const validateVisible = await invoicePage.validateButton.isVisible().catch(() => false);
      if (validateVisible) {
        await expect(invoicePage.validateButton).toBeDisabled();
      }
    });
  });

  test.describe('Admin Role', () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs('admin');
    });

    test('can access config page', async ({ page }) => {
      await page.goto('/config');
      await expect(page).toHaveTitle(/Configuratie/);
    });

    test.skip('can create consultants', async ({ consultantPage }) => {
      // TODO: Fix page object - timing out
      const consultant = generateConsultant();
      await consultantPage.create(consultant);
      await consultantPage.expectSaveSuccess();
    });

    test.skip('can delete projects', async ({ projectPage, consultantPage, clientPage }) => {
      const consultant = generateConsultant();
      await consultantPage.create(consultant);

      const btwResponse = generateBtwResponse();
      await clientPage.createWithBtwLookup(btwResponse);

      await projectPage.gotoCreate();
      await projectPage.selectConsultant(`${consultant.firstName} ${consultant.name}`);
      await projectPage.selectClient(btwResponse.name);
      await projectPage.setStartDate('2024-01-01');
      await projectPage.setRef('PRJ-ADMIN-DEL');
      await projectPage.save();

      await projectPage.gotoList();
      await projectPage.clickRowWithText(`${consultant.firstName} ${consultant.name}`);

      await expect(projectPage.deleteButton).toBeVisible();
      await expect(projectPage.deleteButton).toBeEnabled();
    });

    test.skip('can validate invoices', async ({ invoicePage, clientPage }) => {
      // TODO: Fix page object - timing out
      const btwResponse = generateBtwResponse();
      await clientPage.createWithBtwLookup(btwResponse);

      await invoicePage.gotoCreate();
      await invoicePage.selectClient(btwResponse.name);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);
      await invoicePage.save();

      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(btwResponse.name);

      await expect(invoicePage.validateButton).toBeEnabled();
      await invoicePage.validate();
      await invoicePage.expectStatus('validated');
    });

    test.skip('can delete invoices', async ({ invoicePage, clientPage }) => {
      // TODO: Fix page object - timing out
      const btwResponse = generateBtwResponse();
      await clientPage.createWithBtwLookup(btwResponse);

      await invoicePage.gotoCreate();
      await invoicePage.selectClient(btwResponse.name);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);
      await invoicePage.save();

      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(btwResponse.name);

      await expect(invoicePage.deleteButton).toBeVisible();
      await expect(invoicePage.deleteButton).toBeEnabled();
    });

    test.skip('can send Peppol invoices', async ({ invoicePage, clientPage, peppolMock }) => {
      // TODO: Fix page object - timing out
      const btwResponse = generateBtwResponse();
      await clientPage.gotoCreate();
      await clientPage.performBtwLookup(btwResponse);
      await clientPage.togglePeppol();
      await clientPage.save();

      await invoicePage.gotoCreate();
      await invoicePage.selectClient(btwResponse.name);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);
      await invoicePage.save();

      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(btwResponse.name);
      await invoicePage.validate();

      // Admin should see Peppol button
      await expect(invoicePage.sendPeppolButton).toBeVisible();
    });

    test.skip('can email invoices', async ({ invoicePage, clientPage }) => {
      // TODO: Fix page object - timing out
      const btwResponse = generateBtwResponse();
      await clientPage.createWithBtwLookup(btwResponse);

      await invoicePage.gotoCreate();
      await invoicePage.selectClient(btwResponse.name);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);
      await invoicePage.save();

      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(btwResponse.name);
      await invoicePage.validate();
      await invoicePage.markSent();

      // Admin should see email button
      await expect(invoicePage.sendEmailButton).toBeVisible();
    });
  });

  test.describe('Permission Edge Cases', () => {
    test('unauthenticated user redirected to login', async ({ page }) => {
      // Clear any existing auth
      await page.context().clearCookies();

      // Try to access protected page
      await page.goto('/consultants');

      // Should be on login page or see login form
      const loginInput = page.getByTestId('name');
      const loginButton = page.getByRole('button', { name: 'Confac Starten' });

      const onLoginPage = (await loginInput.isVisible().catch(() => false)) ||
        (await loginButton.isVisible().catch(() => false));

      expect(onLoginPage).toBeTruthy();
    });

    test('permission change affects UI immediately', async ({ loginAs, consultantPage }) => {
      // Start as admin
      await loginAs('admin');
      await consultantPage.gotoList();

      // Should see add button
      await expect(consultantPage.addButton).toBeVisible();

      // Re-login as viewer
      await loginAs('viewer');
      await consultantPage.gotoList();

      // Should not see add button
      await expect(consultantPage.addButton).not.toBeVisible();
    });
  });
});
