/**
 * Helpers module for Confac E2E tests
 * Re-exports all helpers, page objects, and fixtures
 */

// Test fixtures with page objects
export { test, expect, peppolMock, excelMock, MockClient } from './test-fixtures';

// Page Objects
export * from './pages';

// Data generators
export * from './data';

// Legacy page objects (for backwards compatibility)
export { ConsultantCreatePage } from './ConsultantCreatePage';
export { ClientCreatePage } from './ClientCreatePage';

// Utility helpers
export { Dropdown } from './Dropdown';
export { NotesModal } from './NotesModal';

// Database fixture (separate export to avoid conflicts)
export { test as dbTest } from './ConfacFixtures';
