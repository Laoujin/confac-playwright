import { test as base, expect } from '@playwright/test';
import { MockClient, peppolMock, excelMock } from './MockClient';
import { ConsultantPage } from './pages/ConsultantPage';
import { ClientPage } from './pages/ClientPage';
import { ProjectPage } from './pages/ProjectPage';
import { InvoicePage } from './pages/InvoicePage';

// Extend the base test with our custom fixtures
export const test = base.extend<{
  peppolMock: MockClient;
  excelMock: MockClient;
  loginAs: (user: 'admin' | 'viewer' | string) => Promise<void>;
  consultantPage: ConsultantPage;
  clientPage: ClientPage;
  projectPage: ProjectPage;
  invoicePage: InvoicePage;
}>({
  // Peppol/Billit mock client - reset before each test
  peppolMock: async ({}, use) => {
    await peppolMock.reset();
    await use(peppolMock);
  },

  // Excel mock client - reset before each test
  excelMock: async ({}, use) => {
    await excelMock.reset();
    await use(excelMock);
  },

  // Login helper - simplified login via name input (not Google)
  loginAs: async ({ page }, use) => {
    const login = async (user: 'admin' | 'viewer' | string) => {
      // Navigate to login page
      await page.goto('/');

      // Wait for login form
      const loginInput = page.getByTestId('name');
      const loginInputAlt = page.locator('input[name="name"]');

      const input = await loginInput.isVisible().catch(() => false)
        ? loginInput
        : loginInputAlt;

      if (await input.isVisible()) {
        const userName = user === 'admin' ? 'Test Admin' : user === 'viewer' ? 'Test Viewer' : user;
        await input.fill(userName);

        const loginButton = page.getByRole('button', { name: 'Confac Starten' });
        await loginButton.click();

        // Wait for navigation to complete
        await page.waitForSelector('#basic-navbar-nav', { timeout: 10000 });
      }
    };

    await use(login);
  },

  // Page Object fixtures
  consultantPage: async ({ page }, use) => {
    const consultantPage = new ConsultantPage(page);
    await use(consultantPage);
  },

  clientPage: async ({ page }, use) => {
    const clientPage = new ClientPage(page);
    await use(clientPage);
  },

  projectPage: async ({ page }, use) => {
    const projectPage = new ProjectPage(page);
    await use(projectPage);
  },

  invoicePage: async ({ page }, use) => {
    const invoicePage = new InvoicePage(page);
    await use(invoicePage);
  },
});

export { expect };

// Re-export mock clients for direct use
export { peppolMock, excelMock, MockClient };

// Re-export page objects for direct instantiation
export { ConsultantPage, ClientPage, ProjectPage, InvoicePage };
