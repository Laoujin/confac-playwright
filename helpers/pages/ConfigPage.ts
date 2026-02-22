import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Config page
 * Provides methods to interact with company configuration settings
 */
export class ConfigPage {
  readonly page: Page;

  // Login elements (for anonymous login)
  readonly loginNameInput: Locator;
  readonly loginButton: Locator;

  // Company section
  readonly companyNameInput: Locator;
  readonly companyAddressInput: Locator;
  readonly companyPostalCodeInput: Locator;
  readonly companyCityInput: Locator;
  readonly companyTelephoneInput: Locator;
  readonly companyEmailInput: Locator;
  readonly companyWebsiteInput: Locator;
  readonly companyBtwInput: Locator;
  readonly companyRprInput: Locator;
  readonly companyBankInput: Locator;
  readonly companyIbanInput: Locator;
  readonly companyBicInput: Locator;

  // Invoice section
  readonly invoicePayDaysInput: Locator;

  // Other section
  readonly initialMonthLoadInput: Locator;

  // Actions
  readonly saveButton: Locator;

  // Modals
  readonly changesModal: Locator;
  readonly stayOnPageButton: Locator;
  readonly discardChangesButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Login elements
    this.loginNameInput = page.getByTestId('name');
    this.loginButton = page.getByRole('button', { name: 'Confac Starten' });

    // Company section inputs - using placeholder text as seen in existing tests
    this.companyNameInput = page.getByPlaceholder('Bedrijfsnaam');
    this.companyAddressInput = page.getByPlaceholder('Adres');
    this.companyPostalCodeInput = page.getByPlaceholder('Postcode');
    this.companyCityInput = page.getByPlaceholder('Stad');
    this.companyTelephoneInput = page.getByPlaceholder('Telefoon');
    this.companyEmailInput = page.locator('input[placeholder="Email"][name="company.email"]');
    this.companyWebsiteInput = page.getByPlaceholder('Website');
    this.companyBtwInput = page.getByPlaceholder('BTW');
    this.companyRprInput = page.getByPlaceholder('RPR');
    this.companyBankInput = page.getByPlaceholder('Bank');
    this.companyIbanInput = page.getByPlaceholder('IBAN');
    this.companyBicInput = page.getByPlaceholder('BIC');

    // Invoice section
    this.invoicePayDaysInput = page.locator('input[name="invoicePayDays"]');

    // Other section
    this.initialMonthLoadInput = page.locator('input[name="initialMonthLoad"]');

    // Save button with class tst-save-config
    this.saveButton = page.locator('.tst-save-config');

    // Modals
    this.changesModal = page.getByText('Er zijn wijzigingen');
    this.stayOnPageButton = page.getByRole('button', { name: /Nee.*blijf/i });
    this.discardChangesButton = page.getByRole('button', { name: /Ja.*verder/i });
  }

  /**
   * Login with anonymous user if not already logged in
   */
  async ensureLoggedIn(userName: string = 'Test Admin') {
    // Check if we're on login page by looking for the login button
    if (await this.loginButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.loginNameInput.fill(userName);
      await this.loginButton.click();
      // Wait for navigation to complete
      await this.page.waitForURL(/.*(?<!login)$/);
    }
  }

  async goto() {
    await this.page.goto('/config');

    // Handle login if redirected to login page
    if (await this.loginButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.ensureLoggedIn();
      await this.page.goto('/config');
    }

    await expect(this.page).toHaveTitle(/Configuratie/);
  }

  async getCompanyName(): Promise<string> {
    return await this.companyNameInput.inputValue();
  }

  async setCompanyName(name: string) {
    await this.companyNameInput.fill(name);
  }

  async getCompanyAddress(): Promise<string> {
    return await this.companyAddressInput.inputValue();
  }

  async setCompanyAddress(address: string) {
    await this.companyAddressInput.fill(address);
  }

  async getCompanyCity(): Promise<string> {
    return await this.companyCityInput.inputValue();
  }

  async setCompanyCity(city: string) {
    await this.companyCityInput.fill(city);
  }

  async getInvoicePayDays(): Promise<string> {
    return await this.invoicePayDaysInput.inputValue();
  }

  async setInvoicePayDays(days: number) {
    await this.invoicePayDaysInput.fill(days.toString());
  }

  async save() {
    await this.saveButton.click();
    // Wait for save to complete - the button might show a loading state
    await this.page.waitForLoadState('networkidle');
  }

  async expectSaveSuccess() {
    // After saving, the page should still be on config and the changes should be persisted
    await expect(this.page).toHaveTitle(/Configuratie/);
  }

  async expectChangesModal() {
    await expect(this.changesModal).toBeVisible();
  }

  async stayOnPage() {
    await this.stayOnPageButton.click();
  }

  async discardChanges() {
    await this.discardChangesButton.click();
  }

  async navigateAway() {
    // Try to navigate to another page to trigger the changes modal
    await this.page.getByRole('link', { name: 'Facturen' }).click();
  }
}
