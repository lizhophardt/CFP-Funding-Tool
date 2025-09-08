/**
 * Test Suite Index
 * Central export point for all test utilities and helpers
 */

// Test utilities
export * from './utils/testHelpers';

// Mock implementations
export * from './mocks/web3Mock';

// Test fixtures
export * from './fixtures/testData';

// Test types (if any specific test types are needed)
export interface TestContext {
  server?: any;
  cleanup?: () => Promise<void>;
}

export interface TestConfig {
  timeout?: number;
  retries?: number;
  parallel?: boolean;
}

// Common test constants
export const TEST_CONSTANTS = {
  TIMEOUT: {
    UNIT: 5000,
    INTEGRATION: 15000,
    E2E: 30000
  },
  MOCK_DATA: {
    VALID_ADDRESS: '0x742d35Cc6634C0532925a3b8D8B9B3a8d8b8B3a8',
    INVALID_ADDRESS: '0xinvalid',
    TEST_PRIVATE_KEY: 'a'.repeat(64),
    TEST_SECRET_CODE: 'TestSecretCode123'
  }
} as const;
