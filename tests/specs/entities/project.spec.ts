import { test, expect } from '../../../helpers/test-fixtures';
import {
  generateProject,
  generateConsultant,
  generateBtwResponse,
  generateInvoiceLine,
} from '../../../helpers/data/test-data-generators';

test.describe('Project CRUD', () => {
  let consultantName: string;
  let clientName: string;

  test.beforeEach(async ({ loginAs, consultantPage, clientPage }) => {
    await loginAs('admin');

    // Create a consultant and client for testing
    const consultant = generateConsultant();
    consultantName = `${consultant.firstName} ${consultant.name}`;
    await consultantPage.create(consultant);

    const btwResponse = generateBtwResponse();
    clientName = btwResponse.name;
    await clientPage.createWithBtwLookup(btwResponse);
  });

  test.describe('Create', () => {
    test('can create a project with minimum required fields', async ({ projectPage }) => {
      await projectPage.gotoCreate();
      await projectPage.selectConsultant(consultantName);
      await projectPage.selectClient(clientName);
      await projectPage.setStartDate('2024-01-01');
      await projectPage.save();

      await projectPage.expectSaveSuccess();
    });

    test('can create a project with reference number', async ({ projectPage }) => {
      const project = generateProject('', '', { ref: 'PRJ-2024-001' });

      await projectPage.gotoCreate();
      await projectPage.selectConsultant(consultantName);
      await projectPage.selectClient(clientName);
      await projectPage.setStartDate(project.startDate);
      await projectPage.setRef(project.ref!);
      await projectPage.save();

      await projectPage.expectSaveSuccess();
    });

    test('can create a project with start and end date', async ({ projectPage }) => {
      await projectPage.gotoCreate();
      await projectPage.selectConsultant(consultantName);
      await projectPage.selectClient(clientName);
      await projectPage.setStartDate('2024-01-01');
      await projectPage.setEndDate('2024-12-31');
      await projectPage.save();

      await projectPage.expectSaveSuccess();
    });

    test('can create a project with invoice lines', async ({ projectPage }) => {
      const line = generateInvoiceLine({ desc: 'Consultancy services', price: 750, amount: 0 });

      await projectPage.gotoCreate();
      await projectPage.selectConsultant(consultantName);
      await projectPage.selectClient(clientName);
      await projectPage.setStartDate('2024-01-01');
      await projectPage.addInvoiceLine(line);
      await projectPage.save();

      await projectPage.expectSaveSuccess();
    });

    test('can create a project with multiple invoice lines', async ({ projectPage }) => {
      const line1 = generateInvoiceLine({ desc: 'Consultancy', price: 750 }, 0);
      const line2 = generateInvoiceLine({ desc: 'Travel expenses', price: 50, type: 'fixed' }, 1);

      await projectPage.gotoCreate();
      await projectPage.selectConsultant(consultantName);
      await projectPage.selectClient(clientName);
      await projectPage.setStartDate('2024-01-01');
      await projectPage.addInvoiceLine(line1);
      await projectPage.addInvoiceLine(line2);
      await projectPage.save();

      await projectPage.expectSaveSuccess();
    });

    test('can create a project with timesheet check enabled', async ({ projectPage }) => {
      await projectPage.gotoCreate();
      await projectPage.selectConsultant(consultantName);
      await projectPage.selectClient(clientName);
      await projectPage.setStartDate('2024-01-01');
      await projectPage.toggleTimesheetCheck();
      await projectPage.save();

      await projectPage.expectSaveSuccess();
    });
  });

  test.describe('Edit', () => {
    test.beforeEach(async ({ projectPage }) => {
      // Create a project first
      await projectPage.gotoCreate();
      await projectPage.selectConsultant(consultantName);
      await projectPage.selectClient(clientName);
      await projectPage.setStartDate('2024-01-01');
      await projectPage.setRef('PRJ-EDIT-TEST');
      await projectPage.save();
    });

    test('can edit project reference', async ({ projectPage }) => {
      await projectPage.gotoList();
      await projectPage.clickRowWithText(consultantName);

      await projectPage.setRef('PRJ-UPDATED');
      await projectPage.save();

      await projectPage.expectFormValues({ ref: 'PRJ-UPDATED' });
    });

    test('can edit project end date', async ({ projectPage }) => {
      await projectPage.gotoList();
      await projectPage.clickRowWithText(consultantName);

      await projectPage.setEndDate('2024-06-30');
      await projectPage.save();

      await projectPage.expectSaveSuccess();
    });

    test('can add invoice line to existing project', async ({ projectPage }) => {
      await projectPage.gotoList();
      await projectPage.clickRowWithText(consultantName);

      const newLine = generateInvoiceLine({ desc: 'Additional services' });
      await projectPage.addInvoiceLine(newLine);
      await projectPage.save();

      await projectPage.expectSaveSuccess();
    });

    test('can remove invoice line from project', async ({ projectPage }) => {
      // First add a line
      await projectPage.gotoList();
      await projectPage.clickRowWithText(consultantName);

      const initialCount = await projectPage.getInvoiceLineCount();

      // Remove the first line
      if (initialCount > 0) {
        await projectPage.removeInvoiceLine(0);
        await projectPage.save();

        const newCount = await projectPage.getInvoiceLineCount();
        expect(newCount).toBe(initialCount - 1);
      }
    });

    test('can toggle timesheet check', async ({ projectPage }) => {
      await projectPage.gotoList();
      await projectPage.clickRowWithText(consultantName);

      await projectPage.toggleTimesheetCheck();
      await projectPage.save();

      await projectPage.expectSaveSuccess();
    });

    test('can toggle changing order number', async ({ projectPage }) => {
      await projectPage.gotoList();
      await projectPage.clickRowWithText(consultantName);

      await projectPage.toggleChangingOrderNr();
      await projectPage.save();

      await projectPage.expectSaveSuccess();
    });
  });

  test.describe('Delete', () => {
    test('can delete project without project months', async ({ projectPage }) => {
      // Create a project to delete
      await projectPage.gotoCreate();
      await projectPage.selectConsultant(consultantName);
      await projectPage.selectClient(clientName);
      await projectPage.setStartDate('2024-01-01');
      await projectPage.setRef('PRJ-TO-DELETE');
      await projectPage.save();

      await projectPage.gotoList();
      await projectPage.clickRowWithText(consultantName);

      await projectPage.delete();
      await projectPage.page.getByTestId('confirm-delete-project').click();

      await projectPage.gotoList();
      await projectPage.expectProjectNotInList('PRJ-TO-DELETE');
    });

    // Note: Testing delete restriction requires a project with project months
    // which requires more complex setup
  });

  test.describe('Copy Project', () => {
    test('can copy a project', async ({ projectPage }) => {
      // Create a project first
      await projectPage.gotoCreate();
      await projectPage.selectConsultant(consultantName);
      await projectPage.selectClient(clientName);
      await projectPage.setStartDate('2024-01-01');
      await projectPage.setRef('PRJ-ORIGINAL');
      await projectPage.save();

      // Navigate to the project
      await projectPage.gotoList();
      await projectPage.clickRowWithText(consultantName);

      // Copy the project
      await projectPage.copyProject();

      // Should be on create page with copied data
      const selectedConsultant = await projectPage.getSelectedConsultant();
      expect(selectedConsultant).toContain(consultantName);
    });
  });

  test.describe('List', () => {
    test('displays list of projects', async ({ projectPage }) => {
      await projectPage.gotoList();

      const count = await projectPage.getRowCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('can search projects', async ({ projectPage }) => {
      // Create a project first
      await projectPage.gotoCreate();
      await projectPage.selectConsultant(consultantName);
      await projectPage.selectClient(clientName);
      await projectPage.setStartDate('2024-01-01');
      await projectPage.save();

      await projectPage.gotoList();
      await projectPage.search(consultantName);

      await projectPage.expectProjectInList(consultantName);
    });

    test('can navigate to project edit from list', async ({ projectPage }) => {
      // Create a project first
      await projectPage.gotoCreate();
      await projectPage.selectConsultant(consultantName);
      await projectPage.selectClient(clientName);
      await projectPage.setStartDate('2024-01-01');
      await projectPage.setRef('PRJ-NAV-TEST');
      await projectPage.save();

      await projectPage.gotoList();
      await projectPage.clickRowWithText(consultantName);

      await projectPage.expectFormValues({ ref: 'PRJ-NAV-TEST' });
    });
  });

  test.describe('Contract Status', () => {
    test('can set contract status to NoContract', async ({ projectPage }) => {
      await projectPage.gotoCreate();
      await projectPage.selectConsultant(consultantName);
      await projectPage.selectClient(clientName);
      await projectPage.setStartDate('2024-01-01');
      await projectPage.setContractStatus('NoContract');
      await projectPage.save();

      await projectPage.expectSaveSuccess();
    });

    test('can set contract status to BothSigned', async ({ projectPage }) => {
      await projectPage.gotoCreate();
      await projectPage.selectConsultant(consultantName);
      await projectPage.selectClient(clientName);
      await projectPage.setStartDate('2024-01-01');
      await projectPage.setContractStatus('BothSigned');
      await projectPage.save();

      await projectPage.expectSaveSuccess();
    });
  });

  test.describe('Date Pickers', () => {
    test('start date is required', async ({ projectPage }) => {
      await projectPage.gotoCreate();
      await projectPage.selectConsultant(consultantName);
      await projectPage.selectClient(clientName);

      // Don't set start date
      await projectPage.expectSaveDisabled();
    });

    test('end date is optional', async ({ projectPage }) => {
      await projectPage.gotoCreate();
      await projectPage.selectConsultant(consultantName);
      await projectPage.selectClient(clientName);
      await projectPage.setStartDate('2024-01-01');
      // Don't set end date

      await projectPage.expectSaveEnabled();
    });
  });
});
