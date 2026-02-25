import { test, expect } from '../../../helpers/test-fixtures';
import {
  generateBtwResponse,
  generateInvoiceLine,
  generatePeppolSuccessResponse,
  generatePeppolErrorResponse,
  generatePeppolPendingResponse,
} from '../../../helpers/data/test-data-generators';

test.describe.skip('Peppol Integration', () => {
  // TODO: Fix page objects - save operations timing out
  let clientName: string;

  test.beforeEach(async ({ loginAs, clientPage }) => {
    await loginAs('admin');

    // Create a Peppol-enabled client
    const btwResponse = generateBtwResponse();
    clientName = btwResponse.name;

    await clientPage.gotoCreate();
    await clientPage.performBtwLookup(btwResponse);
    await clientPage.selectType('Klant');
    await clientPage.togglePeppol();
    await clientPage.save();
  });

  test.describe('Send to Peppol', () => {
    test('can send validated invoice to Peppol - success', async ({
      invoicePage,
      peppolMock,
    }) => {
      // Create and validate invoice
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);
      await invoicePage.save();

      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);
      await invoicePage.validate();

      // Prime Peppol mock for success
      const peppolResponse = generatePeppolSuccessResponse();
      await peppolMock.prime({
        endpoint: '/v1/orders',
        method: 'POST',
        response: peppolResponse,
        status: 200,
      });

      // Send to Peppol
      await invoicePage.sendToPeppol();

      // Verify the call was made
      await peppolMock.assertCalled('/v1/orders', { times: 1 });
    });

    test('handles Peppol error response', async ({
      invoicePage,
      peppolMock,
    }) => {
      // Create and validate invoice
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);
      await invoicePage.save();

      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);
      await invoicePage.validate();

      // Prime Peppol mock for error
      const errorResponse = generatePeppolErrorResponse('Invalid VAT number');
      await peppolMock.prime({
        endpoint: '/v1/orders',
        method: 'POST',
        response: errorResponse,
        status: 400,
      });

      // Send to Peppol
      await invoicePage.sendToPeppol();

      // Should show error toast
      await invoicePage.expectToast(/error|Invalid/i);
    });

    test('handles Peppol timeout', async ({
      invoicePage,
      peppolMock,
    }) => {
      // Create and validate invoice
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);
      await invoicePage.save();

      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);
      await invoicePage.validate();

      // Prime Peppol mock with delay (simulates timeout)
      await peppolMock.prime({
        endpoint: '/v1/orders',
        method: 'POST',
        response: { error: 'Timeout' },
        status: 504,
        delay: 30000, // 30 second delay
      });

      // Send to Peppol - this should timeout
      await invoicePage.sendToPeppol();

      // Should handle timeout gracefully
      await peppolMock.assertCalled('/v1/orders', { times: 1 });
    });

    test('cannot send non-validated invoice to Peppol', async ({
      invoicePage,
    }) => {
      // Create invoice but don't validate
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);
      await invoicePage.save();

      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);

      // Peppol button should be disabled for non-validated invoices
      await expect(invoicePage.sendPeppolButton).toBeDisabled();
    });
  });

  test.describe('Peppol Status', () => {
    test('can view Peppol status for sent invoice', async ({
      invoicePage,
      peppolMock,
    }) => {
      // Create, validate, and send invoice
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);
      await invoicePage.save();

      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);
      await invoicePage.validate();

      // Prime Peppol mock
      const peppolResponse = generatePeppolSuccessResponse();
      await peppolMock.prime({
        endpoint: '/v1/orders',
        method: 'POST',
        response: peppolResponse,
        status: 200,
      });

      await invoicePage.sendToPeppol();

      // Prime status endpoint
      await peppolMock.prime({
        endpoint: `/v1/orders/${peppolResponse.id}`,
        method: 'GET',
        response: { ...peppolResponse, status: 'accepted' },
        status: 200,
      });

      // View Peppol status
      await invoicePage.openPeppolStatus();
      await expect(invoicePage.peppolModal).toBeVisible();
    });

    test('shows pending status', async ({
      invoicePage,
      peppolMock,
    }) => {
      // Create, validate, and send invoice
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);
      await invoicePage.save();

      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);
      await invoicePage.validate();

      // Prime Peppol mock with pending response
      const pendingResponse = generatePeppolPendingResponse();
      await peppolMock.prime({
        endpoint: '/v1/orders',
        method: 'POST',
        response: pendingResponse,
        status: 202,
      });

      await invoicePage.sendToPeppol();

      // Prime status endpoint to return pending
      await peppolMock.prime({
        endpoint: `/v1/orders/${pendingResponse.id}`,
        method: 'GET',
        response: pendingResponse,
        status: 200,
      });

      // Check status shows pending
      await invoicePage.openPeppolStatus();
      await expect(invoicePage.peppolModal).toContainText(/pending|verwerken/i);
    });

    test('can refresh Peppol status', async ({
      invoicePage,
      peppolMock,
    }) => {
      // Create, validate, and send invoice
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line = generateInvoiceLine();
      await invoicePage.addLine(line);
      await invoicePage.save();

      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);
      await invoicePage.validate();

      // Initial send with pending status
      const pendingResponse = generatePeppolPendingResponse();
      await peppolMock.prime({
        endpoint: '/v1/orders',
        method: 'POST',
        response: pendingResponse,
        status: 202,
      });

      await invoicePage.sendToPeppol();

      // Prime status endpoint - first pending, then accepted
      await peppolMock.prime({
        endpoint: `/v1/orders/${pendingResponse.id}`,
        method: 'GET',
        response: { ...pendingResponse, status: 'accepted' },
        status: 200,
      });

      // Open and refresh status
      await invoicePage.openPeppolStatus();

      const refreshButton = invoicePage.peppolModal.getByTestId('refresh-status');
      await refreshButton.click();

      // Should show updated status
      await expect(invoicePage.peppolModal).toContainText(/accepted|geaccepteerd/i);
    });
  });

  test.describe('Mock Verification', () => {
    test('verifies correct payload sent to Peppol', async ({
      invoicePage,
      peppolMock,
    }) => {
      // Create and validate invoice with specific data
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');
      await invoicePage.setOrderNr('ORD-PEPPOL-001');

      const line = generateInvoiceLine({ desc: 'Consultancy', amount: 10, price: 500 });
      await invoicePage.addLine(line);
      await invoicePage.save();

      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);
      await invoicePage.validate();

      // Prime Peppol mock
      const peppolResponse = generatePeppolSuccessResponse();
      await peppolMock.prime({
        endpoint: '/v1/orders',
        method: 'POST',
        response: peppolResponse,
        status: 200,
      });

      await invoicePage.sendToPeppol();

      // Get recorded calls and verify payload
      const calls = await peppolMock.getCallsFor('/v1/orders');
      expect(calls.length).toBe(1);
      expect(calls[0].method).toBe('POST');
      // The payload should contain invoice data
      expect(calls[0].body).toBeTruthy();
    });

    test('multiple sends create multiple calls', async ({
      invoicePage,
      peppolMock,
      clientPage,
    }) => {
      // Create first invoice
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(clientName);
      await invoicePage.setDate('2024-01-15');

      const line1 = generateInvoiceLine();
      await invoicePage.addLine(line1);
      await invoicePage.save();

      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(clientName);
      await invoicePage.validate();

      // Prime Peppol mock
      await peppolMock.prime({
        endpoint: '/v1/orders',
        method: 'POST',
        response: generatePeppolSuccessResponse(),
        status: 200,
      });

      await invoicePage.sendToPeppol();

      // Create second Peppol client
      const btwResponse2 = generateBtwResponse();
      await clientPage.gotoCreate();
      await clientPage.performBtwLookup(btwResponse2);
      await clientPage.togglePeppol();
      await clientPage.save();

      // Create second invoice
      await invoicePage.gotoCreate();
      await invoicePage.selectClient(btwResponse2.name);
      await invoicePage.setDate('2024-01-16');

      const line2 = generateInvoiceLine();
      await invoicePage.addLine(line2);
      await invoicePage.save();

      await invoicePage.gotoList();
      await invoicePage.clickRowWithText(btwResponse2.name);
      await invoicePage.validate();

      await peppolMock.prime({
        endpoint: '/v1/orders',
        method: 'POST',
        response: generatePeppolSuccessResponse(),
        status: 200,
      });

      await invoicePage.sendToPeppol();

      // Verify both calls were made
      await peppolMock.assertCalled('/v1/orders', { times: 2 });
    });
  });
});
