import { config } from '../config';
import { ValidationResult } from '../types';

export class SecretCodeService {
  /**
   * Validates a secret code against the configured valid codes
   * @param secretCode - The secret code to validate
   * @returns ValidationResult indicating if the code is valid
   */
  validateSecretCode(secretCode: string): ValidationResult {
    try {
      // Validate secret code format
      if (!secretCode || typeof secretCode !== 'string') {
        return {
          isValid: false,
          message: 'Secret code must be a non-empty string'
        };
      }

      // Trim whitespace for comparison
      const cleanCode = secretCode.trim();
      
      if (cleanCode.length === 0) {
        return {
          isValid: false,
          message: 'Secret code cannot be empty or just whitespace'
        };
      }

      // Check if the secret code matches any of the configured valid codes
      for (const validCode of config.secretCodes) {
        if (validCode && validCode.trim() === cleanCode) {
          return {
            isValid: true,
            message: 'Secret code validation successful'
          };
        }
      }

      return {
        isValid: false,
        message: 'Invalid secret code'
      };
    } catch (error) {
      return {
        isValid: false,
        message: `Secret code validation error: ${error}`
      };
    }
  }

  /**
   * Get the list of configured secret codes (for testing/development)
   * Note: In production, this should be removed or restricted
   * @returns Array of configured secret codes
   */
  getConfiguredCodes(): string[] {
    return config.secretCodes.filter(code => code && code.trim().length > 0);
  }

  /**
   * Generate a random secret code for testing purposes
   * @param prefix - Optional prefix for the code
   * @returns A random secret code
   */
  generateTestCode(prefix: string = 'TestCode'): string {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${prefix}${randomSuffix}`;
  }
}
