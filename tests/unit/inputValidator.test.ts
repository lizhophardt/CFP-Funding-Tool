/**
 * Unit tests for InputValidator
 */

import { InputValidator } from '../../src/utils/inputValidator';
import { maliciousPayloads, validAirdropRequests, invalidAirdropRequests } from '../fixtures/testData';

describe('InputValidator', () => {
  describe('validate', () => {
    describe('airdropRequest validation', () => {
      it('should validate a correct airdrop request', () => {
        const result = InputValidator.validate(validAirdropRequests.basic, 'airdropRequest');
        
        expect(result.isValid).toBe(true);
        expect(result.sanitizedData).toBeDefined();
        expect(result.sanitizedData.secretCode).toBe(validAirdropRequests.basic.secretCode);
        expect(result.sanitizedData.recipientAddress).toBe(validAirdropRequests.basic.recipientAddress);
        expect(result.securityRisk).toBe('LOW');
      });

      it('should validate airdrop request with special characters in secret code', () => {
        const result = InputValidator.validate(validAirdropRequests.withSpecialChars, 'airdropRequest');
        
        expect(result.isValid).toBe(true);
        expect(result.sanitizedData).toBeDefined();
      });

      it('should reject request with missing secret code', () => {
        const result = InputValidator.validate(
          { recipientAddress: validAirdropRequests.basic.recipientAddress },
          'airdropRequest'
        );
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Secret code is required');
      });

      it('should reject request with missing recipient address', () => {
        const result = InputValidator.validate(
          { secretCode: validAirdropRequests.basic.secretCode },
          'airdropRequest'
        );
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Recipient address is required');
      });

      it('should reject request with invalid address format', () => {
        const result = InputValidator.validate(invalidAirdropRequests.invalidAddressFormat, 'airdropRequest');
        
        expect(result.isValid).toBe(false);
        expect(result.errors?.some(error => error.includes('Invalid Ethereum address format'))).toBe(true);
      });

      it('should reject request with address too short', () => {
        const result = InputValidator.validate(invalidAirdropRequests.addressTooShort, 'airdropRequest');
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Ethereum address must be exactly 42 characters');
      });

      it('should reject request with empty secret code', () => {
        const result = InputValidator.validate(invalidAirdropRequests.emptySecretCode, 'airdropRequest');
        
        expect(result.isValid).toBe(false);
        expect(result.errors?.some(error => error.includes('not allowed to be empty'))).toBe(true);
      });

      it('should reject request with oversized secret code', () => {
        const result = InputValidator.validate(invalidAirdropRequests.oversizedSecretCode, 'airdropRequest');
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Secret code too long (max 100 characters)');
      });
    });

    describe('security threat detection', () => {
      it('should detect XSS attempts', () => {
        maliciousPayloads.xssPayloads.forEach(payload => {
          const result = InputValidator.validate(
            { secretCode: payload, recipientAddress: validAirdropRequests.basic.recipientAddress },
            'airdropRequest'
          );
          
          expect(result.isValid).toBe(false);
          expect(result.securityRisk).toMatch(/MEDIUM|HIGH/);
          // Either schema validation or security scan should catch it
          expect(result.errors?.[0]).toMatch(/Security threat detected|invalid characters/i);
        });
      });

      it('should detect SQL injection attempts', () => {
        maliciousPayloads.sqlInjectionPayloads.forEach(payload => {
          const result = InputValidator.validate(
            { secretCode: payload, recipientAddress: validAirdropRequests.basic.recipientAddress },
            'airdropRequest'
          );
          
          expect(result.isValid).toBe(false);
          expect(result.securityRisk).toMatch(/MEDIUM|HIGH/);
          // Either schema validation or security scan should catch it
          expect(result.errors?.[0]).toMatch(/Security threat detected|invalid characters/i);
        });
      });

      it('should detect command injection attempts', () => {
        maliciousPayloads.commandInjectionPayloads.forEach(payload => {
          const result = InputValidator.validate(
            { secretCode: payload, recipientAddress: validAirdropRequests.basic.recipientAddress },
            'airdropRequest'
          );
          
          expect(result.isValid).toBe(false);
          expect(result.securityRisk).toMatch(/MEDIUM|HIGH/);
          // Either schema validation or security scan should catch it
          expect(result.errors?.[0]).toMatch(/Security threat detected|invalid characters/i);
        });
      });
    });
  });

  describe('validateEthereumAddress', () => {
    it('should validate correct Ethereum addresses', () => {
      const validAddresses = [
        '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1',
        '0x1234567890123456789012345678901234567890',
        '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
      ];

      validAddresses.forEach(address => {
        const result = InputValidator.validateEthereumAddress(address);
        expect(result.isValid).toBe(true);
        expect(result.sanitizedData).toBe(address.toLowerCase());
        expect(result.securityRisk).toBe('LOW');
      });
    });

    it('should reject invalid Ethereum addresses', () => {
      const invalidAddresses = [
        '0x123', // Too short
        '0x' + 'a'.repeat(41), // Too long
        '0x' + 'g'.repeat(40), // Invalid characters
        'not_an_address' // Completely invalid
      ];

      invalidAddresses.forEach(address => {
        const result = InputValidator.validateEthereumAddress(address);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid Ethereum address format');
      });
    });

    it('should detect suspicious address patterns', () => {
      const suspiciousAddresses = [
        '0x0000000000000000000000000000000000000000', // All zeros
        '0xffffffffffffffffffffffffffffffffffffffff', // All F's
        '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef', // Test pattern
        '0x' + '1'.repeat(40) // Too many repeated characters
      ];

      suspiciousAddresses.forEach(address => {
        const result = InputValidator.validateEthereumAddress(address);
        expect(result.isValid).toBe(false);
        expect(result.securityRisk).toBe('HIGH');
        expect(result.errors).toContain('Suspicious address pattern detected');
      });
    });
  });

  describe('validateQueryParams', () => {
    it('should validate correct query parameters', () => {
      const validParams = {
        limit: 10,
        offset: 0,
        sort: 'asc',
        format: 'json'
      };

      const result = InputValidator.validateQueryParams(validParams);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData).toEqual(validParams);
    });

    it('should reject invalid query parameters', () => {
      const invalidParams = {
        limit: -1, // Invalid limit
        sort: 'invalid', // Invalid sort value
        format: 'xml' // Valid format
      };

      const result = InputValidator.validateQueryParams(invalidParams);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle empty query parameters', () => {
      const result = InputValidator.validateQueryParams({});
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData).toEqual({});
    });
  });

  describe('logSecurityEvent', () => {
    it('should log high risk security events as errors', () => {
      const event = InputValidator.logSecurityEvent(
        'TEST_SECURITY_EVENT',
        { maliciousData: '<script>alert("xss")</script>' },
        'HIGH',
        { ip: '127.0.0.1' }
      );

      // Test the returned event structure instead of console output
      expect(event.type).toBe('INPUT_VALIDATION_FAILURE');
      expect(event.risk).toBe('HIGH');
      expect(event.eventType).toBe('TEST_SECURITY_EVENT');
      expect(event.data).toEqual({
        dataTypes: {
          maliciousData: 'string' // Data types are logged for security
        },
        keys: ['maliciousData']
      });
      expect(event.client).toEqual({ ip: '127.0.0.1' });
      expect(event.timestamp).toBeDefined();
    });
  });
});
