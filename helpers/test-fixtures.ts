import { test as base, expect } from '@playwright/test';
import { MockClient, peppolMock, excelMock } from './MockClient';

// Extend the base test with our custom fixtures
export const test = base.extend<{
  peppolMock: MockClient;
  excelMock: MockClient;
  loginAs: (user: 'admin' | 'viewer' | string) => Promise<void>;
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

      // Wait for login form (assuming there's a name-based login for tests)
      // The brainstorm specifies: "Login via name input field (not Google)"
      const loginInput = page.getByTestId('login-name') || page.locator('input[name="name"]');

      if (await loginInput.isVisible()) {
        const userName = user === 'admin' ? 'Test Admin' : user === 'viewer' ? 'Test Viewer' : user;
        await loginInput.fill(userName);

        const loginButton = page.getByTestId('login-submit') || page.locator('button[type="submit"]');
        await loginButton.click();

        // Wait for navigation to complete
        await page.waitForURL(/.*(?<!login)$/);
      }
    };

    await use(login);
  },
});

export { expect };

// Re-export mock clients for direct use
export { peppolMock, excelMock, MockClient };
