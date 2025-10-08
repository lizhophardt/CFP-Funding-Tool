/**
 * Simplified Address Validation Utility using Viem
 * Uses Viem's isAddress with additional security pattern checks
 */

import { isAddress, getAddress } from 'viem';

export interface AddressValidationResult {
  isValid: boolean;
  isChecksum?: boolean;
  normalizedAddress?: string;
  checksumAddress?: string;
  error?: string;
  warnings?: string[];
}

export class Web3AddressValidator {
  /**
   * Simplified address validation using Viem's isAddress
   */
  static validateAddress(address: string): AddressValidationResult {
    try {
      // Basic null/undefined check
      if (!address || typeof address !== 'string') {
        return {
          isValid: false,
          error: 'Address is required and must be a string'
        };
      }

      const trimmedAddress = address.trim();

      // Use Viem's isAddress - it handles all format validation internally
      if (!isAddress(trimmedAddress)) {
        return {
          isValid: false,
          error: 'Invalid Ethereum address format'
        };
      }

      // Check for suspicious patterns (security feature)
      const suspiciousCheck = this.checkSuspiciousPatterns(trimmedAddress);
      if (!suspiciousCheck.isValid) {
        return suspiciousCheck;
      }

      // Generate checksum address and check if input was checksummed
      const checksumAddress = getAddress(trimmedAddress);
      const normalizedAddress = trimmedAddress.toLowerCase();
      const isChecksum = trimmedAddress === checksumAddress;
      
      const warnings: string[] = [];
      if (trimmedAddress !== normalizedAddress && !isChecksum) {
        warnings.push('Address checksum is incorrect but format is valid');
      }

      return {
        isValid: true,
        isChecksum,
        normalizedAddress,
        checksumAddress,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      return {
        isValid: false,
        error: `Address validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check for suspicious address patterns that might indicate attacks
   */
  private static checkSuspiciousPatterns(address: string): AddressValidationResult {
    const lowerAddress = address.toLowerCase();
    
    // Suspicious patterns that might indicate fake/test addresses
    const suspiciousPatterns = [
      {
        pattern: /^0x0+$/,
        message: 'Null address (all zeros) not allowed'
      },
      {
        pattern: /^0xf+$/i,
        message: 'All F address pattern detected'
      },
      {
        pattern: /(.)\1{15,}/,
        message: 'Too many repeated characters in address'
      },
      {
        pattern: /^0x(dead|beef|cafe|babe|face|feed|deed|fade|bad|add)/i,
        message: 'Common test address pattern detected'
      },
      {
        pattern: /^0x(1234|5678|9abc|def0|1111|2222|3333|4444|5555|6666|7777|8888|9999|aaaa|bbbb|cccc|dddd|eeee|ffff)/i,
        message: 'Sequential or repeated pattern detected'
      }
    ];

    for (const { pattern, message } of suspiciousPatterns) {
      if (pattern.test(lowerAddress)) {
        return {
          isValid: false,
          error: message
        };
      }
    }

    // Check for potential vanity address abuse (too many zeros or similar chars)
    const addressWithoutPrefix = lowerAddress.slice(2);
    const zeroCount = (addressWithoutPrefix.match(/0/g) || []).length;
    const uniqueChars = new Set(addressWithoutPrefix).size;
    
    if (zeroCount > 30) {
      return {
        isValid: false,
        error: 'Address has too many zeros, potential vanity address abuse'
      };
    }
    
    if (uniqueChars < 4) {
      return {
        isValid: false,
        error: 'Address has too few unique characters, suspicious pattern'
      };
    }

    return {
      isValid: true
    };
  }

  /**
   * Simple validation - just uses Viem's isAddress
   */
  static isValidAddress(address: string): boolean {
    if (!address || typeof address !== 'string') {
      return false;
    }
    return isAddress(address.trim());
  }

  /**
   * Security-focused validation with detailed logging
   */
  static validateForSecurity(address: string, context: string = 'unknown'): AddressValidationResult & { securityLevel: 'HIGH' | 'MEDIUM' | 'LOW' } {
    const validation = this.validateAddress(address);
    
    let securityLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    
    if (!validation.isValid) {
      securityLevel = 'HIGH'; // Invalid addresses are high security risk
      
      // Log security event
      const { logger } = require('./logger');
      logger.security('warn', 'ADDRESS VALIDATION SECURITY EVENT', {
        context,
        address: address?.substring(0, 10) + '...', // Partial address for logging
        error: validation.error,
        timestamp: new Date().toISOString(),
        securityLevel
      });
    } else if (validation.warnings && validation.warnings.length > 0) {
      securityLevel = 'MEDIUM'; // Valid but with warnings
      
      const { logger } = require('./logger');
      logger.validation('warn', 'ADDRESS VALIDATION WARNING', {
        context,
        address: validation.checksumAddress?.substring(0, 10) + '...',
        warnings: validation.warnings,
        timestamp: new Date().toISOString(),
        securityLevel
      });
    } else {
      // Valid address with no warnings
      const { logger } = require('./logger');
      logger.validation('info', 'ADDRESS VALIDATION SUCCESS', {
        context,
        address: validation.checksumAddress?.substring(0, 10) + '...',
        isChecksum: validation.isChecksum,
        timestamp: new Date().toISOString(),
        securityLevel
      });
    }

    return {
      ...validation,
      securityLevel
    };
  }
}