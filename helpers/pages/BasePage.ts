import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object Model with common functionality
 * All entity pages should extend this class
 */
export abstract class BasePage {
  readonly page: Page;

  // Common elements
  readonly saveButton: Locator;
  readonly addButton: Locator;
  readonly deleteButton: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelButton: Locator;
  readonly searchInput: Locator;
  readonly toast: Locator;
  readonly loadingSpinner: Locator;

  // Login elements (for anonymous login)
  readonly loginNameInput: Locator;
  readonly loginButton: Locator;

  // Modals
  readonly changesModal: Locator;
  readonly stayOnPageButton: Locator;
  readonly discardChangesButton: Locator;

  constructor(page: Page, saveButtonSelector: string) {
    this.page = page;

    // Common elements
    this.saveButton = page.locator(saveButtonSelector);
    this.addButton = page.getByTestId('add');
    this.deleteButton = page.getByTestId('delete');
    this.confirmDeleteButton = page.getByTestId('confirm-delete');
    this.cancelButton = page.getByTestId('cancel');
    this.searchInput = page.getByTestId('search');
    this.toast = page.locator('.Toastify__toast');
    this.loadingSpinner = page.locator('.loading-spinner');

    // Login elements
    this.loginNameInput = page.getByTestId('name');
    this.loginButton = page.getByRole('button', { name: 'Confac Starten' });

    // Modals
    this.changesModal = page.getByText('Er zijn wijzigingen');
    this.stayOnPageButton = page.getByRole('button', { name: /Nee.*blijf/i });
    this.discardChangesButton = page.getByRole('button', { name: /Ja.*verder/i });
  }

  /**
   * Abstract methods that subclasses must implement
   */
  abstract getListUrl(): string;
  abstract getCreateUrl(): string;
  abstract getEditUrl(id: string): string;
  abstract getPageTitlePattern(): RegExp;

  /**
   * Ensure user is logged in before performing actions
   */
  async ensureLoggedIn(userName: string = 'Test Admin'): Promise<void> {
    await this.page.goto('/');

    const loginVisible = await this.loginButton.isVisible({ timeout: 2000 }).catch(() => false);
    const inputVisible = await this.loginNameInput.isVisible({ timeout: 500 }).catch(() => false);

    if (loginVisible || inputVisible) {
      await this.loginNameInput.fill(userName);
      await this.loginButton.click();
      await this.page.waitForSelector('#basic-navbar-nav', { timeout: 10000 });
    }
  }

  /**
   * Navigate to the list page
   */
  async gotoList(): Promise<void> {
    await this.page.goto(this.getListUrl());
    await this.waitForPageLoad();
  }

  /**
   * Navigate to the create page
   */
  async gotoCreate(): Promise<void> {
    await this.page.goto(this.getCreateUrl());
    await this.waitForPageLoad();
  }

  /**
   * Navigate to the edit page for a specific entity
   */
  async gotoEdit(id: string): Promise<void> {
    await this.page.goto(this.getEditUrl(id));
    await this.waitForPageLoad();
  }

  /**
   * Click the add button to go to create page
   */
  async clickAdd(): Promise<void> {
    await this.addButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Save the current form
   */
  async save(): Promise<void> {
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Delete the current entity
   */
  async delete(): Promise<void> {
    await this.deleteButton.click();
  }

  /**
   * Confirm delete in the modal
   */
  async confirmDelete(): Promise<void> {
    await this.confirmDeleteButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Search in the list
   */
  async search(text: string): Promise<void> {
    await this.searchInput.fill(text);
    // Give time for filtering to apply
    await this.page.waitForTimeout(300);
  }

  /**
   * Clear search
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.page.waitForTimeout(300);
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for and verify toast message
   */
  async expectToast(message: string | RegExp): Promise<void> {
    await expect(this.toast).toContainText(message);
  }

  /**
   * Expect success toast
   */
  async expectSaveSuccess(): Promise<void> {
    await expect(this.page).toHaveTitle(this.getPageTitlePattern());
  }

  /**
   * Expect the save button to be enabled
   */
  async expectSaveEnabled(): Promise<void> {
    await expect(this.saveButton).toBeEnabled();
  }

  /**
   * Expect the save button to be disabled
   */
  async expectSaveDisabled(): Promise<void> {
    await expect(this.saveButton).toBeDisabled();
  }

  /**
   * Handle unsaved changes modal - stay on page
   */
  async stayOnPage(): Promise<void> {
    await expect(this.changesModal).toBeVisible();
    await this.stayOnPageButton.click();
  }

  /**
   * Handle unsaved changes modal - discard changes
   */
  async discardChanges(): Promise<void> {
    await expect(this.changesModal).toBeVisible();
    await this.discardChangesButton.click();
  }

  /**
   * Navigate away to trigger unsaved changes modal
   */
  async navigateAway(): Promise<void> {
    await this.page.getByRole('link', { name: 'Facturen' }).click();
  }

  /**
   * Get table rows from list view
   */
  getTableRows(): Locator {
    return this.page.locator('table tbody tr');
  }

  /**
   * Get row count in list view
   */
  async getRowCount(): Promise<number> {
    return await this.getTableRows().count();
  }

  /**
   * Click on a row by index (0-based)
   */
  async clickRow(index: number): Promise<void> {
    await this.getTableRows().nth(index).click();
  }

  /**
   * Click on a row containing specific text
   */
  async clickRowWithText(text: string): Promise<void> {
    await this.getTableRows().filter({ hasText: text }).first().click();
  }

  /**
   * Check if row with text exists
   */
  async rowExists(text: string): Promise<boolean> {
    const count = await this.getTableRows().filter({ hasText: text }).count();
    return count > 0;
  }

  /**
   * Expect row count
   */
  async expectRowCount(count: number): Promise<void> {
    await expect(this.getTableRows()).toHaveCount(count);
  }

  /**
   * Get input field by test ID
   */
  getField(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Fill input field by test ID
   */
  async fillField(testId: string, value: string): Promise<void> {
    await this.getField(testId).fill(value);
  }

  /**
   * Get input value by test ID
   */
  async getFieldValue(testId: string): Promise<string> {
    return await this.getField(testId).inputValue();
  }

  /**
   * Expect field to have value
   */
  async expectFieldValue(testId: string, value: string): Promise<void> {
    await expect(this.getField(testId)).toHaveValue(value);
  }

  /**
   * Check if element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible().catch(() => false);
  }

  /**
   * Check if element is hidden
   */
  async isHidden(locator: Locator): Promise<boolean> {
    return !(await this.isVisible(locator));
  }

  /**
   * Wait for element to be visible
   */
  async waitForVisible(locator: Locator, timeout: number = 5000): Promise<void> {
    await expect(locator).toBeVisible({ timeout });
  }

  /**
   * Wait for element to be hidden
   */
  async waitForHidden(locator: Locator, timeout: number = 5000): Promise<void> {
    await expect(locator).toBeHidden({ timeout });
  }
}
