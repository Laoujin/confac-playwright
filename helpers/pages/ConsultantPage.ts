import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Dropdown } from '../Dropdown';
import { ConsultantData, ConsultantType } from '../data/test-data-generators';

/**
 * Page Object Model for Consultant CRUD operations
 */
export class ConsultantPage extends BasePage {
  // Form fields
  readonly firstNameInput: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly telephoneInput: Locator;
  readonly accountingCodeInput: Locator;

  // Dropdowns
  readonly typeDropdown: Dropdown;

  // List view elements
  readonly activeFilter: Locator;
  readonly inactiveFilter: Locator;
  readonly allFilter: Locator;

  constructor(page: Page) {
    super(page, '.tst-save-consultant');

    // Form fields using test IDs and placeholders
    this.firstNameInput = page.getByTestId('firstName');
    this.nameInput = page.getByTestId('name');
    this.emailInput = page.locator('input:below(:text("E-mail"))').first();
    this.telephoneInput = page.locator('_react=PhoneInput').getByRole('textbox');
    this.accountingCodeInput = page.locator('_react=Col[key = "accountingCode"]').getByRole('textbox');

    // Type dropdown
    this.typeDropdown = new Dropdown(page, 'type');

    // Filter buttons
    this.activeFilter = page.getByRole('button', { name: /actief/i });
    this.inactiveFilter = page.getByRole('button', { name: /inactief/i });
    this.allFilter = page.getByRole('button', { name: /alle/i });
  }

  getListUrl(): string {
    return '/consultants';
  }

  getCreateUrl(): string {
    return '/consultants/create';
  }

  getEditUrl(id: string): string {
    return `/consultants/${id}`;
  }

  getPageTitlePattern(): RegExp {
    return /Consultants/;
  }

  /**
   * Fill consultant form with data
   */
  async fill(data: Partial<ConsultantData>): Promise<void> {
    if (data.firstName) {
      await this.firstNameInput.fill(data.firstName);
    }
    if (data.name) {
      await this.nameInput.fill(data.name);
    }
    if (data.email) {
      await this.emailInput.fill(data.email);
    }
    if (data.telephone) {
      await this.telephoneInput.fill(data.telephone);
    }
    if (data.accountingCode) {
      await this.accountingCodeInput.fill(data.accountingCode);
    }
    if (data.type) {
      await this.selectType(data.type);
    }
  }

  /**
   * Create a new consultant
   */
  async create(data: ConsultantData): Promise<void> {
    await this.gotoCreate();
    await this.fill(data);
    await this.save();
  }

  /**
   * Edit an existing consultant
   */
  async edit(id: string, data: Partial<ConsultantData>): Promise<void> {
    await this.gotoEdit(id);
    await this.fill(data);
    await this.save();
  }

  /**
   * Select consultant type from dropdown
   */
  async selectType(type: ConsultantType): Promise<void> {
    const typeLabels: Record<ConsultantType, string> = {
      consultant: 'Externe consultant',
      freelancer: 'Freelancer',
      manager: 'Manager',
      expiree: 'Expiree',
    };
    await this.typeDropdown.selectOption(typeLabels[type]);
  }

  /**
   * Get the selected type from dropdown
   */
  async getSelectedType(): Promise<string> {
    return await this.typeDropdown.value.textContent() ?? '';
  }

  /**
   * Filter consultants by type
   */
  async filterByType(type: ConsultantType): Promise<void> {
    const typeLabels: Record<ConsultantType, string> = {
      consultant: 'Externe consultant',
      freelancer: 'Freelancer',
      manager: 'Manager',
      expiree: 'Expiree',
    };
    // Click on the type filter button if available
    await this.page.getByRole('button', { name: typeLabels[type] }).click();
  }

  /**
   * Filter to show only active consultants
   */
  async filterActive(): Promise<void> {
    await this.activeFilter.click();
  }

  /**
   * Filter to show only inactive consultants
   */
  async filterInactive(): Promise<void> {
    await this.inactiveFilter.click();
  }

  /**
   * Show all consultants
   */
  async filterAll(): Promise<void> {
    await this.allFilter.click();
  }

  /**
   * Toggle active status of a consultant in list
   */
  async toggleActive(id: string): Promise<void> {
    await this.gotoEdit(id);
    const activeToggle = this.page.getByTestId('active');
    await activeToggle.click();
    await this.save();
  }

  /**
   * Get consultant row from list by name
   */
  getConsultantRow(name: string): Locator {
    return this.getTableRows().filter({ hasText: name });
  }

  /**
   * Click edit button on a consultant row
   */
  async clickEditOnRow(name: string): Promise<void> {
    await this.getConsultantRow(name).click();
  }

  /**
   * Expect consultant to be in list
   */
  async expectConsultantInList(name: string): Promise<void> {
    await expect(this.getConsultantRow(name)).toBeVisible();
  }

  /**
   * Expect consultant to not be in list
   */
  async expectConsultantNotInList(name: string): Promise<void> {
    await expect(this.getConsultantRow(name)).not.toBeVisible();
  }

  /**
   * Expect form to have specific values
   */
  async expectFormValues(data: Partial<ConsultantData>): Promise<void> {
    if (data.firstName) {
      await expect(this.firstNameInput).toHaveValue(data.firstName);
    }
    if (data.name) {
      await expect(this.nameInput).toHaveValue(data.name);
    }
    if (data.email) {
      await expect(this.emailInput).toHaveValue(data.email);
    }
  }

  /**
   * Get all consultant names from list
   */
  async getAllConsultantNames(): Promise<string[]> {
    const rows = this.getTableRows();
    const count = await rows.count();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const name = await rows.nth(i).locator('td').first().textContent();
      if (name) {
        names.push(name.trim());
      }
    }

    return names;
  }

  /**
   * Count consultants in list
   */
  async getConsultantCount(): Promise<number> {
    return await this.getTableRows().count();
  }
}
