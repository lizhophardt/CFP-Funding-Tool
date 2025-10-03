/**
 * Unit tests for SecretCodeService
 */

import { SecretCodeService } from '../../src/services/secretCodeService';
import { MockDatabaseService } from '../mocks/databaseMock';

describe('SecretCodeService', () => {
  let secretCodeService: SecretCodeService;
  let mockDatabaseService: MockDatabaseService;

  beforeEach(async () => {
    mockDatabaseService = new MockDatabaseService();
    await mockDatabaseService.connect();
    mockDatabaseService.resetMockData();
    secretCodeService = new SecretCodeService(mockDatabaseService as any);
  });

  afterEach(async () => {
    if (mockDatabaseService) {
      await mockDatabaseService.disconnect();
    }
  });

  describe('validateSecretCode', () => {
    it('should validate a valid secret code', async () => {
      const result = await secretCodeService.validateSecretCode('TestCode1');
      
      expect(result.isValid).toBe(true);
      expect(result.message).toContain('Secret code validation successful');
      expect(result.codeId).toBe('test-id-1');
    });

    it('should reject invalid secret code', async () => {
      const result = await secretCodeService.validateSecretCode('InvalidCode');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Invalid secret code');
      expect(result.codeId).toBeUndefined();
    });

    it('should reject empty secret code', async () => {
      const result = await secretCodeService.validateSecretCode('');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Secret code must be a non-empty string');
    });

    it('should reject non-string secret code', async () => {
      const result = await secretCodeService.validateSecretCode(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Secret code must be a non-empty string');
    });

    it('should reject code that has reached usage limit', async () => {
      const result = await secretCodeService.validateSecretCode('TestCode2'); // current_uses = max_uses = 1
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('This secret code has already been claimed');
    });

    it('should allow unlimited use codes', async () => {
      const result = await secretCodeService.validateSecretCode('TestCode3'); // max_uses = null
      
      expect(result.isValid).toBe(true);
      expect(result.remainingUses).toBeUndefined();
    });

    it('should calculate remaining uses correctly', async () => {
      const result = await secretCodeService.validateSecretCode('TestCode1'); // current_uses = 0, max_uses = 1
      
      expect(result.isValid).toBe(true);
      expect(result.remainingUses).toBe(1);
    });
  });

  describe('recordCodeUsage', () => {
    it('should record successful code usage', async () => {
      const usage = await secretCodeService.recordCodeUsage(
        'test-id-1',
        '0x' + '1'.repeat(40),
        {
          wxhoprTransactionHash: '0x' + 'a'.repeat(64),
          xdaiTransactionHash: '0x' + 'b'.repeat(64),
          wxhoprAmountWei: '1000000000000000000',
          xdaiAmountWei: '1000000000000000000'
        },
        {
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          status: 'completed'
        }
      );

      expect(usage).toHaveProperty('id');
      expect(usage.code_id).toBe('test-id-1');
      expect(usage.recipient_address).toBe('0x' + '1'.repeat(40));
      expect(usage.status).toBe('completed');
      expect(usage.wxhopr_transaction_hash).toBe('0x' + 'a'.repeat(64));
    });

    it('should record failed code usage', async () => {
      const usage = await secretCodeService.recordCodeUsage(
        'test-id-1',
        '0x' + '2'.repeat(40),
        {},
        {
          status: 'failed',
          errorMessage: 'Transaction failed'
        }
      );

      expect(usage.status).toBe('failed');
      expect(usage.error_message).toBe('Transaction failed');
    });
  });

  describe('hasRecipientUsedCode', () => {
    it('should return false for new recipient', async () => {
      const hasUsed = await secretCodeService.hasRecipientUsedCode('0x' + '9'.repeat(40));
      expect(hasUsed).toBe(false);
    });

    it('should return true for recipient who has used a code', async () => {
      // Record a usage first
      await secretCodeService.recordCodeUsage(
        'test-id-1',
        '0x' + '1'.repeat(40),
        {},
        { status: 'completed' }
      );

      const hasUsed = await secretCodeService.hasRecipientUsedCode('0x' + '1'.repeat(40));
      expect(hasUsed).toBe(true);
    });

    it('should return false for recipient with only failed attempts', async () => {
      // Record a failed usage
      await secretCodeService.recordCodeUsage(
        'test-id-1',
        '0x' + '2'.repeat(40),
        {},
        { status: 'failed' }
      );

      const hasUsed = await secretCodeService.hasRecipientUsedCode('0x' + '2'.repeat(40));
      expect(hasUsed).toBe(false);
    });
  });

  describe('createSecretCode', () => {
    it('should create a new secret code', async () => {
      const newCode = await secretCodeService.createSecretCode(
        'NewCode123',
        'Test code',
        3
      );

      expect(newCode).toBeDefined();
      expect(newCode).toHaveProperty('code');
      expect(newCode).toHaveProperty('description');
      expect(newCode).toHaveProperty('max_uses');
      expect(newCode).toHaveProperty('current_uses');
      expect(newCode.is_active).toBe(true);
    });

    it('should create unlimited use code', async () => {
      const newCode = await secretCodeService.createSecretCode(
        'UnlimitedCode',
        'Unlimited uses',
        null
      );

      expect(newCode).toHaveProperty('max_uses', null);
    });
  });

  describe('getActiveCodesWithStats', () => {
    it('should return active codes with statistics', async () => {
      const codes = await secretCodeService.getActiveCodesWithStats();

      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThan(0);

      const firstCode = codes[0];
      expect(firstCode).toHaveProperty('code');
      expect(firstCode).toHaveProperty('successful_uses');
      expect(firstCode).toHaveProperty('failed_uses');
      expect(firstCode).toHaveProperty('total_usage_records');
    });
  });

  describe('generateTestCode', () => {
    it('should generate test code with default prefix', () => {
      const testCode = secretCodeService.generateTestCode();
      expect(testCode).toMatch(/^TestCode[a-z0-9]{6}$/);
    });

    it('should generate test code with custom prefix', () => {
      const testCode = secretCodeService.generateTestCode('Custom');
      expect(testCode).toMatch(/^Custom[a-z0-9]{6}$/);
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status', async () => {
      const health = await secretCodeService.getHealthStatus();
      
      expect(health.isHealthy).toBe(true);
      expect(health.details).toHaveProperty('connected');
      expect(health.details).toHaveProperty('timestamp');
    });
  });
});
