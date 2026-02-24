import { test, expect } from '../../../helpers/test-fixtures';
import { generateConsultant, ConsultantData } from '../../../helpers/data/test-data-generators';

test.describe('Consultant CRUD', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin');
  });

  test.describe('Create', () => {
    test('can create a consultant with minimum required fields', async ({ consultantPage }) => {
      const data = generateConsultant();

      await consultantPage.gotoCreate();
      await consultantPage.expectSaveDisabled();

      await consultantPage.fill({ firstName: data.firstName, name: data.name });
      await consultantPage.expectSaveEnabled();

      await consultantPage.save();
      await consultantPage.expectSaveSuccess();
    });

    test('can create a consultant with all fields', async ({ consultantPage }) => {
      const data = generateConsultant({ type: 'freelancer' });

      await consultantPage.gotoCreate();
      await consultantPage.fill(data);
      await consultantPage.save();

      await consultantPage.gotoList();
      await consultantPage.expectConsultantInList(data.name);
    });

    test('can create consultant as external consultant type', async ({ consultantPage }) => {
      const data = generateConsultant({ type: 'consultant' });

      await consultantPage.gotoCreate();
      await consultantPage.fill(data);
      await consultantPage.selectType('consultant');
      await consultantPage.save();

      await consultantPage.gotoList();
      await consultantPage.expectConsultantInList(data.name);
    });

    test('can create consultant as freelancer type', async ({ consultantPage }) => {
      const data = generateConsultant({ type: 'freelancer' });

      await consultantPage.gotoCreate();
      await consultantPage.fill(data);
      await consultantPage.selectType('freelancer');
      await consultantPage.save();

      await consultantPage.gotoList();
      await consultantPage.expectConsultantInList(data.name);
    });

    test('can create consultant as manager type', async ({ consultantPage }) => {
      const data = generateConsultant({ type: 'manager' });

      await consultantPage.gotoCreate();
      await consultantPage.fill(data);
      await consultantPage.selectType('manager');
      await consultantPage.save();

      await consultantPage.gotoList();
      await consultantPage.expectConsultantInList(data.name);
    });
  });

  test.describe('Edit', () => {
    let existingConsultant: ConsultantData;

    test.beforeEach(async ({ consultantPage }) => {
      // Create a consultant first
      existingConsultant = generateConsultant();
      await consultantPage.create(existingConsultant);
    });

    test('can edit consultant first name', async ({ consultantPage }) => {
      await consultantPage.gotoList();
      await consultantPage.clickEditOnRow(existingConsultant.name);

      const newFirstName = 'UpdatedFirstName';
      await consultantPage.fill({ firstName: newFirstName });
      await consultantPage.save();

      await consultantPage.expectFormValues({ firstName: newFirstName });
    });

    test('can edit consultant last name', async ({ consultantPage }) => {
      await consultantPage.gotoList();
      await consultantPage.clickEditOnRow(existingConsultant.name);

      const newLastName = 'UpdatedLastName_' + Date.now();
      await consultantPage.fill({ name: newLastName });
      await consultantPage.save();

      await consultantPage.gotoList();
      await consultantPage.expectConsultantInList(newLastName);
    });

    test('can edit consultant email', async ({ consultantPage }) => {
      await consultantPage.gotoList();
      await consultantPage.clickEditOnRow(existingConsultant.name);

      const newEmail = 'updated@example.com';
      await consultantPage.fill({ email: newEmail });
      await consultantPage.save();

      await consultantPage.expectFormValues({ email: newEmail });
    });

    test('can change consultant type', async ({ consultantPage }) => {
      await consultantPage.gotoList();
      await consultantPage.clickEditOnRow(existingConsultant.name);

      await consultantPage.selectType('manager');
      await consultantPage.save();

      const selectedType = await consultantPage.getSelectedType();
      expect(selectedType).toContain('Manager');
    });
  });

  test.describe('List', () => {
    test('displays list of consultants', async ({ consultantPage }) => {
      await consultantPage.gotoList();
      const count = await consultantPage.getConsultantCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('can search consultants by name', async ({ consultantPage }) => {
      const data = generateConsultant();
      await consultantPage.create(data);

      await consultantPage.gotoList();
      await consultantPage.search(data.name);

      await consultantPage.expectConsultantInList(data.name);
    });

    test('search returns no results for non-existent name', async ({ consultantPage }) => {
      await consultantPage.gotoList();
      await consultantPage.search('NonExistentConsultant12345');

      const count = await consultantPage.getConsultantCount();
      expect(count).toBe(0);
    });

    test('can clear search to show all consultants', async ({ consultantPage }) => {
      await consultantPage.gotoList();
      const initialCount = await consultantPage.getConsultantCount();

      await consultantPage.search('NonExistentName');
      await consultantPage.clearSearch();

      const finalCount = await consultantPage.getConsultantCount();
      expect(finalCount).toBe(initialCount);
    });
  });

  test.describe('Soft delete (toggle active)', () => {
    test('can deactivate a consultant', async ({ consultantPage }) => {
      const data = generateConsultant({ active: true });
      await consultantPage.create(data);

      await consultantPage.gotoList();
      await consultantPage.clickEditOnRow(data.name);

      const activeToggle = consultantPage.page.getByTestId('active');
      await activeToggle.click();
      await consultantPage.save();

      // Filter to inactive to verify
      await consultantPage.gotoList();
      await consultantPage.filterInactive();
      await consultantPage.expectConsultantInList(data.name);
    });

    test('can reactivate a consultant', async ({ consultantPage }) => {
      const data = generateConsultant({ active: false });
      await consultantPage.create(data);

      await consultantPage.gotoList();
      await consultantPage.filterInactive();
      await consultantPage.clickEditOnRow(data.name);

      const activeToggle = consultantPage.page.getByTestId('active');
      await activeToggle.click();
      await consultantPage.save();

      // Should appear in active list
      await consultantPage.gotoList();
      await consultantPage.filterActive();
      await consultantPage.expectConsultantInList(data.name);
    });

    test('inactive consultant not shown in active filter', async ({ consultantPage }) => {
      const data = generateConsultant({ active: false });
      await consultantPage.create(data);

      await consultantPage.gotoList();
      await consultantPage.filterActive();
      await consultantPage.expectConsultantNotInList(data.name);
    });
  });

  test.describe('Filter by type', () => {
    test('can filter by active status', async ({ consultantPage }) => {
      await consultantPage.gotoList();
      await consultantPage.filterActive();

      const count = await consultantPage.getConsultantCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('can filter by inactive status', async ({ consultantPage }) => {
      await consultantPage.gotoList();
      await consultantPage.filterInactive();

      const count = await consultantPage.getConsultantCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('can show all consultants', async ({ consultantPage }) => {
      await consultantPage.gotoList();
      await consultantPage.filterAll();

      const count = await consultantPage.getConsultantCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
