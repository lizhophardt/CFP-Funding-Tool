import { Web3Service } from './web3Service';
import { SecretCodeService } from './secretCodeService';
import { DatabaseService } from './databaseService';
import { config } from '../config';
import { AirdropRequest, AirdropResponse } from '../types';
import { logger } from '../utils/logger';

/**
 * AirdropService handles the core business logic for processing token airdrops.
 * 
 * This service orchestrates the validation of secret codes, recipient addresses,
 * and blockchain transactions for dual token airdrops (wxHOPR + xDai).
 * 
 * @example
 * ```typescript
 * const service = new AirdropService(databaseService, web3Service, secretCodeService);
 * const result = await service.processAirdrop({
 *   secretCode: "MySecret123",
 *   recipientAddress: "0x742d35Cc6634C0532925a3b8D8B9B3a8d8b8B3a8"
 * });
 * ```
 */
export class AirdropService {
  private web3Service: Web3Service;
  private secretCodeService: SecretCodeService;
  private databaseService: DatabaseService;

  /**
   * Creates a new AirdropService instance with dependency injection.
   * 
   * @param databaseService - Database service for persistent storage
   * @param web3Service - Web3 service for blockchain interactions
   * @param secretCodeService - Secret code service for validation
   */
  constructor(
    databaseService: DatabaseService,
    web3Service?: Web3Service,
    secretCodeService?: SecretCodeService
  ) {
    this.databaseService = databaseService;
    // For backward compatibility, create services if not provided
    this.web3Service = web3Service || new Web3Service();
    this.secretCodeService = secretCodeService || new SecretCodeService(databaseService);
  }


  /**
   * Processes an airdrop request by validating the secret code and sending tokens.
   * 
   * This method performs comprehensive validation including:
   * - Secret code validation against the database
   * - Recipient address format validation
   * - Duplicate claim prevention
   * - Blockchain balance checks
   * - Dual token transfer (wxHOPR + xDai)
   * 
   * @param request - The airdrop request containing secret code and recipient address
   * @param metadata - Optional metadata including client IP and user agent
   * @returns Promise resolving to airdrop response with success status and transaction details
   * 
   * @example
   * ```typescript
   * const result = await airdropService.processAirdrop({
   *   secretCode: "DontTellUncleSam",
   *   recipientAddress: "0x742d35Cc6634C0532925a3b8D8B9B3a8d8b8B3a8"
   * }, {
   *   ipAddress: "192.168.1.1",
   *   userAgent: "Mozilla/5.0..."
   * });
   * 
   * if (result.success) {
   *   console.log('Airdrop successful:', result.wxHOPRTransactionHash);
   * }
   * ```
   */
  async processAirdrop(request: AirdropRequest, metadata?: { ipAddress?: string; userAgent?: string }): Promise<AirdropResponse> {
    let codeId: string | undefined;
    
    try {
      // Validate recipient address format first
      if (!request.recipientAddress || typeof request.recipientAddress !== 'string') {
        return {
          success: false,
          message: 'Recipient address is required'
        };
      }

      // Check if this recipient has already received an airdrop
      const hasUsedCode = await this.secretCodeService.hasRecipientUsedCode(request.recipientAddress);
      if (hasUsedCode) {
        return {
          success: false,
          message: 'This address has already received an airdrop'
        };
      }

      // Validate secret code against database
      const codeValidation = await this.secretCodeService.validateSecretCode(request.secretCode);
      if (!codeValidation.isValid) {
        return {
          success: false,
          message: codeValidation.message
        };
      }

      codeId = codeValidation.codeId;

      // Check if Web3 service is properly initialized and connected
      let isConnected = false;
      try {
        // First check if the service is properly initialized
        if (!(this.web3Service as any).isInitialized || !(this.web3Service as any).isInitialized()) {
          throw new Error('Web3Service is not properly initialized');
        }
        
        isConnected = await this.web3Service.isConnected();
      } catch (web3Error) {
        logger.airdrop('error', 'Web3Service connection check failed', {
          error: web3Error instanceof Error ? web3Error.message : web3Error,
          stack: web3Error instanceof Error ? web3Error.stack : undefined
        });
        // Treat as not connected and record the failure
        isConnected = false;
      }
      
      if (!isConnected) {
        // Record failed attempt
        if (codeId) {
          await this.secretCodeService.recordCodeUsage(
            codeId,
            request.recipientAddress,
            {},
            {
              ...metadata,
              status: 'failed',
              errorMessage: 'Unable to connect to Gnosis network'
            }
          );
        }
        return {
          success: false,
          message: 'Unable to connect to Gnosis network'
        };
      }

      // Send the dual airdrop transaction (wxHOPR + xDai)
      let transactionResult;
      try {
        transactionResult = await this.web3Service.sendDualTransaction(
          request.recipientAddress,
          config.airdropAmountWei,
          config.xDaiAirdropAmountWei
        );
      } catch (transactionError) {
        logger.airdrop('error', 'Transaction failed', {
          error: transactionError instanceof Error ? transactionError.message : transactionError,
          stack: transactionError instanceof Error ? transactionError.stack : undefined,
          recipient: request.recipientAddress
        });
        
        // Record failed attempt
        if (codeId) {
          await this.secretCodeService.recordCodeUsage(
            codeId,
            request.recipientAddress,
            {},
            {
              ...metadata,
              status: 'failed',
              errorMessage: transactionError instanceof Error ? transactionError.message : String(transactionError)
            }
          );
        }
        
        return {
          success: false,
          message: `Transaction failed: ${transactionError instanceof Error ? transactionError.message : String(transactionError)}`
        };
      }

      // Record successful usage in database
      if (codeId) {
        await this.secretCodeService.recordCodeUsage(
          codeId,
          request.recipientAddress,
          {
            wxhoprTransactionHash: transactionResult.wxHoprTxHash,
            xdaiTransactionHash: transactionResult.xDaiTxHash,
            wxhoprAmountWei: config.airdropAmountWei,
            xdaiAmountWei: config.xDaiAirdropAmountWei
          },
          {
            ...metadata,
            status: 'completed'
          }
        );
      }

      return {
        success: true,
        message: 'Dual airdrop sent successfully (wxHOPR + xDai)',
        wxHOPRTransactionHash: transactionResult.wxHoprTxHash,
        xDaiTransactionHash: transactionResult.xDaiTxHash,
        wxHOPRAmount: config.airdropAmountWei,
        xDaiAmount: config.xDaiAirdropAmountWei
      };

    } catch (error) {
      logger.airdrop('error', 'Airdrop processing failed', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });

      // Record failed attempt
      if (codeId) {
        try {
          await this.secretCodeService.recordCodeUsage(
            codeId,
            request.recipientAddress,
            {},
            {
              ...metadata,
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : String(error)
            }
          );
        } catch (recordError) {
          logger.airdrop('error', 'Failed to record failed attempt', {
            error: recordError instanceof Error ? recordError.message : recordError
          });
        }
      }

      return {
        success: false,
        message: `Airdrop failed: ${error instanceof Error ? error.message : error}`
      };
    }
  }

  async getServiceStatus(): Promise<{
    isConnected: boolean;
    accountAddress: string;
    balance: string;
    xDaiBalance: string;
    processedCount: number;
    databaseHealth: boolean;
  }> {
    try {
      let isConnected = false;
      let accountAddress = '';
      let wxHoprBalance = '0';
      let xDaiBalance = '0';
      
      try {
        // Check if Web3Service is properly initialized first
        if (!(this.web3Service as any).isInitialized || !(this.web3Service as any).isInitialized()) {
          throw new Error('Web3Service is not properly initialized');
        }
        
        isConnected = await this.web3Service.isConnected();
        accountAddress = this.web3Service.getAccountAddress();
        
        if (isConnected) {
          try {
            wxHoprBalance = await this.web3Service.getBalance();
          } catch (balanceError) {
            logger.config('warn', 'Failed to get wxHOPR balance', {
              error: balanceError instanceof Error ? balanceError.message : balanceError
            });
          }
          
          try {
            xDaiBalance = await this.web3Service.getXDaiBalance();
          } catch (xDaiError) {
            logger.config('warn', 'Failed to get xDai balance', {
              error: xDaiError instanceof Error ? xDaiError.message : xDaiError
            });
          }
        }
      } catch (web3Error) {
        logger.config('error', 'Web3Service error in status check', {
          error: web3Error instanceof Error ? web3Error.message : web3Error,
          stack: web3Error instanceof Error ? web3Error.stack : undefined
        });
      }
      
      // Get database statistics
      let processedCount = 0;
      let databaseHealth = false;
      
      try {
        const healthStatus = await this.secretCodeService.getHealthStatus();
        databaseHealth = healthStatus.isHealthy;
        
        if (databaseHealth) {
          const codes = await this.secretCodeService.getActiveCodesWithStats();
          processedCount = codes.reduce((total, code) => total + (code as any).successful_uses, 0);
        }
      } catch (dbError) {
        logger.config('error', 'Failed to get database statistics', {
          error: dbError instanceof Error ? dbError.message : dbError
        });
      }

      return {
        isConnected,
        accountAddress,
        balance: `${wxHoprBalance} wxHOPR`,
        xDaiBalance: `${xDaiBalance} xDai`,
        processedCount,
        databaseHealth
      };
    } catch (error) {
      return {
        isConnected: false,
        accountAddress: '',
        balance: '0 wxHOPR',
        xDaiBalance: '0 xDai',
        processedCount: 0,
        databaseHealth: false
      };
    }
  }

  // Method to generate a test secret code for development purposes
  generateTestCode(prefix?: string): string {
    return this.secretCodeService.generateTestCode(prefix);
  }

  // Method to get active secret codes with stats (for admin/development purposes)
  async getActiveCodesWithStats() {
    return this.secretCodeService.getActiveCodesWithStats();
  }

  // Method to create a new secret code (for admin purposes)
  async createSecretCode(code: string, description?: string, maxUses: number | null = 1) {
    return this.secretCodeService.createSecretCode(code, description, maxUses);
  }

  // Method to get database health status
  async getDatabaseHealth() {
    return this.secretCodeService.getHealthStatus();
  }
}
