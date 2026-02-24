import { test, expect } from '../../../helpers/test-fixtures';
import {
  generateInvoice,
  generateBtwResponse,
  generateInvoiceLine,
} from '../../../helpers/data/test-data-generators';

test.describe('Invoice CRUD', () => {
  let clientName: string;

  test.beforeEach(async ({ loginAs, clientPage }) => {
    await loginAs('admin');

    // Create a client for testing
    const btwResponse = generateBtwResponse();
    clientName = btwResponse.name;
    await clientPage.createWithBtwLookup(btwResponse);
  });

  test.describe('Create', () => {
    test('can create an invoice with minimum fields', async ({ invoicePage }) => {
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine({ desc: 'Test service', amount: 10, price: 100 });
      await invoicePage.addLine(line);

      await invoicePage.save();
      await invoicePage.expectSaveSuccess();
    });

    test('can create an invoice with all fields', async ({ invoicePage }) => {
      const invoice = generateInvoice('');

      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.fill(invoice);

      for (const line of invoice.lines) {
        await invoicePage.addLine(line);
      }

      await invoicePage.save();
      await invoicePage.expectSaveSuccess();
    });

    test('can create an invoice with order number', async ({ invoicePage }) => {
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');
      await invoicePage.setOrderNr('ORD-2024-001');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);

      await invoicePage.save();
      await invoicePage.expectSaveSuccess();
    });

    test('can create an invoice with notes', async ({ invoicePage }) => {
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');
      await invoicePage.page.getByTestId('notes').fill('Special payment terms apply');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);

      await invoicePage.save();
      await invoicePage.expectSaveSuccess();
    });
  });

  test.describe('Invoice Lines', () => {
    test('can add multiple invoice lines', async ({ invoicePage }) => {
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line1 = generateInvoiceLine({ desc: 'Service 1' }, 0);
      const line2 = generateInvoiceLine({ desc: 'Service 2' }, 1);
      const line3 = generateInvoiceLine({ desc: 'Service 3' }, 2);

      await invoicePage.addLine(line1);
      await invoicePage.addLine(line2);
      await invoicePage.addLine(line3);

      const count = await invoicePage.getLineCount();
      expect(count).toBe(3);
    });

    test('can edit an invoice line', async ({ invoicePage }) => {
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine({ desc: 'Original description' });
      await invoicePage.addLine(line);

      await invoicePage.editLine(0, { desc: 'Updated description', price: 200 });

      const desc = await invoicePage.getLineDescription(0);
      expect(desc).toBe('Updated description');
    });

    test('can remove an invoice line', async ({ invoicePage }) => {
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line1 = generateInvoiceLine({ desc: 'Line 1' });
      const line2 = generateInvoiceLine({ desc: 'Line 2' });

      await invoicePage.addLine(line1);
      await invoicePage.addLine(line2);

      expect(await invoicePage.getLineCount()).toBe(2);

      await invoicePage.removeLine(0);

      expect(await invoicePage.getLineCount()).toBe(1);
    });

    test('invoice line with daily type', async ({ invoicePage }) => {
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine({ type: 'daily', price: 750 });
      await invoicePage.addLine(line);

      await invoicePage.save();
      await invoicePage.expectSaveSuccess();
    });

    test('invoice line with hourly type', async ({ invoicePage }) => {
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine({ type: 'hourly', price: 100 });
      await invoicePage.addLine(line);

      await invoicePage.save();
      await invoicePage.expectSaveSuccess();
    });

    test('invoice line with fixed type', async ({ invoicePage }) => {
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine({ type: 'fixed', price: 500, amount: 1 });
      await invoicePage.addLine(line);

      await invoicePage.save();
      await invoicePage.expectSaveSuccess();
    });
  });

  test.describe('Edit', () => {
    test.beforeEach(async ({ invoicePage }) => {
      // Create an invoice first
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');
      await invoicePage.setOrderNr('ORD-EDIT-TEST');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);

      await invoicePage.save();
    });

    test('can edit invoice order number', async ({ invoicePage }) => {
      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);

      await invoicePage.setOrderNr('ORD-UPDATED');
      await invoicePage.save();

      await invoicePage.expectFormValues({ orderNr: 'ORD-UPDATED' });
    });

    test('can edit invoice date', async ({ invoicePage }) => {
      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);

      await invoicePage.setDate('2024-02-15');
      await invoicePage.save();

      await invoicePage.expectSaveSuccess();
    });

    test('can edit invoice due date', async ({ invoicePage }) => {
      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);

      await invoicePage.setDueDate('2024-03-15');
      await invoicePage.save();

      await invoicePage.expectSaveSuccess();
    });

    test('can add line to existing invoice', async ({ invoicePage }) => {
      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);

      const initialCount = await invoicePage.getLineCount();
      const newLine = generateInvoiceLine({ desc: 'Additional service' });
      await invoicePage.addLine(newLine);

      expect(await invoicePage.getLineCount()).toBe(initialCount + 1);
    });
  });

  test.describe('Status Workflow', () => {
    test.beforeEach(async ({ invoicePage }) => {
      // Create an invoice first
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);

      await invoicePage.save();
    });

    test('new invoice has new status', async ({ invoicePage }) => {
      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);

      await invoicePage.expectStatus('new');
    });

    test('can validate invoice (new -> validated)', async ({ invoicePage }) => {
      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);

      await invoicePage.validate();
      await invoicePage.expectStatus('validated');
    });

    test('can mark invoice as sent (validated -> sent)', async ({ invoicePage }) => {
      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);

      await invoicePage.validate();
      await invoicePage.markSent();
      await invoicePage.expectStatus('sent');
    });

    test('can mark invoice as paid (sent -> paid)', async ({ invoicePage }) => {
      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);

      await invoicePage.validate();
      await invoicePage.markSent();
      await invoicePage.markPaid();
      await invoicePage.expectStatus('paid');
    });

    test('full status workflow', async ({ invoicePage }) => {
      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);

      await invoicePage.expectStatus('new');
      await invoicePage.validate();
      await invoicePage.expectStatus('validated');
      await invoicePage.markSent();
      await invoicePage.expectStatus('sent');
      await invoicePage.markPaid();
      await invoicePage.expectStatus('paid');
    });
  });

  test.describe('PDF Operations', () => {
    test.beforeEach(async ({ invoicePage }) => {
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);

      await invoicePage.save();
    });

    test('can preview invoice PDF', async ({ invoicePage }) => {
      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);

      await invoicePage.preview();
      await expect(invoicePage.pdfModal).toBeVisible();
    });

    test('can close PDF preview', async ({ invoicePage }) => {
      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);

      await invoicePage.preview();
      await invoicePage.closePreview();

      await expect(invoicePage.pdfModal).not.toBeVisible();
    });

    test('can download invoice PDF', async ({ invoicePage }) => {
      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);

      const download = await invoicePage.downloadPdf();
      expect(download).toBeTruthy();
    });
  });

  test.describe('Clone', () => {
    test.beforeEach(async ({ invoicePage }) => {
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');
      await invoicePage.setOrderNr('ORD-CLONE-TEST');

      const line = generateInvoiceLine({ desc: 'Clone test service' });
      await invoicePage.addLine(line);

      await invoicePage.save();
    });

    test('can clone an invoice', async ({ invoicePage }) => {
      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);

      await invoicePage.clone();

      // Should be on create page with cloned data
      const selectedClient = await invoicePage.getSelectedClient();
      expect(selectedClient).toContain(clientName);
    });

    test('can create credit nota from invoice', async ({ invoicePage }) => {
      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);

      await invoicePage.createCreditNota();

      // Should be on create page with negative amounts
      await invoicePage.expectSaveSuccess();
    });
  });

  test.describe('Delete', () => {
    test('can delete a draft invoice', async ({ invoicePage }) => {
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);

      await invoicePage.save();

      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);

      await invoicePage.delete();
      await invoicePage.confirmDelete();

      await invoicePage.gotoList();
      await invoicePage.expectInvoiceNotInList(clientName);
    });
  });

  test.describe('List', () => {
    test('displays list of invoices', async ({ invoicePage }) => {
      await invoicePage.gotoList();

      const count = await invoicePage.getRowCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('can search invoices', async ({ invoicePage }) => {
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);

      await invoicePage.save();

      await invoicePage.gotoList();
      await invoicePage.search(clientName);

      await invoicePage.expectInvoiceInList(clientName);
    });

    test('can navigate to invoice edit from list', async ({ invoicePage }) => {
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');
      await invoicePage.setOrderNr('ORD-NAV-TEST');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);

      await invoicePage.save();

      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);

      await invoicePage.expectFormValues({ orderNr: 'ORD-NAV-TEST' });
    });
  });

  test.describe('Quotation', () => {
    test('can create a quotation', async ({ invoicePage }) => {
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');
      await invoicePage.toggleQuotation();

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);

      await invoicePage.save();
      await invoicePage.expectSaveSuccess();
    });

    test('can toggle quotation mode', async ({ invoicePage }) => {
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      await invoicePage.toggleQuotation();
      // Toggle again to convert back to invoice
      await invoicePage.toggleQuotation();

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);

      await invoicePage.save();
      await invoicePage.expectSaveSuccess();
    });
  });
});
