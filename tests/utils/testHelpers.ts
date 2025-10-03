/**
 * Test helper utilities
 */

import request from 'supertest';
import { Application } from 'express';
import { DIContainer, setContainer, resetContainer } from '../../src/container/DIContainer';
import { createTestContainer, createTestContainerWithMocks } from './testContainer';

export class TestHelpers {
  /**
   * Create a mock Express app for testing with dependency injection
   */
  static async createTestApp(): Promise<Application> {
    // Set up test container before importing app
    const testContainer = createTestContainer();
    setContainer(testContainer);
    
    // Dynamically import the app to avoid side effects during import
    const { default: app } = await import('../../src/app');
    return app;
  }

  /**
   * Create a test app with custom mock services
   */
  static async createTestAppWithMocks(mocks: {
    databaseService?: any;
    web3Service?: any;
    secretCodeService?: any;
    airdropService?: any;
  }): Promise<Application> {
    // Set up test container with custom mocks
    const testContainer = createTestContainerWithMocks(mocks);
    setContainer(testContainer);
    
    // Dynamically import the app to avoid side effects during import
    const { default: app } = await import('../../src/app');
    return app;
  }

  /**
   * Setup test container (call before each test)
   */
  static setupTestContainer(): DIContainer {
    const testContainer = createTestContainer();
    setContainer(testContainer);
    return testContainer;
  }

  /**
   * Setup test container with custom mocks
   */
  static setupTestContainerWithMocks(mocks: {
    databaseService?: any;
    web3Service?: any;
    secretCodeService?: any;
    airdropService?: any;
  }): DIContainer {
    const testContainer = createTestContainerWithMocks(mocks);
    setContainer(testContainer);
    return testContainer;
  }

  /**
   * Cleanup test container (call after each test)
   */
  static cleanupTestContainer(): void {
    resetContainer();
  }

  /**
   * Create a test request - returns supertest instance
   */
  static createRequest(app: Application) {
    return request(app);
  }

  /**
   * Generate valid test data for airdrop requests
   */
  static generateValidAirdropRequest() {
    return {
      secretCode: 'TestCode1',
      recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
    };
  }

  /**
   * Generate invalid test data for various attack scenarios
   */
  static generateInvalidAirdropRequests() {
    return {
      xssAttack: {
        secretCode: '<script>alert("xss")</script>',
        recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
      },
      sqlInjection: {
        secretCode: "'; DROP TABLE users; --",
        recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
      },
      invalidAddress: {
        secretCode: 'TestCode1',
        recipientAddress: 'invalid-address'
      },
      missingSecretCode: {
        recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
      },
      missingAddress: {
        secretCode: 'TestCode1'
      },
      emptyRequest: {},
      oversizedPayload: {
        secretCode: 'A'.repeat(10000),
        recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
      }
    };
  }

  /**
   * Generate mock Ethereum addresses
   */
  static generateMockAddresses(count: number = 5): string[] {
    const addresses: string[] = [];
    for (let i = 0; i < count; i++) {
      const suffix = i.toString().padStart(2, '0');
      addresses.push('0x' + suffix.repeat(20));
    }
    return addresses;
  }

  /**
   * Generate mock transaction hashes
   */
  static generateMockTxHashes(count: number = 5): string[] {
    const hashes: string[] = [];
    for (let i = 0; i < count; i++) {
      const suffix = i.toString().padStart(2, '0');
      hashes.push('0x' + suffix.repeat(32));
    }
    return hashes;
  }

  /**
   * Wait for async operations to complete
   */
  static wait(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Mock environment variables for testing
   */
  static mockEnvironment(overrides: Record<string, string> = {}) {
    const originalEnv = { ...process.env };
    
    const testEnv = {
      NODE_ENV: 'test',
      PORT: '3001',
      GNOSIS_RPC_URL: 'http://localhost:8545',
      PRIVATE_KEY: 'a'.repeat(64),
      SECRET_CODES: 'TestCode1,TestCode2,TestCode3',
      WXHOPR_TOKEN_ADDRESS: '0x' + '1'.repeat(40),
      AIRDROP_AMOUNT_WEI: '1000000000000000000',
      XDAI_AIRDROP_AMOUNT_WEI: '1000000000000000000',
      ...overrides
    };

    Object.assign(process.env, testEnv);

    // Return cleanup function
    return () => {
      process.env = originalEnv;
    };
  }

  /**
   * Create mock Web3 responses
   */
  static createMockWeb3Responses() {
    return {
      getBalance: jest.fn().mockResolvedValue('1000000000000000000'),
      sendTransaction: jest.fn().mockResolvedValue({
        transactionHash: '0x' + '1'.repeat(64)
      }),
      getTransactionReceipt: jest.fn().mockResolvedValue({
        status: true,
        transactionHash: '0x' + '1'.repeat(64)
      }),
      isConnected: jest.fn().mockResolvedValue(true)
    };
  }

  /**
   * Validate API response structure
   */
  static validateApiResponse(response: any, expectedFields: string[] = ['success']) {
    expectedFields.forEach(field => {
      expect(response).toHaveProperty(field);
    });
  }

  /**
   * Validate error response structure
   */
  static validateErrorResponse(response: any) {
    expect(response).toHaveProperty('success', false);
    expect(response).toHaveProperty('message');
    expect(typeof response.message).toBe('string');
  }

  /**
   * Validate success response structure
   */
  static validateSuccessResponse(response: any) {
    expect(response).toHaveProperty('success', true);
  }

  /**
   * Create a mock file system for testing
   */
  static createMockFileSystem() {
    const mockFs = {
      existsSync: jest.fn(),
      mkdirSync: jest.fn(),
      readFileSync: jest.fn(),
      writeFileSync: jest.fn(),
      rmSync: jest.fn()
    };

    return mockFs;
  }

  /**
   * Assert that a function throws with specific error message
   */
  static async expectToThrowAsync(
    fn: () => Promise<any>, 
    errorMessage?: string | RegExp
  ) {
    let error: Error | null = null;
    
    try {
      await fn();
    } catch (e) {
      error = e as Error;
    }
    
    expect(error).not.toBeNull();
    
    if (errorMessage) {
      if (typeof errorMessage === 'string') {
        expect(error?.message).toContain(errorMessage);
      } else {
        expect(error?.message).toMatch(errorMessage);
      }
    }
  }

  /**
   * Create mock request/response objects
   */
  static createMockExpressObjects() {
    const mockRequest = {
      body: {},
      params: {},
      query: {},
      headers: {},
      ip: '127.0.0.1',
      get: jest.fn(),
      validationMeta: {
        validated: true,
        securityRisk: 'LOW' as const,
        timestamp: new Date().toISOString()
      }
    };

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    };

    const mockNext = jest.fn();

    return { mockRequest, mockResponse, mockNext };
  }
}
