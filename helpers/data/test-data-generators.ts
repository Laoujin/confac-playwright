import { faker } from '@faker-js/faker';

/**
 * Test data generators using Faker.js
 * Provides realistic test data for all entities
 */

// Consultant types matching the application
export type ConsultantType = 'consultant' | 'freelancer' | 'manager' | 'expiree';

export interface ConsultantData {
  firstName: string;
  name: string;
  slug: string;
  type: ConsultantType;
  email: string;
  telephone: string;
  active: boolean;
  accountingCode?: string;
}

export function generateConsultant(overrides: Partial<ConsultantData> = {}): ConsultantData {
  const firstName = overrides.firstName ?? faker.person.firstName();
  const lastName = overrides.name ?? faker.person.lastName();
  const uniqueSuffix = faker.string.alphanumeric(4);

  return {
    firstName,
    name: lastName,
    slug: `${lastName.toLowerCase()}-${firstName.toLowerCase()}-${uniqueSuffix}`,
    type: overrides.type ?? faker.helpers.arrayElement(['consultant', 'freelancer', 'manager'] as ConsultantType[]),
    email: overrides.email ?? faker.internet.email({ firstName, lastName }).toLowerCase(),
    telephone: overrides.telephone ?? faker.phone.number({ style: 'national' }),
    active: overrides.active ?? true,
    accountingCode: overrides.accountingCode,
  };
}

// Client types matching the application
export type ClientType = 'Klant' | 'Onderaannemer' | 'Prospect' | 'Eigen management';

export interface Address {
  street: string;
  number: string;
  zip_code: string;
  city: string;
  country: string;
  countryCode: string;
}

export interface BtwResponse {
  valid: boolean;
  countryCode: string;
  vatNumber: string;
  name: string;
  address: Address;
  strAddress: string;
}

export interface ClientData {
  name: string;
  btw: string;
  types: ClientType[];
  street: string;
  streetNr: string;
  postalCode: string;
  city: string;
  country: string;
  telephone: string;
  contact: string;
  contactEmail: string;
  language: 'nl' | 'en' | 'fr';
  active: boolean;
  hoursInDay?: number;
  invoiceFileName?: string;
  peppolEnabled?: boolean;
}

export function generateClient(overrides: Partial<ClientData> = {}): ClientData {
  const companyName = overrides.name ?? faker.company.name();

  return {
    name: companyName,
    btw: overrides.btw ?? generateBelgianVatNumber(),
    types: overrides.types ?? [faker.helpers.arrayElement(['Klant', 'Onderaannemer', 'Prospect'] as ClientType[])],
    street: overrides.street ?? faker.location.street(),
    streetNr: overrides.streetNr ?? faker.location.buildingNumber(),
    postalCode: overrides.postalCode ?? faker.location.zipCode('####'),
    city: overrides.city ?? faker.location.city(),
    country: overrides.country ?? 'Belgium',
    telephone: overrides.telephone ?? faker.phone.number({ style: 'national' }),
    contact: overrides.contact ?? faker.person.fullName(),
    contactEmail: overrides.contactEmail ?? faker.internet.email().toLowerCase(),
    language: overrides.language ?? faker.helpers.arrayElement(['nl', 'en', 'fr'] as const),
    active: overrides.active ?? true,
    hoursInDay: overrides.hoursInDay ?? 8,
    peppolEnabled: overrides.peppolEnabled ?? false,
  };
}

export function generateBtwResponse(overrides: Partial<BtwResponse> = {}): BtwResponse {
  const vatNumber = overrides.vatNumber ?? generateBelgianVatNumber().replace(/\s/g, '').replace('BE', '');
  const companyName = overrides.name ?? faker.company.name();
  const street = faker.location.street();
  const number = faker.location.buildingNumber();
  const zipCode = faker.location.zipCode('####');
  const city = faker.location.city();

  return {
    valid: overrides.valid ?? true,
    countryCode: overrides.countryCode ?? 'BE',
    vatNumber,
    name: companyName,
    address: overrides.address ?? {
      street,
      number,
      zip_code: zipCode,
      city,
      country: 'België',
      countryCode: 'BE',
    },
    strAddress: `${street} ${number}\n${zipCode} ${city}`,
  };
}

export function generateInvalidBtwResponse(): BtwResponse {
  return {
    valid: false,
    countryCode: 'BE',
    vatNumber: '0000000000',
    name: '',
    address: {
      street: '',
      number: '',
      zip_code: '',
      city: '',
      country: '',
      countryCode: '',
    },
    strAddress: '',
  };
}

// Invoice line types
export type InvoiceLineType = 'daily' | 'hourly' | 'fixed' | 'section';

export interface InvoiceLine {
  desc: string;
  amount: number;
  price: number;
  tax: number;
  type: InvoiceLineType;
  sort: number;
}

export function generateInvoiceLine(overrides: Partial<InvoiceLine> = {}, sort: number = 0): InvoiceLine {
  return {
    desc: overrides.desc ?? faker.commerce.productDescription().slice(0, 50),
    amount: overrides.amount ?? faker.number.int({ min: 1, max: 20 }),
    price: overrides.price ?? faker.number.int({ min: 100, max: 1000 }),
    tax: overrides.tax ?? 21,
    type: overrides.type ?? faker.helpers.arrayElement(['daily', 'hourly', 'fixed'] as InvoiceLineType[]),
    sort,
  };
}

// Project data
export interface ProjectData {
  consultantId: string;
  clientId: string;
  startDate: string;
  endDate?: string;
  ref?: string;
  invoiceLines: InvoiceLine[];
  timesheetCheck?: boolean;
  changingOrderNr?: boolean;
}

export function generateProject(consultantId: string, clientId: string, overrides: Partial<ProjectData> = {}): ProjectData {
  const startDate = overrides.startDate ?? faker.date.past({ years: 1 }).toISOString().split('T')[0];

  return {
    consultantId,
    clientId,
    startDate,
    endDate: overrides.endDate,
    ref: overrides.ref ?? `PRJ-${faker.string.alphanumeric(6).toUpperCase()}`,
    invoiceLines: overrides.invoiceLines ?? [generateInvoiceLine({}, 0)],
    timesheetCheck: overrides.timesheetCheck ?? true,
    changingOrderNr: overrides.changingOrderNr ?? false,
  };
}

// Invoice status types
export type InvoiceStatus = 'new' | 'validated' | 'sent' | 'paid';

export interface InvoiceData {
  clientId: string;
  number?: number;
  date: string;
  dueDate?: string;
  lines: InvoiceLine[];
  status: InvoiceStatus;
  notes?: string;
  orderNr?: string;
  isQuotation?: boolean;
}

export function generateInvoice(clientId: string, overrides: Partial<InvoiceData> = {}): InvoiceData {
  const date = overrides.date ?? faker.date.recent({ days: 30 }).toISOString().split('T')[0];
  const dueDate = overrides.dueDate ?? faker.date.future({ years: 0.1 }).toISOString().split('T')[0];

  return {
    clientId,
    number: overrides.number,
    date,
    dueDate,
    lines: overrides.lines ?? [generateInvoiceLine({}, 0), generateInvoiceLine({}, 1)],
    status: overrides.status ?? 'new',
    notes: overrides.notes,
    orderNr: overrides.orderNr ?? `ORD-${faker.string.alphanumeric(6).toUpperCase()}`,
    isQuotation: overrides.isQuotation ?? false,
  };
}

// Peppol/Billit response types
export interface PeppolOrderResponse {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'error';
  message?: string;
  createdAt: string;
}

export function generatePeppolSuccessResponse(overrides: Partial<PeppolOrderResponse> = {}): PeppolOrderResponse {
  return {
    id: overrides.id ?? faker.string.uuid(),
    status: 'accepted',
    message: overrides.message ?? 'Invoice submitted successfully',
    createdAt: overrides.createdAt ?? new Date().toISOString(),
  };
}

export function generatePeppolErrorResponse(errorMessage?: string): PeppolOrderResponse {
  return {
    id: faker.string.uuid(),
    status: 'error',
    message: errorMessage ?? 'Failed to submit invoice: Invalid VAT number',
    createdAt: new Date().toISOString(),
  };
}

export function generatePeppolPendingResponse(): PeppolOrderResponse {
  return {
    id: faker.string.uuid(),
    status: 'pending',
    message: 'Invoice is being processed',
    createdAt: new Date().toISOString(),
  };
}

// User/Role data for permission testing
export type UserRole = 'admin' | 'viewer' | 'readonly';

export interface UserData {
  email: string;
  name: string;
  firstName: string;
  alias: string;
  roles: UserRole[];
  active: boolean;
}

export function generateUser(role: UserRole = 'viewer', overrides: Partial<UserData> = {}): UserData {
  const firstName = overrides.firstName ?? faker.person.firstName();
  const lastName = overrides.name ?? faker.person.lastName();

  return {
    email: overrides.email ?? faker.internet.email({ firstName, lastName }).toLowerCase(),
    name: lastName,
    firstName,
    alias: overrides.alias ?? firstName.toLowerCase(),
    roles: [role],
    active: overrides.active ?? true,
  };
}

// Helper functions
function generateBelgianVatNumber(): string {
  // Belgian VAT numbers are BE + 10 digits, starting with 0 or 1
  const prefix = faker.helpers.arrayElement(['0', '1']);
  const digits = faker.string.numeric(9);
  return `BE ${prefix}${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function generateFutureDate(daysFromNow: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return formatDate(date);
}

export function generatePastDate(daysAgo: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatDate(date);
}

// Batch generators for seeding
export function generateConsultants(count: number): ConsultantData[] {
  return Array.from({ length: count }, () => generateConsultant());
}

export function generateClients(count: number): ClientData[] {
  return Array.from({ length: count }, () => generateClient());
}

export function generateInvoiceLines(count: number): InvoiceLine[] {
  return Array.from({ length: count }, (_, i) => generateInvoiceLine({}, i));
}
