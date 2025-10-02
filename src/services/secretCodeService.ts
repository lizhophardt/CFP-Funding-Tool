import { DatabaseService } from './databaseService';
import { SecretCode, CodeUsage, CodeValidationResult } from '../types';
import { logger } from '../utils/logger';

export class SecretCodeService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * Validates a secret code against the database and checks usage limits
   * @param secretCode - The secret code to validate
   * @returns CodeValidationResult indicating if the code is valid and can be used
   */
  async validateSecretCode(secretCode: string): Promise<CodeValidationResult> {
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

      // Query database for the secret code
      const result = await this.dbService.query(
        `SELECT id, code, max_uses, current_uses, is_active 
         FROM secret_codes 
         WHERE code = $1 AND is_active = true`,
        [cleanCode]
      );

      if (result.rows.length === 0) {
        logger.security('warn', 'Invalid secret code attempted', { code: cleanCode });
        return {
          isValid: false,
          message: 'Invalid secret code'
        };
      }

      const codeData = result.rows[0];

      // Check if code has remaining uses
      if (codeData.max_uses !== null && codeData.current_uses >= codeData.max_uses) {
        logger.security('warn', 'Secret code usage limit exceeded', { 
          code: cleanCode,
          current_uses: codeData.current_uses,
          max_uses: codeData.max_uses
        });
        return {
          isValid: false,
          message: 'Secret code has been used the maximum number of times'
        };
      }

      const remainingUses = codeData.max_uses === null 
        ? undefined 
        : codeData.max_uses - codeData.current_uses;

      return {
        isValid: true,
        message: 'Secret code validation successful',
        codeId: codeData.id,
        remainingUses
      };
    } catch (error) {
      logger.config('error', 'Secret code validation error', { 
        error: error instanceof Error ? error.message : error 
      });
      return {
        isValid: false,
        message: `Secret code validation error: ${error}`
      };
    }
  }

  /**
   * Record the usage of a secret code
   * @param codeId - The ID of the secret code being used
   * @param recipientAddress - The recipient's wallet address
   * @param transactionData - Transaction details
   * @param metadata - Additional metadata (IP, user agent, etc.)
   */
  async recordCodeUsage(
    codeId: string, 
    recipientAddress: string,
    transactionData: {
      wxhoprTransactionHash?: string;
      xdaiTransactionHash?: string;
      wxhoprAmountWei?: string;
      xdaiAmountWei?: string;
    },
    metadata: {
      ipAddress?: string;
      userAgent?: string;
      status?: 'completed' | 'failed' | 'pending';
      errorMessage?: string;
      [key: string]: any;
    } = {}
  ): Promise<CodeUsage> {
    try {
      const result = await this.dbService.query(
        `INSERT INTO code_usage (
          code_id, recipient_address, wxhopr_transaction_hash, xdai_transaction_hash,
          wxhopr_amount_wei, xdai_amount_wei, ip_address, user_agent, 
          status, error_message, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          codeId,
          recipientAddress,
          transactionData.wxhoprTransactionHash || null,
          transactionData.xdaiTransactionHash || null,
          transactionData.wxhoprAmountWei || null,
          transactionData.xdaiAmountWei || null,
          metadata.ipAddress || null,
          metadata.userAgent || null,
          metadata.status || 'completed',
          metadata.errorMessage || null,
          JSON.stringify(metadata)
        ]
      );

      logger.airdrop('info', 'Secret code usage recorded', {
        codeId,
        recipientAddress,
        status: metadata.status || 'completed'
      });

      return result.rows[0];
    } catch (error) {
      logger.config('error', 'Failed to record code usage', {
        codeId,
        recipientAddress,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Get all active secret codes with usage statistics
   * Note: In production, this should be restricted to admin users
   */
  async getActiveCodesWithStats(): Promise<SecretCode[]> {
    try {
      const result = await this.dbService.query(`
        SELECT * FROM active_codes_with_stats
        ORDER BY created_at DESC
      `);

      return result.rows;
    } catch (error) {
      logger.config('error', 'Failed to get active codes', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Create a new secret code
   * @param code - The secret code string
   * @param description - Optional description
   * @param maxUses - Maximum number of uses (null for unlimited)
   */
  async createSecretCode(
    code: string, 
    description?: string, 
    maxUses: number | null = 1
  ): Promise<SecretCode> {
    try {
      const result = await this.dbService.query(
        `INSERT INTO secret_codes (code, description, max_uses, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [code.trim(), description || null, maxUses, 'api']
      );

      logger.config('info', 'Secret code created', { code, maxUses });
      return result.rows[0];
    } catch (error) {
      if (error instanceof Error && error.message.includes('unique constraint')) {
        throw new Error('Secret code already exists');
      }
      logger.config('error', 'Failed to create secret code', {
        code,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Deactivate a secret code
   * @param codeId - The ID of the code to deactivate
   */
  async deactivateSecretCode(codeId: string): Promise<void> {
    try {
      await this.dbService.query(
        `UPDATE secret_codes SET is_active = false, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [codeId]
      );

      logger.config('info', 'Secret code deactivated', { codeId });
    } catch (error) {
      logger.config('error', 'Failed to deactivate secret code', {
        codeId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Get usage history for a specific code
   * @param codeId - The ID of the secret code
   */
  async getCodeUsageHistory(codeId: string): Promise<CodeUsage[]> {
    try {
      const result = await this.dbService.query(
        `SELECT * FROM code_usage 
         WHERE code_id = $1 
         ORDER BY used_at DESC`,
        [codeId]
      );

      return result.rows;
    } catch (error) {
      logger.config('error', 'Failed to get code usage history', {
        codeId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Check if a recipient has already used any code
   * @param recipientAddress - The recipient's wallet address
   */
  async hasRecipientUsedCode(recipientAddress: string): Promise<boolean> {
    try {
      const result = await this.dbService.query(
        `SELECT COUNT(*) as count FROM code_usage 
         WHERE recipient_address = $1 AND status = 'completed'`,
        [recipientAddress.toLowerCase()]
      );

      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      logger.config('error', 'Failed to check recipient usage', {
        recipientAddress,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
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

  /**
   * Get database health status
   */
  async getHealthStatus(): Promise<{ isHealthy: boolean; details: any }> {
    return this.dbService.healthCheck();
  }
}
