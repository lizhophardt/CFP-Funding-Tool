/**
 * Jest setup file - runs after the test framework is installed in the environment
 */

import '@testing-library/jest-dom';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.GNOSIS_RPC_URL = 'http://localhost:8545'; // Mock RPC URL
process.env.PRIVATE_KEY = 'a'.repeat(64); // Mock private key
process.env.SECRET_CODES = 'TestCode1,TestCode2,TestCode3';
process.env.WXHOPR_TOKEN_ADDRESS = '0x' + '1'.repeat(40);
process.env.AIRDROP_AMOUNT_WEI = '1000000000000000000';
process.env.XDAI_AIRDROP_AMOUNT_WEI = '1000000000000000000';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console output in tests unless explicitly needed
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Global test utilities
global.testUtils = {
  // Helper to restore console for specific tests
  restoreConsole: () => {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  },
  
  // Helper to suppress console for specific tests
  suppressConsole: () => {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  },

  // Helper to wait for async operations
  wait: (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to create mock Ethereum address
  mockAddress: (suffix: string = '1') => '0x' + suffix.repeat(40).substring(0, 40),

  // Helper to create mock transaction hash
  mockTxHash: (suffix: string = '1') => '0x' + suffix.repeat(64).substring(0, 64)
};

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidEthereumAddress(): R;
      toBeValidTransactionHash(): R;
    }
  }
  
  var testUtils: {
    restoreConsole: () => void;
    suppressConsole: () => void;
    wait: (ms?: number) => Promise<void>;
    mockAddress: (suffix?: string) => string;
    mockTxHash: (suffix?: string) => string;
  };
}

// Custom Jest matchers
expect.extend({
  toBeValidEthereumAddress(received: string) {
    const isValid = /^0x[a-fA-F0-9]{40}$/.test(received);
    return {
      message: () => 
        `expected ${received} ${isValid ? 'not ' : ''}to be a valid Ethereum address`,
      pass: isValid,
    };
  },

  toBeValidTransactionHash(received: string) {
    const isValid = /^0x[a-fA-F0-9]{64}$/.test(received);
    return {
      message: () => 
        `expected ${received} ${isValid ? 'not ' : ''}to be a valid transaction hash`,
      pass: isValid,
    };
  }
});
