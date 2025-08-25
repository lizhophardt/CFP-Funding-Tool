import crypto from 'crypto';
import { config } from '../config';
import { ValidationResult } from '../types';

export class HashService {
  /**
   * Validates a hash against any of the configured preimages
   * @param hash - The hash to validate (should be SHA-256 hex string)
   * @returns ValidationResult indicating if the hash is valid
   */
  validateHash(hash: string): ValidationResult {
    try {
      // Validate hash format (should be 64-character hex string for SHA-256)
      if (!hash || typeof hash !== 'string') {
        return {
          isValid: false,
          message: 'Hash must be a non-empty string'
        };
      }

      // Remove 0x prefix if present
      const cleanHash = hash.startsWith('0x') ? hash.slice(2) : hash;

      if (!cleanHash.match(/^[a-fA-F0-9]{64}$/)) {
        return {
          isValid: false,
          message: 'Hash must be a 64-character hexadecimal string (SHA-256)'
        };
      }

      // Check hash against all configured preimages
      for (const preimage of config.secretPreimages) {
        if (preimage) { // Skip empty preimages
          const expectedHash = this.generateHashFromPreimage(preimage);
          if (cleanHash.toLowerCase() === expectedHash.toLowerCase()) {
            return {
              isValid: true,
              message: 'Hash validation successful'
            };
          }
        }
      }

      return {
        isValid: false,
        message: 'Hash does not match any of the expected values'
      };
    } catch (error) {
      return {
        isValid: false,
        message: `Hash validation error: ${error}`
      };
    }
  }

  /**
   * Generates a SHA-256 hash from the given preimage
   * @param preimage - The preimage to hash
   * @returns The SHA-256 hash as a lowercase hex string
   */
  generateHashFromPreimage(preimage: string): string {
    return crypto.createHash('sha256').update(preimage, 'utf8').digest('hex');
  }

  /**
   * Utility method to generate a hash for testing purposes
   * @param preimage - The preimage to hash
   * @returns The SHA-256 hash as a hex string
   */
  static generateTestHash(preimage: string): string {
    return crypto.createHash('sha256').update(preimage, 'utf8').digest('hex');
  }
}
