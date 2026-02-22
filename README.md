# Confac Playwright E2E Tests

End-to-end tests for confac using Playwright. These tests serve as a behavioral contract between the current Node.js system and the future .NET rewrite.

## Quick Start

```bash
# Install dependencies
npm install
npx playwright install

# Start infrastructure (MongoDB + mock services)
npm run infra:up

# In another terminal, start confac backend (with test config)
cd ../confac/backend
cp ../../confac-playwright/.env.test .env
npm install
npm start

# In another terminal, start confac frontend
cd ../confac/frontend
npm install
npm start

# Seed the database and run tests
npm run seed
npm test
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
│   ├── MockClient.ts        # Mock service client (/prime, /calls)
│   ├── test-fixtures.ts     # Playwright fixtures
│   └── *.ts                 # Page Object Models
└── tests/
    └── *.spec.ts            # Test files
```

## Running Tests

### Development Mode (Local App)

Start infrastructure only, run backend/frontend locally:

```bash
# Terminal 1: Infrastructure
npm run infra:up

# Terminal 2: Backend (with .env.test config)
cd ../confac/backend && npm start

# Terminal 3: Frontend
cd ../confac/frontend && npm start

# Terminal 4: Tests
npm run seed
npm test           # Run all tests
npm run ui         # Interactive UI mode
npm run headed     # Run with browser visible
npm run debug      # Debug mode
```

### CI Mode (Full Docker)

Everything runs in containers:

```bash
npm run test:ci
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
npm run seed

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

```typescript
// helpers/InvoicePage.ts
export class InvoicePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/invoices');
  }

  async create(data: InvoiceData) {
    await this.page.getByTestId('create-invoice').click();
    await this.page.getByTestId('client').fill(data.client);
    // ...
  }

  get invoiceList() {
    return this.page.getByTestId('invoice-list');
  }
}
```

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm test` | Run all tests |
| `npm run ui` | Interactive UI mode |
| `npm run headed` | Run with visible browser |
| `npm run debug` | Debug mode with inspector |
| `npm run trace` | Run with trace recording |
| `npm run report` | Show HTML report |
| `npm run codegen` | Record new tests |
| `npm run infra:up` | Start MongoDB + mocks |
| `npm run infra:down` | Stop infrastructure |
| `npm run infra:reset` | Reset infrastructure (clear data) |
| `npm run infra:full:up` | Start full stack (CI mode) |
| `npm run seed` | Seed database with baseline data |
| `npm run mocks:reset` | Reset mock services |

## Ports

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Backend | 9000 (local) / 9001 (docker) |
| MongoDB | 27018 |
| Mock Excel | 3300 |
| Mock Peppol | 3002 |
