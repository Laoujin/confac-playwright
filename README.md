# Confac Playwright E2E Tests

End-to-end tests for confac using Playwright. These tests serve as a behavioral contract between the current Node.js system and the future .NET rewrite.

## Quick Start

```bash
# Install dependencies
bun install
bunx playwright install

# Start infrastructure (MongoDB + mock services)
bun run infra:up

# In another terminal, start confac backend (with test config)
cd ../confac/backend
cp ../../confac-playwright/.env.test .env
bun install
bun start

# In another terminal, start confac frontend
cd ../confac/frontend
bun install
bun start

# Seed the database and run tests
bun run seed
bun test
```

## Architecture

```
confac-playwright/
├── docker-compose.test.yml   # Infrastructure only (mongo + mocks)
├── docker-compose.full.yml   # Full stack for CI/CD
├── mocks/
│   ├── peppol/              # Peppol/Billit mock service
│   └── excel/               # Excel service mock
├── seed/
│   ├── baseline-data.json   # Baseline test data
│   └── seed.ts              # Database seeding script
├── helpers/
│   ├── pages/               # Page Object Models
│   │   ├── BasePage.ts      # Common page functionality
│   │   ├── ConsultantPage.ts
│   │   ├── ClientPage.ts
│   │   ├── ProjectPage.ts
│   │   └── InvoicePage.ts
│   ├── data/                # Test data generators
│   │   └── test-data-generators.ts
│   ├── MockClient.ts        # Mock service client (/prime, /calls)
│   ├── test-fixtures.ts     # Playwright fixtures with page objects
│   ├── Dropdown.ts          # React-select dropdown helper
│   └── NotesModal.ts        # Notes/comments modal helper
└── tests/
    ├── specs/
    │   ├── entities/        # CRUD tests (~78 tests)
    │   ├── flows/           # End-to-end flows (~5 tests)
    │   ├── claims/          # Permission tests (~15 tests)
    │   └── integrations/    # External service tests (~18 tests)
    └── *.spec.ts            # Legacy test files
```

## Running Tests

### Development Mode (Local App)

Start infrastructure only, run backend/frontend locally:

```bash
# Terminal 1: Infrastructure
bun run infra:up

# Terminal 2: Backend (with .env.test config)
cd ../confac/backend && bun start

# Terminal 3: Frontend
cd ../confac/frontend && bun start

# Terminal 4: Tests
bun run seed
bun test           # Run all tests
bun run ui         # Interactive UI mode
bun run headed     # Run with browser visible
bun run debug      # Debug mode
```

### CI Mode (Full Docker)

Everything runs in containers:

```bash
bun run test:ci
```

## Mock Services

Mock services implement `/prime` and `/calls` endpoints for test control.

### Priming Responses

```typescript
import { peppolMock } from '../helpers/test-fixtures';

// Prime a success response
await peppolMock.prime({
  endpoint: '/v1/orders',
  method: 'POST',
  status: 200,
  response: { orderId: '12345', status: 'created' }
});

// Prime a failure
await peppolMock.prime({
  endpoint: '/v1/orders',
  method: 'POST',
  status: 500,
  error: 'Connection timeout'
});

// Prime with delay (simulate slow response)
await peppolMock.prime({
  endpoint: '/v1/orders',
  method: 'POST',
  delay: 5000,
  response: { orderId: '12345' }
});
```

### Verifying Calls

```typescript
// Get all calls
const calls = await peppolMock.getCalls();

// Get calls for specific endpoint
const orderCalls = await peppolMock.getCallsFor('/v1/orders');

// Assert endpoint was called
await peppolMock.assertCalled('/v1/orders', { times: 1, method: 'POST' });

// Assert endpoint was NOT called
await peppolMock.assertNotCalled('/v1/orders');

// Reset between tests
await peppolMock.reset();
```

## Database Seeding

```bash
# Seed with baseline data
bun run seed

# Or programmatically
import { seedDatabase } from './seed/seed';
await seedDatabase();
```

Baseline data includes:
- 2 users (admin, viewer)
- 2 roles (admin, viewer)
- 2 consultants
- 2 clients
- 1 project
- Config

## Test Organization

```
tests/
├── specs/
│   ├── entities/           # CRUD tests per entity
│   │   ├── consultant.spec.ts
│   │   ├── client.spec.ts
│   │   ├── project.spec.ts
│   │   └── invoice.spec.ts
│   ├── flows/              # End-to-end flows
│   │   └── invoice-flow.spec.ts
│   ├── claims/             # Permission tests
│   │   └── claim-enforcement.spec.ts
│   └── integrations/       # External service tests
│       ├── peppol.spec.ts
│       └── excel.spec.ts
└── pages/                  # Page Object Models
    ├── consultant.page.ts
    ├── client.page.ts
    └── invoice.page.ts
```

## Writing Tests

### Using Fixtures

```typescript
import { test, expect, peppolMock } from '../helpers/test-fixtures';

test.describe('Invoice Peppol Integration', () => {
  test('sends invoice to Peppol', async ({ page, peppolMock, loginAs }) => {
    // Login as admin
    await loginAs('admin');

    // Prime Peppol mock
    await peppolMock.prime({
      endpoint: '/v1/orders',
      method: 'POST',
      response: { orderId: '12345' }
    });

    // Navigate and perform action
    await page.goto('/invoices');
    await page.getByTestId('send-to-peppol').click();

    // Verify the call was made
    await peppolMock.assertCalled('/v1/orders');
  });
});
```

### Page Object Model

Page objects are available as fixtures:

```typescript
import { test, expect } from '../helpers/test-fixtures';

test('create a consultant', async ({ consultantPage, loginAs }) => {
  await loginAs('admin');

  await consultantPage.gotoCreate();
  await consultantPage.fill({
    firstName: 'John',
    name: 'Doe',
    email: 'john.doe@example.com',
    type: 'consultant',
  });
  await consultantPage.save();
  await consultantPage.expectSaveSuccess();
});
```

Available page fixtures: `consultantPage`, `clientPage`, `projectPage`, `invoicePage`

### Test Data Generators

Generate realistic test data using Faker.js:

```typescript
import {
  generateConsultant,
  generateClient,
  generateBtwResponse,
  generateInvoice,
  generatePeppolSuccessResponse,
} from '../helpers/data/test-data-generators';

// Generate random consultant data
const consultant = generateConsultant({ type: 'freelancer' });

// Generate BTW lookup response
const btwResponse = generateBtwResponse();

// Generate invoice with custom values
const invoice = generateInvoice('clientId', {
  status: 'new',
  lines: [generateInvoiceLine({ desc: 'Consultancy', price: 750 })],
});
```

## Scripts Reference

| Script | Description |
|--------|-------------|
| `bun test` | Run all tests |
| `bun run test:e2e` | Run all E2E spec tests |
| `bun run test:entities` | Run entity CRUD tests |
| `bun run test:flows` | Run end-to-end flow tests |
| `bun run test:integrations` | Run integration tests (Peppol, Excel) |
| `bun run test:claims` | Run permission/claims tests |
| `bun run ui` | Interactive UI mode |
| `bun run headed` | Run with visible browser |
| `bun run debug` | Debug mode with inspector |
| `bun run trace` | Run with trace recording |
| `bun run report` | Show HTML report |
| `bun run codegen` | Record new tests |
| `bun run infra:up` | Start MongoDB + mocks |
| `bun run infra:down` | Stop infrastructure |
| `bun run infra:reset` | Reset infrastructure (clear data) |
| `bun run infra:full:up` | Start full stack (CI mode) |
| `bun run seed` | Seed database with baseline data |
| `bun run mocks:reset` | Reset mock services |

## Ports

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Backend | 9000 (local) / 9001 (docker) |
| MongoDB | 27018 |
| Mock Excel | 3300 |
| Mock Peppol | 3002 |
