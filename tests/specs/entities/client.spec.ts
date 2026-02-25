import { test, expect } from '../../../helpers/test-fixtures';
import {
  generateClient,
  generateBtwResponse,
  generateInvalidBtwResponse,
  ClientData,
} from '../../../helpers/data/test-data-generators';

test.describe.skip('Client CRUD', () => {
  // TODO: Fix page objects - save operations timing out
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin');
  });

  test.describe('BTW Lookup', () => {
    test('can create client with valid BTW lookup', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();

      await clientPage.createWithBtwLookup(btwResponse);
      await clientPage.expectSaveSuccess();
    });

    test('BTW lookup fills in company details automatically', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();

      await clientPage.gotoCreate();
      await clientPage.performBtwLookup(btwResponse);

      await clientPage.expectBtwLookupValues(btwResponse);
    });

    test('can create client with "BTW in aanvraag"', async ({ clientPage }) => {
      const data = generateClient();

      await clientPage.gotoCreate();
      await clientPage.clickBtwRequested();

      await clientPage.expectBtwValue('btw in aanvraag');
    });

    test('shows error for invalid BTW number', async ({ clientPage }) => {
      const invalidResponse = generateInvalidBtwResponse();

      await clientPage.gotoCreate();
      await clientPage.mockBtwLookup(invalidResponse);
      await clientPage.enterBtw('0000000000');
      await clientPage.waitForBtwLookup();

      // Should show validation error
      const errorMessage = clientPage.page.locator('.btw-error');
      await expect(errorMessage).toBeVisible();
    });

    test('can edit client after BTW lookup', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();
      const additionalData = { contact: 'John Contact', contactEmail: 'john@test.com' };

      await clientPage.createWithBtwLookup(btwResponse, additionalData);
      await clientPage.expectSaveSuccess();
    });
  });

  test.describe('Create', () => {
    test('can create client with minimum required fields', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();

      await clientPage.gotoCreate();
      await clientPage.performBtwLookup(btwResponse);
      await clientPage.save();

      await clientPage.expectSaveSuccess();
    });

    test('can create client with all fields', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();
      const data = generateClient();

      await clientPage.gotoCreate();
      await clientPage.performBtwLookup(btwResponse);
      await clientPage.fill({
        contact: data.contact,
        contactEmail: data.contactEmail,
        telephone: data.telephone,
      });
      await clientPage.save();

      await clientPage.expectSaveSuccess();
    });

    test('can create client with BTW requested', async ({ clientPage }) => {
      const data = generateClient();

      await clientPage.createWithBtwRequested(data);
      await clientPage.expectSaveSuccess();
    });
  });

  test.describe('Multi-select Client Types', () => {
    test('can select single client type', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();

      await clientPage.gotoCreate();
      await clientPage.performBtwLookup(btwResponse);
      await clientPage.selectType('Klant');

      const types = await clientPage.getSelectedTypes();
      expect(types).toContain('Klant');
    });

    test('can select multiple client types', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();

      await clientPage.gotoCreate();
      await clientPage.performBtwLookup(btwResponse);
      await clientPage.selectType('Klant');
      await clientPage.selectType('Onderaannemer');

      const types = await clientPage.getSelectedTypes();
      expect(types).toContain('Klant');
      expect(types).toContain('Onderaannemer');
    });

    test('can create client as Prospect', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();

      await clientPage.gotoCreate();
      await clientPage.performBtwLookup(btwResponse);
      await clientPage.selectType('Prospect');
      await clientPage.save();

      await clientPage.expectSaveSuccess();
    });

    test('can create client as Eigen management', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();

      await clientPage.gotoCreate();
      await clientPage.performBtwLookup(btwResponse);
      await clientPage.selectType('Eigen management');
      await clientPage.save();

      await clientPage.expectSaveSuccess();
    });
  });

  test.describe('Edit', () => {
    let existingClient: ClientData;
    let btwResponse: ReturnType<typeof generateBtwResponse>;

    test.beforeEach(async ({ clientPage }) => {
      btwResponse = generateBtwResponse();
      existingClient = generateClient({ name: btwResponse.name });
      await clientPage.createWithBtwLookup(btwResponse);
    });

    test('can edit client contact', async ({ clientPage }) => {
      await clientPage.gotoList();
      await clientPage.clickRowWithText(btwResponse.name);

      const newContact = 'New Contact Person';
      await clientPage.fill({ contact: newContact });
      await clientPage.save();

      await clientPage.expectFormValues({ contact: newContact });
    });

    test('can edit client email', async ({ clientPage }) => {
      await clientPage.gotoList();
      await clientPage.clickRowWithText(btwResponse.name);

      const newEmail = 'newemail@test.com';
      await clientPage.fill({ contactEmail: newEmail });
      await clientPage.save();

      await clientPage.expectSaveSuccess();
    });

    test('can change client country', async ({ clientPage }) => {
      await clientPage.gotoList();
      await clientPage.clickRowWithText(btwResponse.name);

      await clientPage.selectCountry('Netherlands');
      await clientPage.save();

      await clientPage.expectSaveSuccess();
    });

    test('can change client language', async ({ clientPage }) => {
      await clientPage.gotoList();
      await clientPage.clickRowWithText(btwResponse.name);

      await clientPage.selectLanguage('en');
      await clientPage.save();

      await clientPage.expectSaveSuccess();
    });
  });

  test.describe('Notes/Comments', () => {
    test('can add a note to client', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();

      await clientPage.gotoCreate();
      await clientPage.performBtwLookup(btwResponse);

      const notes = await clientPage.openNotes();
      await notes.add('This is a test comment');

      await expect(notes.comments).toContainText('This is a test comment');
      await notes.close();
    });

    test('can search notes', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();

      await clientPage.gotoCreate();
      await clientPage.performBtwLookup(btwResponse);

      const notes = await clientPage.openNotes();
      await notes.add('Important note about client');
      await notes.search('Important');

      await expect(notes.comments).toContainText('Important note about client');
      await notes.close();
    });

    test('shows message when no notes match search', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();

      await clientPage.gotoCreate();
      await clientPage.performBtwLookup(btwResponse);

      const notes = await clientPage.openNotes();
      await notes.search('NonExistentNote');

      await expect(notes.modal).toContainText('Geen commentaar gevonden');
      await notes.close();
    });
  });

  test.describe('Email Configuration', () => {
    test('can configure email recipient', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();

      await clientPage.gotoCreate();
      await clientPage.performBtwLookup(btwResponse);
      await clientPage.configureEmail({ to: 'invoices@client.com' });
      await clientPage.save();

      await clientPage.expectSaveSuccess();
    });

    test('can configure email subject template', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();

      await clientPage.gotoCreate();
      await clientPage.performBtwLookup(btwResponse);
      await clientPage.configureEmail({
        to: 'invoices@client.com',
        subject: 'Invoice {{nr}} for {{clientName}}',
      });
      await clientPage.save();

      await clientPage.expectSaveSuccess();
    });

    test('can configure email body', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();

      await clientPage.gotoCreate();
      await clientPage.performBtwLookup(btwResponse);
      await clientPage.configureEmail({
        to: 'invoices@client.com',
        body: 'Dear Customer,\n\nPlease find attached our invoice.\n\nBest regards',
      });
      await clientPage.save();

      await clientPage.expectSaveSuccess();
    });
  });

  test.describe('Peppol Configuration', () => {
    test('can enable Peppol for client', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();

      await clientPage.gotoCreate();
      await clientPage.performBtwLookup(btwResponse);
      await clientPage.togglePeppol();
      await clientPage.save();

      await clientPage.expectSaveSuccess();
    });

    test('can disable Peppol for client', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();

      await clientPage.gotoCreate();
      await clientPage.performBtwLookup(btwResponse);
      await clientPage.togglePeppol(); // Enable
      await clientPage.save();

      await clientPage.gotoList();
      await clientPage.clickRowWithText(btwResponse.name);
      await clientPage.togglePeppol(); // Disable
      await clientPage.save();

      await clientPage.expectSaveSuccess();
    });
  });

  test.describe('List', () => {
    test('displays list of clients', async ({ clientPage }) => {
      await clientPage.gotoList();

      const rows = clientPage.getTableRows();
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('can search clients by name', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();
      await clientPage.createWithBtwLookup(btwResponse);

      await clientPage.gotoList();
      await clientPage.search(btwResponse.name);

      await clientPage.expectClientInList(btwResponse.name);
    });

    test('can navigate to client edit from list', async ({ clientPage }) => {
      const btwResponse = generateBtwResponse();
      await clientPage.createWithBtwLookup(btwResponse);

      await clientPage.gotoList();
      await clientPage.clickRowWithText(btwResponse.name);

      await clientPage.expectFormValues({ name: btwResponse.name });
    });
  });
});
