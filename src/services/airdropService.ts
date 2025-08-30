import { Web3Service } from './web3Service';
import { HashService } from './hashService';
import { config } from '../config';
import { AirdropRequest, AirdropResponse } from '../types';

export class AirdropService {
  private web3Service: Web3Service;
  private hashService: HashService;
  private processedHashes: Set<string> = new Set();

  constructor() {
    this.web3Service = new Web3Service();
    this.hashService = new HashService();
  }

  async processAirdrop(request: AirdropRequest): Promise<AirdropResponse> {
    try {
      // Validate hash format and check if it matches the preimage
      const hashValidation = this.hashService.validateHash(request.hash);
      if (!hashValidation.isValid) {
        return {
          success: false,
          message: hashValidation.message
        };
      }

      // Check if this hash has already been used
      const normalizedHash = request.hash.startsWith('0x') 
        ? request.hash.slice(2).toLowerCase() 
        : request.hash.toLowerCase();
      
      if (this.processedHashes.has(normalizedHash)) {
        return {
          success: false,
          message: 'This hash has already been used for an airdrop'
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

      // Mark this hash as processed
      this.processedHashes.add(normalizedHash);

      return {
        success: true,
        message: 'Dual airdrop sent successfully (wxHOPR + xDai)',
        transactionHash: transactionResult.wxHoprTxHash,
        xDaiTransactionHash: transactionResult.xDaiTxHash,
        amount: config.airdropAmountWei,
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
        processedCount: this.processedHashes.size
      };
    } catch (error) {
      return {
        isConnected: false,
        accountAddress: '',
        balance: '0 wxHOPR',
        xDaiBalance: '0 xDai',
        processedCount: this.processedHashes.size
      };
    }
  }

  // Method to generate a test hash for development purposes
  generateTestHash(preimage: string): string {
    return this.hashService.generateHashFromPreimage(preimage);
  }
}
