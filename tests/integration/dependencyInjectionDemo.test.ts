/**
 * Integration test demonstrating the benefits of dependency injection
 * 
 * This test shows how the new DI system improves:
 * - Composability: Easy to swap implementations
 * - Testing: Easy to mock specific dependencies 
 * - Maintainability: Clear dependency relationships
 */

import { AirdropController } from '../../src/controllers/airdropController';
import { TestHelpers } from '../utils/testHelpers';
import { DIContainer } from '../../src/container/DIContainer';
import { MockDatabaseService } from '../mocks/databaseMock';
import { MockWeb3Service } from '../mocks/web3Mock';

describe('Dependency Injection System Integration', () => {
  afterEach(() => {
    TestHelpers.cleanupTestContainer();
  });

  describe('Composability Benefits', () => {
    it('should allow easy swapping of service implementations', async () => {
      // Create a custom database service with different behavior
      const customDatabaseService = new MockDatabaseService();
      customDatabaseService.resetMockData();
      
      // Add a custom secret code
      const mockData = customDatabaseService.getMockData();
      mockData.secretCodes.push({
        id: 'custom-id',
        code: 'CustomTestCode',
        description: 'Custom test code for DI demo',
        is_active: true,
        max_uses: 5,
        current_uses: 0,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'integration-test'
      });

      // Create a custom Web3 service with specific behavior
      const customWeb3Service = new MockWeb3Service({
        balance: '5000000000000000000', // 5 tokens
        xDaiBalance: '3000000000000000000' // 3 xDai
      });

      // Inject these custom services
      const container = TestHelpers.setupTestContainerWithMocks({
        databaseService: customDatabaseService,
        web3Service: customWeb3Service
      });

      const controller = new AirdropController(container);

      // Test the controller with custom services
      const mockRequest = {
        body: {
          secretCode: 'CustomTestCode',
          recipientAddress: '0x' + '1'.repeat(40)
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-agent'),
        validationMeta: {
          validated: true,
          securityRisk: 'LOW' as const,
          timestamp: new Date().toISOString()
        }
      } as any;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;

      await controller.claimAirdrop(mockRequest, mockResponse);

      // Verify the custom services were used
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Dual airdrop sent successfully')
        })
      );

      // Verify the custom database was updated
      const updatedData = customDatabaseService.getMockData();
      expect(updatedData.codeUsage).toHaveLength(1);
      expect(updatedData.codeUsage[0].status).toBe('completed');
    });
  });

  describe('Testing Benefits', () => {
    it('should allow precise mocking of individual service methods', async () => {
      // Create a mock service that simulates specific failure scenarios
      const mockAirdropService = {
        processAirdrop: jest.fn(),
        generateTestSecretCode: jest.fn(),
        getDatabaseHealth: jest.fn(),
      };

      // Test scenario 1: Simulate network failure
      mockAirdropService.processAirdrop.mockResolvedValueOnce({
        success: false,
        message: 'Network connection failed'
      });

      let container = TestHelpers.setupTestContainerWithMocks({
        airdropService: mockAirdropService
      });

      let controller = new AirdropController(container);

      const mockRequest = {
        body: { secretCode: 'TestCode', recipientAddress: '0x123' },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-agent'),
        validationMeta: { validated: true, securityRisk: 'LOW' as const, timestamp: new Date().toISOString() }
      } as any;

      let mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;

      await controller.claimAirdrop(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(400);

      // Test scenario 2: Simulate successful transaction
      mockAirdropService.processAirdrop.mockResolvedValueOnce({
        success: true,
        message: 'Dual airdrop sent successfully',
        wxHOPRTransactionHash: '0x' + 'a'.repeat(64),
        xDaiTransactionHash: '0x' + 'b'.repeat(64),
        wxHOPRAmount: '10000000000000000',
        xDaiAmount: '10000000000000000'
      });

      // Reset mocks for clean test
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;

      await controller.claimAirdrop(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          wxHOPRTransactionHash: expect.stringMatching(/^0x[a-f0-9]{64}$/),
          xDaiTransactionHash: expect.stringMatching(/^0x[a-f0-9]{64}$/)
        })
      );
    });
  });

  describe('Maintainability Benefits', () => {
    it('should provide clear dependency relationships through the container', async () => {
      const container = TestHelpers.setupTestContainer();

      // Verify that all required services are available
      const services = container.getServices();
      
      expect(services.databaseService).toBeDefined();
      expect(services.secretCodeService).toBeDefined();
      expect(services.airdropService).toBeDefined();
      expect(services.web3Service).toBeDefined();

      // Verify that the container is properly initialized
      expect(container.isInitialized()).toBe(false); // Not initialized in test environment
      
      // Verify that services can be resolved individually
      const databaseService = container.resolve('databaseService');
      const airdropService = container.resolve('airdropService');
      
      expect(databaseService).toBeDefined();
      expect(airdropService).toBeDefined();
    });

    it('should allow easy service replacement for different environments', async () => {
      // Simulate a production-like container setup
      const prodContainer = new DIContainer();
      
      // Register services with production-like configurations
      prodContainer.register('databaseService', () => {
        // In production, this would be a real database service
        const mockDb = new MockDatabaseService();
        mockDb.resetMockData();
        return mockDb as any;
      });

      prodContainer.register('web3Service', () => {
        // In production, this would connect to real blockchain
        return new MockWeb3Service({
          balance: '1000000000000000000000', // 1000 tokens in production
          connected: true
        }) as any;
      });

      // Verify the container can create services
      const dbService = prodContainer.resolve('databaseService');
      const web3Service = prodContainer.resolve('web3Service');
      
      expect(dbService).toBeDefined();
      expect(web3Service).toBeDefined();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle service failures gracefully', async () => {
      // Create a container with a failing service
      const failingContainer = new DIContainer();
      
      failingContainer.register('databaseService', () => {
        throw new Error('Database connection failed');
      });

      // Verify that service resolution handles errors appropriately
      expect(() => {
        failingContainer.resolve('databaseService');
      }).toThrow('Database connection failed');
    });

    it('should provide proper health checking across all services', async () => {
      const container = TestHelpers.setupTestContainer();
      
      // Mock health check responses
      const mockDatabaseService = container.resolve('databaseService') as any;
      mockDatabaseService.healthCheck = jest.fn().mockResolvedValue({
        isHealthy: true,
        details: { connected: true, timestamp: new Date() }
      });

      const healthStatus = await container.healthCheck();
      
      expect(healthStatus.database.isHealthy).toBe(true);
      expect(healthStatus.services.initialized).toBe(false); // Not initialized in test
    });
  });
});
