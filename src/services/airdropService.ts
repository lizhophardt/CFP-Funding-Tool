import { Web3Service } from './web3Service';
import { SecretCodeService } from './secretCodeService';
import { config } from '../config';
import { AirdropRequest, AirdropResponse } from '../types';

export class AirdropService {
  private web3Service: Web3Service;
  private secretCodeService: SecretCodeService;
  private processedCodes: Set<string> = new Set();

  constructor() {
    this.web3Service = new Web3Service();
    this.secretCodeService = new SecretCodeService();
  }

  async processAirdrop(request: AirdropRequest): Promise<AirdropResponse> {
    try {
      // Validate secret code
      const codeValidation = this.secretCodeService.validateSecretCode(request.secretCode);
      if (!codeValidation.isValid) {
        return {
          success: false,
          message: codeValidation.message
        };
      }

      // Check if this secret code has already been used
      const normalizedCode = request.secretCode.trim();
      
      if (this.processedCodes.has(normalizedCode)) {
        return {
          success: false,
          message: 'This secret code has already been used for an airdrop'
        };
      }

      // Validate recipient address format
      if (!request.recipientAddress || typeof request.recipientAddress !== 'string') {
        return {
          success: false,
          message: 'Recipient address is required'
        };
      }

      // Check if Web3 service is connected
      const isConnected = await this.web3Service.isConnected();
      if (!isConnected) {
        return {
          success: false,
          message: 'Unable to connect to Chiado network'
        };
      }

      // Send the dual airdrop transaction (wxHOPR + xDai)
      const transactionResult = await this.web3Service.sendDualTransaction(
        request.recipientAddress,
        config.airdropAmountWei,
        config.xDaiAirdropAmountWei
      );

      // Mark this secret code as processed
      this.processedCodes.add(normalizedCode);

      return {
        success: true,
        message: 'Dual airdrop sent successfully (wxHOPR + xDai)',
        wxHOPRTransactionHash: transactionResult.wxHoprTxHash,
        xDaiTransactionHash: transactionResult.xDaiTxHash,
        wxHOPRAmount: config.airdropAmountWei,
        xDaiAmount: config.xDaiAirdropAmountWei
      };

    } catch (error) {
      return {
        success: false,
        message: `Airdrop failed: ${error}`
      };
    }
  }

  async getServiceStatus(): Promise<{
    isConnected: boolean;
    accountAddress: string;
    balance: string;
    xDaiBalance: string;
    processedCount: number;
  }> {
    try {
      const isConnected = await this.web3Service.isConnected();
      const accountAddress = this.web3Service.getAccountAddress();
      const wxHoprBalance = isConnected ? await this.web3Service.getBalance() : '0';
      const xDaiBalance = isConnected ? await this.web3Service.getXDaiBalance() : '0';

      return {
        isConnected,
        accountAddress,
        balance: `${wxHoprBalance} wxHOPR`,
        xDaiBalance: `${xDaiBalance} xDai`,
        processedCount: this.processedCodes.size
      };
    } catch (error) {
      return {
        isConnected: false,
        accountAddress: '',
        balance: '0 wxHOPR',
        xDaiBalance: '0 xDai',
        processedCount: this.processedCodes.size
      };
    }
  }

  // Method to generate a test secret code for development purposes
  generateTestCode(prefix?: string): string {
    return this.secretCodeService.generateTestCode(prefix);
  }

  // Method to get configured secret codes for development purposes
  getConfiguredCodes(): string[] {
    return this.secretCodeService.getConfiguredCodes();
  }
}
