/**
 * Enhanced Web3 Address Validation Utility
 * Provides comprehensive Ethereum address validation with checksum support
 */

import { isAddress, getAddress, isHex } from 'viem';

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
   * Comprehensive Ethereum address validation
   */
  static validateAddress(address: string): AddressValidationResult {
    const warnings: string[] = [];
    
    try {
      // Basic null/undefined check
      if (!address || typeof address !== 'string') {
        return {
          isValid: false,
          error: 'Address is required and must be a string'
        };
      }

      // Trim whitespace
      const trimmedAddress = address.trim();
      
      // Length check
      if (trimmedAddress.length !== 42) {
        return {
          isValid: false,
          error: `Invalid address length: expected 42 characters, got ${trimmedAddress.length}`
        };
      }

      // Must start with 0x
      if (!trimmedAddress.startsWith('0x')) {
        return {
          isValid: false,
          error: 'Address must start with 0x'
        };
      }

      // Check if it's a valid hex string
      if (!isHex(trimmedAddress)) {
        return {
          isValid: false,
          error: 'Address contains invalid hexadecimal characters'
        };
      }

      // Use Viem's isAddress function for comprehensive validation
      if (!isAddress(trimmedAddress)) {
        return {
          isValid: false,
          error: 'Invalid Ethereum address format'
        };
      }

      // Check for suspicious patterns
      const suspiciousCheck = this.checkSuspiciousPatterns(trimmedAddress);
      if (!suspiciousCheck.isValid) {
        return suspiciousCheck;
      }

      // Generate checksum address
      const checksumAddress = getAddress(trimmedAddress);
      const normalizedAddress = trimmedAddress.toLowerCase();

      // Check if the provided address has correct checksum (if mixed case)
      let isChecksum = false;
      if (trimmedAddress !== normalizedAddress && trimmedAddress !== trimmedAddress.toUpperCase()) {
        // Mixed case - check if it matches checksum
        isChecksum = trimmedAddress === checksumAddress;
        if (!isChecksum) {
          warnings.push('Address checksum is incorrect but format is valid');
        }
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
        error: 'Address has too many zeros (potential vanity address abuse)'
      };
    }

    if (uniqueChars < 4) {
      return {
        isValid: false,
        error: 'Address has too few unique characters (suspicious pattern)'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate multiple addresses at once
   */
  static validateAddresses(addresses: string[]): { [address: string]: AddressValidationResult } {
    const results: { [address: string]: AddressValidationResult } = {};
    
    for (const address of addresses) {
      results[address] = this.validateAddress(address);
    }
    
    return results;
  }

  /**
   * Get a normalized (lowercase) version of a valid address
   */
  static normalizeAddress(address: string): string | null {
    const validation = this.validateAddress(address);
    return validation.isValid ? validation.normalizedAddress! : null;
  }

  /**
   * Get a checksummed version of a valid address
   */
  static checksumAddress(address: string): string | null {
    const validation = this.validateAddress(address);
    return validation.isValid ? validation.checksumAddress! : null;
  }

  /**
   * Check if two addresses are the same (case-insensitive)
   */
  static addressesEqual(address1: string, address2: string): boolean {
    const norm1 = this.normalizeAddress(address1);
    const norm2 = this.normalizeAddress(address2);
    
    return norm1 !== null && norm2 !== null && norm1 === norm2;
  }

  /**
   * Validate and format address for display
   */
  static formatAddressForDisplay(address: string): { formatted: string; isValid: boolean; warnings?: string[] } {
    const validation = this.validateAddress(address);
    
    if (!validation.isValid) {
      return {
        formatted: address,
        isValid: false
      };
    }

    // Return checksummed address for display
    return {
      formatted: validation.checksumAddress!,
      isValid: true,
      warnings: validation.warnings
    };
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
