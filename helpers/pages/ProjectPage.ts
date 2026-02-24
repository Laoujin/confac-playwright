import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Dropdown } from '../Dropdown';
import { ProjectData, InvoiceLine } from '../data/test-data-generators';

/**
 * Page Object Model for Project CRUD operations
 */
export class ProjectPage extends BasePage {
  // Main dropdowns
  readonly consultantDropdown: Dropdown;
  readonly clientDropdown: Dropdown;

  // Date fields
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;

  // Project config
  readonly refInput: Locator;
  readonly timesheetCheckToggle: Locator;
  readonly changingOrderNrToggle: Locator;
  readonly inboundInvoiceToggle: Locator;

  // Contract status
  readonly contractStatusDropdown: Dropdown;
  readonly contractNotesInput: Locator;

  // Invoice lines section
  readonly addLineButton: Locator;
  readonly invoiceLinesContainer: Locator;

  // Delete confirmation
  readonly confirmDeleteProjectButton: Locator;
  readonly deleteRestrictionMessage: Locator;

  // Copy project
  readonly copyButton: Locator;

  constructor(page: Page) {
    super(page, '.tst-save-project');

    // Dropdowns
    this.consultantDropdown = new Dropdown(page, 'consultant');
    this.clientDropdown = new Dropdown(page, 'client');

    // Date fields
    this.startDateInput = page.getByTestId('startDate');
    this.endDateInput = page.getByTestId('endDate');

    // Project config
    this.refInput = page.getByTestId('client.ref');
    this.timesheetCheckToggle = page.getByTestId('projectMonthConfig.timesheetCheck');
    this.changingOrderNrToggle = page.getByTestId('projectMonthConfig.changingOrderNr');
    this.inboundInvoiceToggle = page.getByTestId('projectMonthConfig.inboundInvoice');

    // Contract
    this.contractStatusDropdown = new Dropdown(page, 'contract.status');
    this.contractNotesInput = page.getByTestId('contract.notes');

    // Invoice lines
    this.addLineButton = page.getByTestId('add-invoice-line');
    this.invoiceLinesContainer = page.locator('.invoice-lines');

    // Delete confirmation
    this.confirmDeleteProjectButton = page.getByTestId('confirm-delete-project');
    this.deleteRestrictionMessage = page.locator('.delete-restriction-message');

    // Copy
    this.copyButton = page.getByTestId('copy-project');
  }

  getListUrl(): string {
    return '/projects';
  }

  getCreateUrl(): string {
    return '/projects/create';
  }

  getEditUrl(id: string): string {
    return `/projects/${id}`;
  }

  getPageTitlePattern(): RegExp {
    return /Projecten/;
  }

  /**
   * Select consultant from dropdown
   */
  async selectConsultant(name: string): Promise<void> {
    await this.consultantDropdown.selectOption(name);
  }

  /**
   * Select client from dropdown
   */
  async selectClient(name: string): Promise<void> {
    await this.clientDropdown.selectOption(name);
  }

  /**
   * Set start date
   */
  async setStartDate(date: string): Promise<void> {
    await this.startDateInput.fill(date);
  }

  /**
   * Set end date
   */
  async setEndDate(date: string): Promise<void> {
    await this.endDateInput.fill(date);
  }

  /**
   * Set reference
   */
  async setRef(ref: string): Promise<void> {
    await this.refInput.fill(ref);
  }

  /**
   * Fill project form with data
   */
  async fill(data: Partial<ProjectData>, consultantName?: string, clientName?: string): Promise<void> {
    if (consultantName) {
      await this.selectConsultant(consultantName);
    }
    if (clientName) {
      await this.selectClient(clientName);
    }
    if (data.startDate) {
      await this.setStartDate(data.startDate);
    }
    if (data.endDate) {
      await this.setEndDate(data.endDate);
    }
    if (data.ref) {
      await this.setRef(data.ref);
    }
    if (data.invoiceLines) {
      for (const line of data.invoiceLines) {
        await this.addInvoiceLine(line);
      }
    }
  }

  /**
   * Create a new project
   */
  async create(data: ProjectData, consultantName: string, clientName: string): Promise<void> {
    await this.gotoCreate();
    await this.fill(data, consultantName, clientName);
    await this.save();
  }

  /**
   * Edit an existing project
   */
  async edit(id: string, data: Partial<ProjectData>): Promise<void> {
    await this.gotoEdit(id);
    await this.fill(data);
    await this.save();
  }

  /**
   * Delete a project (with confirmation)
   */
  async deleteProject(id: string): Promise<void> {
    await this.gotoEdit(id);
    await this.delete();
    await this.confirmDeleteProjectButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Add an invoice line
   */
  async addInvoiceLine(line: InvoiceLine): Promise<void> {
    await this.addLineButton.click();

    // Get the last added line row
    const lineRows = this.invoiceLinesContainer.locator('.invoice-line-row');
    const lastRow = lineRows.last();

    // Fill line fields
    await lastRow.getByTestId('desc').fill(line.desc);
    await lastRow.getByTestId('amount').fill(line.amount.toString());
    await lastRow.getByTestId('price').fill(line.price.toString());
    await lastRow.getByTestId('tax').fill(line.tax.toString());

    // Select type
    if (line.type !== 'daily') {
      const typeDropdown = new Dropdown(this.page, 'type');
      const typeLabels: Record<string, string> = {
        'daily': 'Dagelijks',
        'hourly': 'Per uur',
        'fixed': 'Vast',
        'section': 'Sectie',
      };
      await typeDropdown.selectOption(typeLabels[line.type]);
    }
  }

  /**
   * Remove an invoice line by index
   */
  async removeInvoiceLine(index: number): Promise<void> {
    const lineRows = this.invoiceLinesContainer.locator('.invoice-line-row');
    const row = lineRows.nth(index);
    await row.getByTestId('remove-line').click();
  }

  /**
   * Get invoice line count
   */
  async getInvoiceLineCount(): Promise<number> {
    return await this.invoiceLinesContainer.locator('.invoice-line-row').count();
  }

  /**
   * Copy project to create a new one
   */
  async copyProject(): Promise<void> {
    await this.copyButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Toggle timesheet check
   */
  async toggleTimesheetCheck(): Promise<void> {
    await this.timesheetCheckToggle.click();
  }

  /**
   * Toggle changing order number
   */
  async toggleChangingOrderNr(): Promise<void> {
    await this.changingOrderNrToggle.click();
  }

  /**
   * Toggle inbound invoice
   */
  async toggleInboundInvoice(): Promise<void> {
    await this.inboundInvoiceToggle.click();
  }

  /**
   * Set contract status
   */
  async setContractStatus(status: string): Promise<void> {
    const statusLabels: Record<string, string> = {
      'NoContract': 'Geen contract',
      'ToBeSigned': 'Te ondertekenen',
      'ClientSigned': 'Klant getekend',
      'BothSigned': 'Beide getekend',
    };
    await this.contractStatusDropdown.selectOption(statusLabels[status] ?? status);
  }

  /**
   * Get project row from list by consultant name
   */
  getProjectRow(consultantName: string): Locator {
    return this.getTableRows().filter({ hasText: consultantName });
  }

  /**
   * Expect project to be in list
   */
  async expectProjectInList(consultantName: string): Promise<void> {
    await expect(this.getProjectRow(consultantName)).toBeVisible();
  }

  /**
   * Expect project to not be in list
   */
  async expectProjectNotInList(consultantName: string): Promise<void> {
    await expect(this.getProjectRow(consultantName)).not.toBeVisible();
  }

  /**
   * Expect delete to be restricted (when project has project months)
   */
  async expectDeleteRestricted(): Promise<void> {
    await this.delete();
    await expect(this.deleteRestrictionMessage).toBeVisible();
  }

  /**
   * Expect form values
   */
  async expectFormValues(data: Partial<ProjectData>): Promise<void> {
    if (data.startDate) {
      await expect(this.startDateInput).toHaveValue(data.startDate);
    }
    if (data.ref) {
      await expect(this.refInput).toHaveValue(data.ref);
    }
  }

  /**
   * Get selected consultant name
   */
  async getSelectedConsultant(): Promise<string> {
    return await this.consultantDropdown.value.textContent() ?? '';
  }

  /**
   * Get selected client name
   */
  async getSelectedClient(): Promise<string> {
    return await this.clientDropdown.value.textContent() ?? '';
  }
}
