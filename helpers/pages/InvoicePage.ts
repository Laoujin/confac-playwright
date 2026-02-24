import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Dropdown } from '../Dropdown';
import { InvoiceData, InvoiceLine, InvoiceStatus } from '../data/test-data-generators';

/**
 * Page Object Model for Invoice CRUD operations
 */
export class InvoicePage extends BasePage {
  // Main fields
  readonly clientDropdown: Dropdown;
  readonly invoiceNumberInput: Locator;
  readonly dateInput: Locator;
  readonly dueDateInput: Locator;
  readonly orderNrInput: Locator;
  readonly notesInput: Locator;

  // Invoice lines
  readonly addLineButton: Locator;
  readonly invoiceLinesContainer: Locator;

  // Status workflow buttons
  readonly validateButton: Locator;
  readonly markSentButton: Locator;
  readonly markPaidButton: Locator;
  readonly statusBadge: Locator;

  // PDF actions
  readonly previewButton: Locator;
  readonly downloadPdfButton: Locator;
  readonly pdfModal: Locator;

  // Peppol
  readonly sendPeppolButton: Locator;
  readonly peppolStatusButton: Locator;
  readonly peppolModal: Locator;

  // Clone/Credit nota
  readonly cloneButton: Locator;
  readonly createCreditNotaButton: Locator;

  // Email
  readonly sendEmailButton: Locator;
  readonly emailModal: Locator;

  // Attachments
  readonly attachmentsSection: Locator;
  readonly uploadAttachmentButton: Locator;

  // Quotation toggle
  readonly isQuotationToggle: Locator;

  constructor(page: Page) {
    super(page, '.tst-save-invoice');

    // Main fields
    this.clientDropdown = new Dropdown(page, 'client');
    this.invoiceNumberInput = page.getByTestId('number');
    this.dateInput = page.getByTestId('date');
    this.dueDateInput = page.getByTestId('dueDate');
    this.orderNrInput = page.getByTestId('orderNr');
    this.notesInput = page.getByTestId('notes');

    // Invoice lines
    this.addLineButton = page.getByTestId('add-invoice-line');
    this.invoiceLinesContainer = page.locator('.invoice-lines');

    // Status buttons
    this.validateButton = page.getByTestId('validate-invoice');
    this.markSentButton = page.getByTestId('mark-sent');
    this.markPaidButton = page.getByTestId('mark-paid');
    this.statusBadge = page.locator('.invoice-status-badge');

    // PDF
    this.previewButton = page.getByTestId('preview-invoice');
    this.downloadPdfButton = page.getByTestId('download-pdf');
    this.pdfModal = page.locator('.pdf-preview-modal');

    // Peppol
    this.sendPeppolButton = page.getByTestId('tst-send-peppol');
    this.peppolStatusButton = page.getByTestId('tst-peppol-status');
    this.peppolModal = page.locator('.peppol-modal');

    // Clone
    this.cloneButton = page.getByTestId('clone-invoice');
    this.createCreditNotaButton = page.getByTestId('create-credit-nota');

    // Email
    this.sendEmailButton = page.getByTestId('send-email');
    this.emailModal = page.locator('.email-modal');

    // Attachments
    this.attachmentsSection = page.locator('.invoice-attachments');
    this.uploadAttachmentButton = page.getByTestId('upload-attachment');

    // Quotation
    this.isQuotationToggle = page.getByTestId('isQuotation');
  }

  getListUrl(): string {
    return '/invoices';
  }

  getCreateUrl(): string {
    return '/invoices/create';
  }

  getEditUrl(id: string): string {
    return `/invoices/${id}`;
  }

  getPageTitlePattern(): RegExp {
    return /Facturen/;
  }

  /**
   * Select client from dropdown
   */
  async selectClient(name: string): Promise<void> {
    await this.clientDropdown.selectOption(name);
  }

  /**
   * Set invoice date
   */
  async setDate(date: string): Promise<void> {
    await this.dateInput.fill(date);
  }

  /**
   * Set due date
   */
  async setDueDate(date: string): Promise<void> {
    await this.dueDateInput.fill(date);
  }

  /**
   * Set order number
   */
  async setOrderNr(orderNr: string): Promise<void> {
    await this.orderNrInput.fill(orderNr);
  }

  /**
   * Fill invoice form with data
   */
  async fill(data: Partial<InvoiceData>, clientName?: string): Promise<void> {
    if (clientName) {
      await this.selectClient(clientName);
    }
    if (data.date) {
      await this.setDate(data.date);
    }
    if (data.dueDate) {
      await this.setDueDate(data.dueDate);
    }
    if (data.orderNr) {
      await this.setOrderNr(data.orderNr);
    }
    if (data.notes) {
      await this.notesInput.fill(data.notes);
    }
    if (data.isQuotation) {
      await this.isQuotationToggle.click();
    }
  }

  /**
   * Create a new invoice
   */
  async create(data: InvoiceData, clientName: string): Promise<void> {
    await this.gotoCreate();
    await this.fill(data, clientName);

    // Add lines
    for (const line of data.lines) {
      await this.addLine(line);
    }

    await this.save();
  }

  /**
   * Edit an existing invoice
   */
  async edit(invoiceNumber: string, data: Partial<InvoiceData>): Promise<void> {
    await this.gotoEdit(invoiceNumber);
    await this.fill(data);
    await this.save();
  }

  /**
   * Delete an invoice
   */
  async deleteInvoice(invoiceNumber: string): Promise<void> {
    await this.gotoEdit(invoiceNumber);
    await this.delete();
    await this.confirmDelete();
  }

  /**
   * Add an invoice line
   */
  async addLine(line: InvoiceLine): Promise<void> {
    await this.addLineButton.click();

    // Get the last added line row
    const lineRows = this.invoiceLinesContainer.locator('.invoice-line-row');
    const lastRow = lineRows.last();

    // Fill line fields
    await lastRow.getByTestId('desc').fill(line.desc);
    await lastRow.getByTestId('amount').fill(line.amount.toString());
    await lastRow.getByTestId('price').fill(line.price.toString());
    await lastRow.getByTestId('tax').fill(line.tax.toString());

    // Select type if not daily
    if (line.type !== 'daily') {
      const typeSelect = lastRow.locator('select[name="type"]');
      await typeSelect.selectOption(line.type);
    }
  }

  /**
   * Edit an invoice line by index
   */
  async editLine(index: number, line: Partial<InvoiceLine>): Promise<void> {
    const lineRows = this.invoiceLinesContainer.locator('.invoice-line-row');
    const row = lineRows.nth(index);

    if (line.desc !== undefined) {
      await row.getByTestId('desc').fill(line.desc);
    }
    if (line.amount !== undefined) {
      await row.getByTestId('amount').fill(line.amount.toString());
    }
    if (line.price !== undefined) {
      await row.getByTestId('price').fill(line.price.toString());
    }
    if (line.tax !== undefined) {
      await row.getByTestId('tax').fill(line.tax.toString());
    }
  }

  /**
   * Remove an invoice line by index
   */
  async removeLine(index: number): Promise<void> {
    const lineRows = this.invoiceLinesContainer.locator('.invoice-line-row');
    const row = lineRows.nth(index);
    await row.getByTestId('remove-line').click();
  }

  /**
   * Reorder invoice lines via drag and drop
   */
  async reorderLines(fromIndex: number, toIndex: number): Promise<void> {
    const lineRows = this.invoiceLinesContainer.locator('.invoice-line-row');
    const sourceRow = lineRows.nth(fromIndex).locator('.drag-handle');
    const targetRow = lineRows.nth(toIndex).locator('.drag-handle');

    await sourceRow.dragTo(targetRow);
  }

  /**
   * Get invoice line count
   */
  async getLineCount(): Promise<number> {
    return await this.invoiceLinesContainer.locator('.invoice-line-row').count();
  }

  /**
   * Preview invoice PDF
   */
  async preview(): Promise<void> {
    await this.previewButton.click();
    await expect(this.pdfModal).toBeVisible();
  }

  /**
   * Close PDF preview
   */
  async closePreview(): Promise<void> {
    await this.pdfModal.getByTestId('close').click();
  }

  /**
   * Download PDF
   */
  async downloadPdf(): Promise<void> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.downloadPdfButton.click(),
    ]);
    return download;
  }

  /**
   * Send invoice to Peppol
   */
  async sendToPeppol(): Promise<void> {
    await this.sendPeppolButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Open Peppol status modal
   */
  async openPeppolStatus(): Promise<void> {
    await this.peppolStatusButton.click();
    await expect(this.peppolModal).toBeVisible();
  }

  /**
   * Close Peppol modal
   */
  async closePeppolModal(): Promise<void> {
    await this.peppolModal.getByTestId('close').click();
  }

  /**
   * Validate invoice (Draft -> ToSend)
   */
  async validate(): Promise<void> {
    await this.validateButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Mark invoice as sent (ToSend -> ToPay)
   */
  async markSent(): Promise<void> {
    await this.markSentButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Mark invoice as paid (ToPay -> Paid)
   */
  async markPaid(): Promise<void> {
    await this.markPaidButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get current invoice status
   */
  async getStatus(): Promise<string> {
    return await this.statusBadge.textContent() ?? '';
  }

  /**
   * Expect specific invoice status
   */
  async expectStatus(status: InvoiceStatus): Promise<void> {
    const statusLabels: Record<InvoiceStatus, string> = {
      'new': 'Nieuw',
      'validated': 'Gevalideerd',
      'sent': 'Verzonden',
      'paid': 'Betaald',
    };
    await expect(this.statusBadge).toContainText(statusLabels[status]);
  }

  /**
   * Clone invoice
   */
  async clone(): Promise<void> {
    await this.cloneButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Create credit nota from invoice
   */
  async createCreditNota(): Promise<void> {
    await this.createCreditNotaButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Send invoice via email
   */
  async sendEmail(): Promise<void> {
    await this.sendEmailButton.click();
    await expect(this.emailModal).toBeVisible();
  }

  /**
   * Confirm sending email
   */
  async confirmSendEmail(): Promise<void> {
    await this.emailModal.getByTestId('confirm-send').click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Upload attachment
   */
  async uploadAttachment(filePath: string): Promise<void> {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get attachment count
   */
  async getAttachmentCount(): Promise<number> {
    return await this.attachmentsSection.locator('.attachment-item').count();
  }

  /**
   * Toggle quotation mode
   */
  async toggleQuotation(): Promise<void> {
    await this.isQuotationToggle.click();
  }

  /**
   * Get invoice row from list by number
   */
  getInvoiceRow(number: string | number): Locator {
    return this.getTableRows().filter({ hasText: number.toString() });
  }

  /**
   * Expect invoice to be in list
   */
  async expectInvoiceInList(number: string | number): Promise<void> {
    await expect(this.getInvoiceRow(number)).toBeVisible();
  }

  /**
   * Expect invoice to not be in list
   */
  async expectInvoiceNotInList(number: string | number): Promise<void> {
    await expect(this.getInvoiceRow(number)).not.toBeVisible();
  }

  /**
   * Get invoice total from form
   */
  async getInvoiceTotal(): Promise<string> {
    const totalElement = this.page.locator('.invoice-total');
    return await totalElement.textContent() ?? '';
  }

  /**
   * Get line description at index
   */
  async getLineDescription(index: number): Promise<string> {
    const lineRows = this.invoiceLinesContainer.locator('.invoice-line-row');
    const row = lineRows.nth(index);
    return await row.getByTestId('desc').inputValue();
  }

  /**
   * Expect form values
   */
  async expectFormValues(data: Partial<InvoiceData>): Promise<void> {
    if (data.date) {
      await expect(this.dateInput).toHaveValue(data.date);
    }
    if (data.orderNr) {
      await expect(this.orderNrInput).toHaveValue(data.orderNr);
    }
  }

  /**
   * Get selected client name
   */
  async getSelectedClient(): Promise<string> {
    return await this.clientDropdown.value.textContent() ?? '';
  }

  /**
   * Filter invoices by status
   */
  async filterByStatus(status: InvoiceStatus): Promise<void> {
    const statusLabels: Record<InvoiceStatus, string> = {
      'new': 'Nieuw',
      'validated': 'Gevalideerd',
      'sent': 'Verzonden',
      'paid': 'Betaald',
    };
    await this.page.getByRole('button', { name: statusLabels[status] }).click();
  }

  /**
   * Filter invoices by year
   */
  async filterByYear(year: number): Promise<void> {
    await this.page.getByRole('button', { name: year.toString() }).click();
  }
}
