/**
 * Unit tests for AirdropService
 */

import { AirdropService } from '../../src/services/airdropService';
import { MockWeb3Service } from '../mocks/web3Mock';
import { validAirdropRequests } from '../fixtures/testData';
import * as fs from 'fs';
import * as path from 'path';

// Mock the Web3Service
jest.mock('../../src/services/web3Service', () => {
  const { MockWeb3Service } = require('../mocks/web3Mock');
  return {
    Web3Service: MockWeb3Service
  };
});

// Mock the SecretCodeService
jest.mock('../../src/services/secretCodeService', () => ({
  SecretCodeService: class MockSecretCodeService {
    validateSecretCode(code: string) {
      const validCodes = ['TestCode1', 'TestCode2', 'TestCode3'];
      return {
        isValid: validCodes.includes(code),
        message: validCodes.includes(code) ? 'Valid code' : 'Invalid secret code'
      };
    }

    generateTestCode(prefix?: string) {
      return `${prefix || 'TestCode'}${Math.random().toString(36).substr(2, 6)}`;
    }

    getConfiguredCodes() {
      return ['TestCode1', 'TestCode2', 'TestCode3'];
    }
  }
}));

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('AirdropService', () => {
  let airdropService: AirdropService;
  let mockWeb3Service: MockWeb3Service;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup fs mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('[]');
    mockFs.writeFileSync.mockImplementation();
    mockFs.mkdirSync.mockImplementation();

    airdropService = new AirdropService();
    
    // Get access to the mocked Web3Service instance
    mockWeb3Service = (airdropService as any).web3Service as MockWeb3Service;
  });

  describe('processAirdrop', () => {
    it('should successfully process a valid airdrop request', async () => {
      const request = validAirdropRequests.basic;
      
      const result = await airdropService.processAirdrop(request);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Dual airdrop sent successfully');
      expect(result.wxHOPRTransactionHash).toBeDefined();
      expect(result.xDaiTransactionHash).toBeDefined();
      expect(result.wxHOPRAmount).toBeDefined();
      expect(result.xDaiAmount).toBeDefined();
    });

    it('should reject request with invalid secret code', async () => {
      const request = {
        secretCode: 'InvalidCode',
        recipientAddress: validAirdropRequests.basic.recipientAddress
      };
      
      const result = await airdropService.processAirdrop(request);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid secret code');
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

    it('should prevent duplicate claims with the same secret code', async () => {
      const request = validAirdropRequests.basic;
      
      // First claim should succeed
      const firstResult = await airdropService.processAirdrop(request);
      expect(firstResult.success).toBe(true);
      
      // Second claim with same code should fail
      const secondResult = await airdropService.processAirdrop(request);
      expect(secondResult.success).toBe(false);
      expect(secondResult.message).toContain('already been used');
    });

    it('should handle Web3 service connection failure', async () => {
      mockWeb3Service.setConnected(false);
      
      const request = validAirdropRequests.basic;
      const result = await airdropService.processAirdrop(request);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unable to connect to Chiado network');
    });

    it('should handle insufficient balance', async () => {
      mockWeb3Service.setBalance('0');
      
      const request = validAirdropRequests.basic;
      const result = await airdropService.processAirdrop(request);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Airdrop failed');
    });

    it('should handle invalid recipient address format', async () => {
      const request = {
        secretCode: 'TestCode1',
        recipientAddress: 'invalid-address'
      };
      
      const result = await airdropService.processAirdrop(request);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Airdrop failed');
    });
  });

  describe('getServiceStatus', () => {
    it('should return service status when connected', async () => {
      const status = await airdropService.getServiceStatus();
      
      expect(status.isConnected).toBe(true);
      expect(status.accountAddress).toBeDefined();
      expect(status.balance).toContain('wxHOPR');
      expect(status.xDaiBalance).toContain('xDai');
      expect(typeof status.processedCount).toBe('number');
    });

    it('should handle disconnected state', async () => {
      mockWeb3Service.setConnected(false);
      
      const status = await airdropService.getServiceStatus();
      
      expect(status.isConnected).toBe(false);
      expect(status.accountAddress).toBeDefined(); // Address is still available even when disconnected
      expect(status.balance).toBe('0 wxHOPR');
      expect(status.xDaiBalance).toBe('0 xDai');
    });

    it('should handle Web3 service errors gracefully', async () => {
      // Mock Web3 service to throw an error
      jest.spyOn(mockWeb3Service, 'isConnected').mockRejectedValue(new Error('Network error'));
      
      const status = await airdropService.getServiceStatus();
      
      expect(status.isConnected).toBe(false);
      expect(status.balance).toBe('0 wxHOPR');
      expect(status.xDaiBalance).toBe('0 xDai');
    });
  });

  describe('generateTestCode', () => {
    it('should generate a test code with default prefix', () => {
      const testCode = airdropService.generateTestCode();
      
      expect(testCode).toMatch(/^TestCode[a-z0-9]{6}$/);
    });

    it('should generate a test code with custom prefix', () => {
      const customPrefix = 'MyPrefix';
      const testCode = airdropService.generateTestCode(customPrefix);
      
      expect(testCode).toMatch(new RegExp(`^${customPrefix}[a-z0-9]{6}$`));
    });
  });

  describe('getConfiguredCodes', () => {
    it('should return configured secret codes', () => {
      const codes = airdropService.getConfiguredCodes();
      
      expect(Array.isArray(codes)).toBe(true);
      expect(codes).toContain('TestCode1');
      expect(codes).toContain('TestCode2');
      expect(codes).toContain('TestCode3');
    });
  });

  describe('processed codes persistence', () => {
    it('should load processed codes from file on initialization', () => {
      const mockProcessedCodes = ['UsedCode1', 'UsedCode2'];
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockProcessedCodes));
      
      // Create new service instance to trigger loading
      const newService = new AirdropService();
      
      expect(mockFs.readFileSync).toHaveBeenCalled();
    });

    it('should create data directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      // Create new service instance to trigger directory creation
      new AirdropService();
      
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('data'),
        { recursive: true }
      );
    });

    it('should save processed codes after successful airdrop', async () => {
      const request = validAirdropRequests.basic;
      
      await airdropService.processAirdrop(request);
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('processed-codes.json'),
        expect.stringContaining(request.secretCode)
      );
    });

    it('should handle file system errors gracefully', () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File system error');
      });
      
      // Should not throw, just log a warning
      expect(() => new AirdropService()).not.toThrow();
    });
  });
});
