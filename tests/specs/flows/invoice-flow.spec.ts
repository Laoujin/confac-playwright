import { test, expect } from '../../../helpers/test-fixtures';
import {
  generateConsultant,
  generateBtwResponse,
  generateProject,
  generateInvoice,
  generateInvoiceLine,
  generatePeppolSuccessResponse,
} from '../../../helpers/data/test-data-generators';

test.describe('Invoice End-to-End Flow', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin');
  });

  test('complete flow: consultant -> client -> project -> invoice', async ({
    consultantPage,
    clientPage,
    projectPage,
    invoicePage,
  }) => {
    // Step 1: Create a consultant
    const consultant = generateConsultant();
    const consultantName = `${consultant.firstName} ${consultant.name}`;

    await consultantPage.gotoCreate();
    await consultantPage.fill(consultant);
    await consultantPage.save();
    await consultantPage.expectSaveSuccess();

    // Step 2: Create a client
    const btwResponse = generateBtwResponse();
    const clientName = btwResponse.name;

    await clientPage.gotoCreate();
    await clientPage.performBtwLookup(btwResponse);
    await clientPage.selectType('Klant');
    await clientPage.save();
    await clientPage.expectSaveSuccess();

    // Step 3: Create a project linking consultant and client
    await projectPage.gotoCreate();
    await projectPage.selectConsultant(consultantName);
    await projectPage.selectClient(clientName);
    await projectPage.setStartDate('2024-01-01');
    await projectPage.setRef('PRJ-E2E-001');

    const projectLine = generateInvoiceLine({
      desc: 'E2E Test Consultancy',
      price: 750,
      amount: 0,
      type: 'daily',
    });
    await projectPage.addInvoiceLine(projectLine);
    await projectPage.save();
    await projectPage.expectSaveSuccess();

    // Step 4: Create an invoice for the client
    await invoicePage.gotoCreate();
    await invoicePage.selectClient(clientName);
    await invoicePage.setDate('2024-01-31');
    await invoicePage.setOrderNr('ORD-E2E-001');

    const invoiceLine = generateInvoiceLine({
      desc: 'January 2024 Consultancy',
      amount: 20,
      price: 750,
    });
    await invoicePage.addLine(invoiceLine);
    await invoicePage.save();
    await invoicePage.expectSaveSuccess();

    // Step 5: Progress invoice through workflow
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

  test('flow with Peppol integration', async ({
    clientPage,
    invoicePage,
    peppolMock,
  }) => {
    // Create a Peppol-enabled client
    const btwResponse = generateBtwResponse();
    const clientName = btwResponse.name;

    await clientPage.gotoCreate();
    await clientPage.performBtwLookup(btwResponse);
    await clientPage.selectType('Klant');
    await clientPage.togglePeppol();
    await clientPage.save();

    // Create an invoice
    await invoicePage.gotoCreate();
    await invoicePage.selectClient(clientName);
    await invoicePage.setDate('2024-01-31');

    const line = generateInvoiceLine({ amount: 10, price: 500 });
    await invoicePage.addLine(line);
    await invoicePage.save();

    // Validate invoice before sending
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

  test('flow: create invoice from project defaults', async ({
    consultantPage,
    clientPage,
    projectPage,
    invoicePage,
  }) => {
    // Create consultant
    const consultant = generateConsultant();
    const consultantName = `${consultant.firstName} ${consultant.name}`;
    await consultantPage.create(consultant);

    // Create client with default invoice lines
    const btwResponse = generateBtwResponse();
    const clientName = btwResponse.name;
    await clientPage.createWithBtwLookup(btwResponse);

    // Create project with specific invoice line configuration
    await projectPage.gotoCreate();
    await projectPage.selectConsultant(consultantName);
    await projectPage.selectClient(clientName);
    await projectPage.setStartDate('2024-01-01');

    const projectLine = generateInvoiceLine({
      desc: 'Project-specific rate',
      price: 800,
      type: 'daily',
    });
    await projectPage.addInvoiceLine(projectLine);
    await projectPage.save();

    // Create invoice - should inherit from project/client defaults
    await invoicePage.gotoCreate();
    await invoicePage.selectClient(clientName);
    await invoicePage.setDate('2024-01-31');

    // Client's default invoice lines should be available
    const line = generateInvoiceLine();
    await invoicePage.addLine(line);
    await invoicePage.save();
    await invoicePage.expectSaveSuccess();
  });

  test('flow: credit nota for existing invoice', async ({
    clientPage,
    invoicePage,
  }) => {
    // Create client
    const btwResponse = generateBtwResponse();
    const clientName = btwResponse.name;
    await clientPage.createWithBtwLookup(btwResponse);

    // Create original invoice
    await invoicePage.gotoCreate();
    await invoicePage.selectClient(clientName);
    await invoicePage.setDate('2024-01-15');
    await invoicePage.setOrderNr('ORD-ORIGINAL');

    const line = generateInvoiceLine({ amount: 10, price: 500 });
    await invoicePage.addLine(line);
    await invoicePage.save();

    // Navigate to invoice and validate
    await invoicePage.gotoList();
    await invoicePage.clickRowWithText(clientName);
    await invoicePage.validate();

    // Create credit nota
    await invoicePage.createCreditNota();
    await invoicePage.expectSaveSuccess();

    // The credit nota should reference the original
    const selectedClient = await invoicePage.getSelectedClient();
    expect(selectedClient).toContain(clientName);
  });

  test('flow: clone and modify invoice', async ({
    clientPage,
    invoicePage,
  }) => {
    // Create client
    const btwResponse = generateBtwResponse();
    const clientName = btwResponse.name;
    await clientPage.createWithBtwLookup(btwResponse);

    // Create original invoice
    await invoicePage.gotoCreate();
    await invoicePage.selectClient(clientName);
    await invoicePage.setDate('2024-01-15');
    await invoicePage.setOrderNr('ORD-TO-CLONE');

    const line = generateInvoiceLine({ desc: 'Original service' });
    await invoicePage.addLine(line);
    await invoicePage.save();

    // Clone the invoice
    await invoicePage.gotoList();
    await invoicePage.clickRowWithText(clientName);
    await invoicePage.clone();

    // Modify the cloned invoice
    await invoicePage.setDate('2024-02-15');
    await invoicePage.setOrderNr('ORD-CLONED');

    // Edit the line description
    await invoicePage.editLine(0, { desc: 'Cloned service' });
    await invoicePage.save();
    await invoicePage.expectSaveSuccess();
  });
});
