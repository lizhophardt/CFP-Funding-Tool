/**
 * Unit tests for AirdropService with Database Integration
 */

import { AirdropService } from '../../src/services/airdropService';
import { MockDatabaseService } from '../mocks/databaseMock';
import { validAirdropRequests } from '../fixtures/testData';

// Mock the Web3Service
jest.mock('../../src/services/web3Service', () => {
  return {
    Web3Service: jest.fn().mockImplementation(() => ({
      isConnected: jest.fn().mockResolvedValue(true),
      getAccountAddress: jest.fn().mockReturnValue('0x' + '1'.repeat(40)),
      getBalance: jest.fn().mockResolvedValue('1000'),
      getXDaiBalance: jest.fn().mockResolvedValue('1000'),
      sendDualTransaction: jest.fn().mockResolvedValue({
        wxHoprTxHash: '0x' + 'a'.repeat(64),
        xDaiTxHash: '0x' + 'b'.repeat(64)
      })
    }))
  };
});

describe('AirdropService with Database', () => {
  let airdropService: AirdropService;
  let mockDatabaseService: MockDatabaseService;
  let mockWeb3Service: any;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock database service
    mockDatabaseService = new MockDatabaseService();
    await mockDatabaseService.connect();
    mockDatabaseService.resetMockData();

    // Create service instance with mock database
    airdropService = new AirdropService(mockDatabaseService);
    
    // Get mock Web3Service instance
    mockWeb3Service = (airdropService as any).web3Service;
  });

  afterEach(async () => {
    if (mockDatabaseService) {
      await mockDatabaseService.disconnect();
    }
  });

  describe('processAirdrop', () => {
    it('should successfully process a valid airdrop request', async () => {
      const request = {
        secretCode: 'TestCode1',
        recipientAddress: '0x' + '1'.repeat(40)
      };
      
      const result = await airdropService.processAirdrop(request, {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      });
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Dual airdrop sent successfully');
      expect(result.wxHOPRTransactionHash).toBeDefined();
      expect(result.xDaiTransactionHash).toBeDefined();
      expect(result.wxHOPRAmount).toBeDefined();
      expect(result.xDaiAmount).toBeDefined();

      // Verify usage was recorded
      const mockData = mockDatabaseService.getMockData();
      expect(mockData.codeUsage.length).toBe(1);
      expect(mockData.codeUsage[0].recipient_address).toBe(request.recipientAddress);
      expect(mockData.codeUsage[0].status).toBe('completed');
    });

    it('should reject request with invalid secret code', async () => {
      const request = {
        secretCode: 'InvalidCode',
        recipientAddress: '0x' + '1'.repeat(40)
      };
      
      const result = await airdropService.processAirdrop(request);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid secret code');

      // Verify no usage was recorded
      const mockData = mockDatabaseService.getMockData();
      expect(mockData.codeUsage.length).toBe(0);
    });

    it('should reject request with missing recipient address', async () => {
      const request = {
        secretCode: 'TestCode1',
        recipientAddress: ''
      };
      
      const result = await airdropService.processAirdrop(request);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Recipient address is required');
    });

    it('should prevent duplicate claims by the same recipient', async () => {
      const request1 = {
        secretCode: 'TestCode1',
        recipientAddress: '0x' + '1'.repeat(40)
      };
      
      // First claim should succeed
      const firstResult = await airdropService.processAirdrop(request1);
      expect(firstResult.success).toBe(true);
      
      // Second claim with different code but same address should fail
      const request2 = {
        secretCode: 'TestCode3',
        recipientAddress: '0x' + '1'.repeat(40)
      };
      
      const secondResult = await airdropService.processAirdrop(request2);
      expect(secondResult.success).toBe(false);
      expect(secondResult.message).toContain('This address has already received an airdrop');
    });

    it('should reject code that has reached usage limit', async () => {
      const request = {
        secretCode: 'TestCode2', // This code has current_uses = 1, max_uses = 1
        recipientAddress: '0x' + '2'.repeat(40)
      };
      
      const result = await airdropService.processAirdrop(request);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('This secret code has already been claimed');
    });

    it('should allow unlimited use codes', async () => {
      const request1 = {
        secretCode: 'TestCode3', // This code has max_uses = null (unlimited)
        recipientAddress: '0x' + '3'.repeat(40)
      };
      
      const firstResult = await airdropService.processAirdrop(request1);
      expect(firstResult.success).toBe(true);

      // Should allow another use with different recipient
      const request2 = {
        secretCode: 'TestCode3',
        recipientAddress: '0x' + '4'.repeat(40)
      };
      
      const secondResult = await airdropService.processAirdrop(request2);
      expect(secondResult.success).toBe(true);
    });

    it('should handle Web3 connection failure', async () => {
      // Mock Web3 connection failure
      mockWeb3Service.isConnected.mockResolvedValue(false);

      const request = {
        secretCode: 'TestCode1',
        recipientAddress: '0x' + '5'.repeat(40)
      };
      
      const result = await airdropService.processAirdrop(request);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unable to connect to Gnosis network');

      // Verify failed attempt was recorded
      const mockData = mockDatabaseService.getMockData();
      expect(mockData.codeUsage.length).toBe(1);
      expect(mockData.codeUsage[0].status).toBe('failed');
      expect(mockData.codeUsage[0].error_message).toContain('Unable to connect to Gnosis network');
    });

    it('should handle transaction failure', async () => {
      // Mock transaction failure
      mockWeb3Service.sendDualTransaction.mockRejectedValue(new Error('Transaction failed'));

      const request = {
        secretCode: 'TestCode1',
        recipientAddress: '0x' + '6'.repeat(40)
      };
      
      const result = await airdropService.processAirdrop(request);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Airdrop failed: Transaction failed');

      // Verify failed attempt was recorded
      const mockData = mockDatabaseService.getMockData();
      expect(mockData.codeUsage.length).toBe(1);
      expect(mockData.codeUsage[0].status).toBe('failed');
      expect(mockData.codeUsage[0].error_message).toBe('Transaction failed');
    });
  });

  describe('getServiceStatus', () => {
    it('should return service status with database health', async () => {
      const status = await airdropService.getServiceStatus();
      
      expect(status).toHaveProperty('isConnected');
      expect(status).toHaveProperty('accountAddress');
      expect(status).toHaveProperty('balance');
      expect(status).toHaveProperty('xDaiBalance');
      expect(status).toHaveProperty('processedCount');
      expect(status).toHaveProperty('databaseHealth');
      expect(status.databaseHealth).toBe(true);
    });

    it('should handle database connection failure', async () => {
      // Mock database disconnection
      await mockDatabaseService.disconnect();
      
      const status = await airdropService.getServiceStatus();
      
      expect(status.databaseHealth).toBe(false);
      expect(status.processedCount).toBe(0);
    });
  });

  describe('generateTestCode', () => {
    it('should generate a test code with default prefix', () => {
      const testCode = airdropService.generateTestCode();
      
      expect(testCode).toMatch(/^TestCode[a-z0-9]{6}$/);
    });

    it('should generate a test code with custom prefix', () => {
      const testCode = airdropService.generateTestCode('CustomPrefix');
      
      expect(testCode).toMatch(/^CustomPrefix[a-z0-9]{6}$/);
    });
  });

  describe('getActiveCodesWithStats', () => {
    it('should return active codes with usage statistics', async () => {
      const codes = await airdropService.getActiveCodesWithStats();
      
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThan(0);
      
      const firstCode = codes[0];
      expect(firstCode).toHaveProperty('id');
      expect(firstCode).toHaveProperty('code');
      expect(firstCode).toHaveProperty('is_active');
      expect(firstCode).toHaveProperty('successful_uses');
      expect(firstCode).toHaveProperty('failed_uses');
    });
  });

  describe('createSecretCode', () => {
    it('should create a new secret code', async () => {
      const newCode = await airdropService.createSecretCode('NewTestCode', 'Test description', 5);
      
      expect(newCode).toHaveProperty('id');
      expect(newCode.code).toBe('NewTestCode');
      expect(newCode.description).toBe('Test description');
      expect(newCode.max_uses).toBe(5);
    });
  });

  describe('getDatabaseHealth', () => {
    it('should return database health status', async () => {
      const health = await airdropService.getDatabaseHealth();
      
      expect(health).toHaveProperty('isHealthy');
      expect(health).toHaveProperty('details');
      expect(health.isHealthy).toBe(true);
    });
  });
});