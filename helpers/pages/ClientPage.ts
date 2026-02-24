import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Dropdown } from '../Dropdown';
import { NotesModal } from '../NotesModal';
import { ClientData, BtwResponse, ClientType } from '../data/test-data-generators';

/**
 * Page Object Model for Client CRUD operations
 */
export class ClientPage extends BasePage {
  // BTW lookup elements
  readonly btwInput: Locator;
  readonly btwRequestedButton: Locator;
  readonly btwContinueButton: Locator;
  readonly btwLoading: Locator;

  // Form fields
  readonly nameInput: Locator;
  readonly streetInput: Locator;
  readonly streetNrInput: Locator;
  readonly postalCodeInput: Locator;
  readonly cityInput: Locator;
  readonly telephoneInput: Locator;
  readonly contactInput: Locator;
  readonly contactEmailInput: Locator;
  readonly notesInput: Locator;

  // Dropdowns
  readonly typesDropdown: Dropdown;
  readonly countryDropdown: Dropdown;
  readonly languageDropdown: Dropdown;

  // Email config
  readonly emailToInput: Locator;
  readonly emailSubjectInput: Locator;
  readonly emailBodyInput: Locator;

  // Notes/Comments
  readonly addNoteButton: Locator;

  // Peppol
  readonly peppolEnabledToggle: Locator;

  constructor(page: Page) {
    super(page, '.tst-save-client');

    // BTW lookup
    this.btwInput = page.getByTestId('btw');
    this.btwRequestedButton = page.getByTestId('btw-requested');
    this.btwContinueButton = page.getByTestId('btw-continue');
    this.btwLoading = page.locator('.btw-loading');

    // Form fields
    this.nameInput = page.getByTestId('name');
    this.streetInput = page.getByTestId('street');
    this.streetNrInput = page.getByTestId('streetNr');
    this.postalCodeInput = page.getByTestId('postalCode');
    this.cityInput = page.getByTestId('city');
    this.telephoneInput = page.getByTestId('telephone');
    this.contactInput = page.getByTestId('contact');
    this.contactEmailInput = page.getByTestId('contactEmail');
    this.notesInput = page.getByTestId('notes');

    // Dropdowns
    this.typesDropdown = new Dropdown(page, 'types');
    this.countryDropdown = new Dropdown(page, 'country');
    this.languageDropdown = new Dropdown(page, 'language');

    // Email config
    this.emailToInput = page.getByTestId('email.to');
    this.emailSubjectInput = page.getByTestId('email.subject');
    this.emailBodyInput = page.getByTestId('email.body');

    // Notes button
    this.addNoteButton = page.locator('.tst-add-note').first();

    // Peppol toggle
    this.peppolEnabledToggle = page.getByTestId('peppolEnabled');
  }

  getListUrl(): string {
    return '/clients';
  }

  getCreateUrl(): string {
    return '/clients/create';
  }

  getEditUrl(id: string): string {
    return `/clients/${id}`;
  }

  getPageTitlePattern(): RegExp {
    return /Klanten/;
  }

  /**
   * Enter BTW number and trigger lookup
   */
  async enterBtw(vatNumber: string): Promise<void> {
    await this.btwInput.fill(vatNumber);
  }

  /**
   * Wait for BTW lookup to complete
   */
  async waitForBtwLookup(): Promise<void> {
    await this.page.waitForResponse(resp => resp.url().includes('/api/clients/btw'));
  }

  /**
   * Mock BTW lookup response
   */
  async mockBtwLookup(response: BtwResponse): Promise<void> {
    await this.page.route('*/**/api/clients/btw/*', async route => {
      await route.fulfill({ json: response });
    });
  }

  /**
   * Click "BTW in aanvraag" button
   */
  async clickBtwRequested(): Promise<void> {
    await this.btwRequestedButton.click();
  }

  /**
   * Click continue after BTW lookup
   */
  async clickBtwContinue(): Promise<void> {
    await this.btwContinueButton.click();
  }

  /**
   * Perform BTW lookup with mocked response
   */
  async performBtwLookup(response: BtwResponse): Promise<void> {
    await this.mockBtwLookup(response);
    await this.enterBtw(response.vatNumber);
    await this.waitForBtwLookup();
    await this.clickBtwContinue();
  }

  /**
   * Fill client form with data
   */
  async fill(data: Partial<ClientData>): Promise<void> {
    if (data.name) {
      await this.nameInput.fill(data.name);
    }
    if (data.street) {
      await this.streetInput.fill(data.street);
    }
    if (data.streetNr) {
      await this.streetNrInput.fill(data.streetNr);
    }
    if (data.postalCode) {
      await this.postalCodeInput.fill(data.postalCode);
    }
    if (data.city) {
      await this.cityInput.fill(data.city);
    }
    if (data.telephone) {
      await this.telephoneInput.fill(data.telephone);
    }
    if (data.contact) {
      await this.contactInput.fill(data.contact);
    }
    if (data.contactEmail) {
      await this.contactEmailInput.fill(data.contactEmail);
    }
    if (data.types) {
      for (const type of data.types) {
        await this.selectType(type);
      }
    }
    if (data.country) {
      await this.selectCountry(data.country);
    }
    if (data.language) {
      await this.selectLanguage(data.language);
    }
  }

  /**
   * Create a new client with BTW lookup
   */
  async createWithBtwLookup(btwResponse: BtwResponse, additionalData?: Partial<ClientData>): Promise<void> {
    await this.gotoCreate();
    await this.performBtwLookup(btwResponse);

    if (additionalData) {
      await this.fill(additionalData);
    }

    await this.save();
  }

  /**
   * Create a new client with "BTW in aanvraag"
   */
  async createWithBtwRequested(data: ClientData): Promise<void> {
    await this.gotoCreate();
    await this.clickBtwRequested();
    await this.fill(data);
    await this.save();
  }

  /**
   * Edit an existing client
   */
  async edit(id: string, data: Partial<ClientData>): Promise<void> {
    await this.gotoEdit(id);
    await this.fill(data);
    await this.save();
  }

  /**
   * Select client type (multi-select)
   */
  async selectType(type: ClientType): Promise<void> {
    await this.typesDropdown.selectOption(type);
  }

  /**
   * Select country from dropdown
   */
  async selectCountry(country: string): Promise<void> {
    // Map country names to dropdown values
    const countryMap: Record<string, string> = {
      'Belgium': 'België',
      'Netherlands': 'Nederland',
      'France': 'Frankrijk',
      'Germany': 'Duitsland',
      'UK': 'UK',
      'Luxembourg': 'Luxemburg',
    };
    const value = countryMap[country] ?? country;
    await this.countryDropdown.selectOption(value);
  }

  /**
   * Select language from dropdown
   */
  async selectLanguage(language: 'nl' | 'en' | 'fr'): Promise<void> {
    const languageMap: Record<string, string> = {
      'nl': 'Nederlands',
      'en': 'Engels',
      'fr': 'Frans',
    };
    await this.languageDropdown.selectOption(languageMap[language]);
  }

  /**
   * Open notes modal
   */
  async openNotes(): Promise<NotesModal> {
    await this.addNoteButton.click();
    return new NotesModal(this.page);
  }

  /**
   * Add a note to the client
   */
  async addNote(comment: string): Promise<void> {
    const notes = await this.openNotes();
    await notes.add(comment);
    await notes.close();
  }

  /**
   * Configure email settings
   */
  async configureEmail(config: {
    to?: string;
    subject?: string;
    body?: string;
  }): Promise<void> {
    if (config.to) {
      await this.emailToInput.fill(config.to);
    }
    if (config.subject) {
      await this.emailSubjectInput.fill(config.subject);
    }
    if (config.body) {
      await this.emailBodyInput.fill(config.body);
    }
  }

  /**
   * Toggle Peppol enabled
   */
  async togglePeppol(): Promise<void> {
    await this.peppolEnabledToggle.click();
  }

  /**
   * Get client row from list by name
   */
  getClientRow(name: string): Locator {
    return this.getTableRows().filter({ hasText: name });
  }

  /**
   * Expect client to be in list
   */
  async expectClientInList(name: string): Promise<void> {
    await expect(this.getClientRow(name)).toBeVisible();
  }

  /**
   * Expect client to not be in list
   */
  async expectClientNotInList(name: string): Promise<void> {
    await expect(this.getClientRow(name)).not.toBeVisible();
  }

  /**
   * Expect BTW field to have value
   */
  async expectBtwValue(value: string): Promise<void> {
    await expect(this.btwInput).toHaveValue(value);
  }

  /**
   * Expect form to have values from BTW lookup
   */
  async expectBtwLookupValues(response: BtwResponse): Promise<void> {
    await expect(this.nameInput).toHaveValue(response.name);
    await expect(this.postalCodeInput).toHaveValue(response.address.zip_code);
    await expect(this.cityInput).toHaveValue(response.address.city);
  }

  /**
   * Expect form to have specific values
   */
  async expectFormValues(data: Partial<ClientData>): Promise<void> {
    if (data.name) {
      await expect(this.nameInput).toHaveValue(data.name);
    }
    if (data.postalCode) {
      await expect(this.postalCodeInput).toHaveValue(data.postalCode);
    }
    if (data.city) {
      await expect(this.cityInput).toHaveValue(data.city);
    }
  }

  /**
   * Get all client names from list
   */
  async getAllClientNames(): Promise<string[]> {
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
   * Get selected types
   */
  async getSelectedTypes(): Promise<string[]> {
    const values = this.typesDropdown.values;
    const count = await values.count();
    const types: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await values.nth(i).textContent();
      if (text) {
        types.push(text.trim());
      }
    }

    return types;
  }
}
