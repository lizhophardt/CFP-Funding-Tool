import { Web3Service } from './web3Service';
import { SecretCodeService } from './secretCodeService';
import { DatabaseService } from './databaseService';
import { config } from '../config';
import { AirdropRequest, AirdropResponse } from '../types';
import { logger } from '../utils/logger';

export class AirdropService {
  private web3Service: Web3Service;
  private secretCodeService: SecretCodeService;

  constructor(databaseService: DatabaseService) {
    this.web3Service = new Web3Service();
    this.secretCodeService = new SecretCodeService(databaseService);
  }


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

      // Check if Web3 service is connected
      const isConnected = await this.web3Service.isConnected();
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
      const transactionResult = await this.web3Service.sendDualTransaction(
        request.recipientAddress,
        config.airdropAmountWei,
        config.xDaiAirdropAmountWei
      );

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
      const isConnected = await this.web3Service.isConnected();
      const accountAddress = this.web3Service.getAccountAddress();
      const wxHoprBalance = isConnected ? await this.web3Service.getBalance() : '0';
      const xDaiBalance = isConnected ? await this.web3Service.getXDaiBalance() : '0';
      
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
