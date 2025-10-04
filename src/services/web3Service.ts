import { createWalletClient, createPublicClient, http, fallback, parseEther, formatEther, getContract, parseUnits, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { gnosis } from 'viem/chains';
import { config } from '../config';
import { SecurityErrorHandler, ErrorType } from '../utils/errorHandler';
import { Web3AddressValidator } from '../utils/web3AddressValidator';
import { logger } from '../utils/logger';

// ERC-20 ABI for token transfers
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  }
];

/**
 * Web3Service handles all blockchain interactions for the airdrop system.
 * 
 * This service manages:
 * - Connection to Gnosis Chain RPC
 * - wxHOPR token contract interactions
 * - xDai (native token) transfers
 * - Balance checking and transaction management
 * - Gas estimation and transaction signing
 * 
 * @example
 * ```typescript
 * const web3Service = new Web3Service();
 * const isConnected = await web3Service.isConnected();
 * 
 * if (isConnected) {
 *   const balance = await web3Service.getTokenBalance();
 *   console.log(`Current balance: ${balance} wxHOPR`);
 * }
 * ```
 */
export class Web3Service {
  private publicClient: any;
  private walletClient: any;
  private account: any;
  private tokenContract: any;

  /**
   * Creates a new Web3Service instance and initializes blockchain connection.
   * 
   * Automatically:
   * - Connects to Gnosis Chain RPC endpoints with fallback support
   * - Loads the private key from configuration
   * - Initializes the wxHOPR token contract
   * - Creates wallet and public clients with automatic RPC failover
   */
  constructor() {
    // Ensure private key has correct format (remove 0x if present, then add it back)
    const cleanPrivateKey = config.privateKey.replace(/^0x/, '');
    this.account = privateKeyToAccount(`0x${cleanPrivateKey}` as `0x${string}`);
    
    // Log account initialization
    logger.web3('info', 'Web3Service account initialized', {
      accountAddress: this.account.address,
      privateKeyLength: cleanPrivateKey.length
    });
    
    // Log the RPC endpoints being used
    logger.web3('info', 'Initializing Web3Service with fallback RPC endpoints', {
      primaryRpc: config.gnosisRpcUrl,
      totalEndpoints: config.gnosisRpcUrls.length,
      endpoints: config.gnosisRpcUrls
    });
    
    // Create fallback transport with multiple RPC endpoints
    const fallbackTransport = fallback(
      config.gnosisRpcUrls.map(url => http(url)),
      {
        rank: true, // Enable automatic ranking based on latency and stability
        retryCount: 3, // Retry failed requests up to 3 times
        retryDelay: 150 // 150ms delay between retries
      }
    );
    
    this.publicClient = createPublicClient({
      chain: gnosis,
      transport: fallbackTransport
    });

    this.walletClient = createWalletClient({
      chain: gnosis,
      transport: fallbackTransport,
      account: this.account
    });

    this.tokenContract = getContract({
      address: config.wxHoprTokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      client: this.publicClient
    });
  }

  async getBalance(): Promise<string> {
    try {
      logger.web3('info', 'Attempting to get wxHOPR balance', {
        tokenAddress: config.wxHoprTokenAddress,
        accountAddress: this.account.address
      });
      
      const balance = await this.tokenContract.read.balanceOf([this.account.address]);
      
      logger.web3('info', 'wxHOPR balance retrieved successfully', {
        rawBalance: balance.toString(),
        accountAddress: this.account.address
      });
      
      // Use Viem's formatEther to properly handle decimals (wxHOPR has 18 decimals like ETH)
      // Ensure balance is properly converted to BigInt
      const balanceBigInt = BigInt(balance.toString());
      const formattedBalance = formatEther(balanceBigInt);
      
      logger.web3('info', 'wxHOPR balance formatted', {
        formattedBalance,
        accountAddress: this.account.address
      });
      
      return formattedBalance;
    } catch (error) {
      logger.web3('error', 'Failed to get wxHOPR balance', {
        error: error instanceof Error ? error.message : error,
        tokenAddress: config.wxHoprTokenAddress,
        accountAddress: this.account.address
      });
      
      SecurityErrorHandler.throwSecureError(
        ErrorType.NETWORK_ERROR,
        `Failed to get wxHOPR balance: ${error}`,
        'Unable to retrieve token balance'
      );
    }
  }

  async getXDaiBalance(): Promise<string> {
    try {
      logger.web3('info', 'Attempting to get xDai balance', {
        accountAddress: this.account.address
      });
      
      const balance = await this.publicClient.getBalance({
        address: this.account.address
      });
      
      const formattedBalance = formatEther(balance);
      
      logger.web3('info', 'xDai balance retrieved successfully', {
        rawBalance: balance.toString(),
        formattedBalance,
        accountAddress: this.account.address
      });
      
      return formattedBalance;
    } catch (error) {
      logger.web3('error', 'Failed to get xDai balance', {
        error: error instanceof Error ? error.message : error,
        accountAddress: this.account.address
      });
      
      SecurityErrorHandler.throwSecureError(
        ErrorType.NETWORK_ERROR,
        `Failed to get xDai balance: ${error}`,
        'Unable to retrieve native balance'
      );
    }
  }

  async sendDualTransaction(recipientAddress: string, wxHoprAmountWei: string, xDaiAmountWei: string): Promise<{wxHoprTxHash: string, xDaiTxHash: string}> {
    try {
      logger.web3('info', 'Enhanced Web3 address validation starting', { recipientAddress });
      
      // Use enhanced address validator with security checks
      const addressValidation = Web3AddressValidator.validateForSecurity(
        recipientAddress, 
        'dual_transaction_recipient'
      );
      
      if (!addressValidation.isValid) {
        logger.web3('error', 'Enhanced address validation failed', {
          error: addressValidation.error,
          address: recipientAddress
        });
        SecurityErrorHandler.throwSecureError(
          ErrorType.VALIDATION,
          `Invalid recipient address: ${addressValidation.error}`,
          'Invalid wallet address format'
        );
      }
      
      // Use checksummed address for the transaction
      const validatedAddress = addressValidation.checksumAddress!;
      logger.web3('info', 'Enhanced address validation passed', {
        original: recipientAddress,
        checksummed: validatedAddress,
        securityLevel: addressValidation.securityLevel
      });

      // Check if we have enough wxHOPR token balance
      const tokenBalance = await this.tokenContract.read.balanceOf([this.account.address]);
      const wxHoprAmountBigInt = BigInt(wxHoprAmountWei);
      // tokenBalance is already a BigInt from Viem
      const tokenBalanceBigInt = BigInt(tokenBalance.toString());

      if (tokenBalanceBigInt < wxHoprAmountBigInt) {
        SecurityErrorHandler.throwSecureError(
          ErrorType.INSUFFICIENT_BALANCE,
          `Insufficient wxHOPR balance: need ${wxHoprAmountWei} but have ${tokenBalance}`,
          'Insufficient token balance for airdrop'
        );
      }

      // Check native xDai balance
      const nativeBalance = await this.publicClient.getBalance({
        address: this.account.address
      });
      const gasPrice = await this.publicClient.getGasPrice();
      
      // Increase gas price by 20% to ensure transaction goes through
      const adjustedGasPrice = (BigInt(gasPrice) * BigInt(120)) / BigInt(100);
      
      // Estimate gas for token transfer
      const tokenGasEstimate = await this.publicClient.estimateContractGas({
        address: config.wxHoprTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [validatedAddress as `0x${string}`, BigInt(wxHoprAmountWei)],
        account: this.account.address
      });

      // Estimate gas for native xDai transfer
      const xDaiGasEstimate = await this.publicClient.estimateGas({
        account: this.account.address,
        to: recipientAddress as `0x${string}`,
        value: BigInt(xDaiAmountWei)
      });

      // Calculate total gas costs using adjusted gas price
      const tokenGasCost = adjustedGasPrice * BigInt(tokenGasEstimate);
      const xDaiGasCost = adjustedGasPrice * BigInt(xDaiGasEstimate);
      const totalGasCost = tokenGasCost + xDaiGasCost;
      const xDaiAmountBigInt = BigInt(xDaiAmountWei);
      const totalXDaiNeeded = totalGasCost + xDaiAmountBigInt;

      if (BigInt(nativeBalance) < totalXDaiNeeded) {
        const needed = formatEther(totalXDaiNeeded);
        const available = formatEther(nativeBalance);
        SecurityErrorHandler.throwSecureError(
          ErrorType.INSUFFICIENT_BALANCE,
          `Insufficient xDai balance. Need ${needed} xDai but only have ${available}`,
          'Insufficient native balance for transaction fees'
        );
      }

      // Send wxHOPR token transfer transaction first
      const tokenHash = await this.walletClient.writeContract({
        address: config.wxHoprTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [validatedAddress as `0x${string}`, BigInt(wxHoprAmountWei)],
        gas: tokenGasEstimate,
        gasPrice: adjustedGasPrice
      });

      const tokenReceipt = await this.publicClient.waitForTransactionReceipt({
        hash: tokenHash
      });
      logger.web3('info', 'wxHOPR token transfer successful', {
        transactionHash: tokenReceipt.transactionHash,
        recipient: validatedAddress,
        amount: wxHoprAmountWei
      });

      // Send native xDai transfer transaction
      const xDaiHash = await this.walletClient.sendTransaction({
        to: validatedAddress as `0x${string}`,
        value: BigInt(xDaiAmountWei),
        gas: xDaiGasEstimate,
        gasPrice: adjustedGasPrice
      });

      const xDaiReceipt = await this.publicClient.waitForTransactionReceipt({
        hash: xDaiHash
      });
      logger.web3('info', 'xDai transfer successful', {
        transactionHash: xDaiReceipt.transactionHash,
        recipient: validatedAddress,
        amount: xDaiAmountWei
      });

      return {
        wxHoprTxHash: tokenReceipt.transactionHash,
        xDaiTxHash: xDaiReceipt.transactionHash
      };
    } catch (error) {
      // If it's already a secure error, re-throw it
      if (error instanceof Error && (
        error.message.includes('Unable to') || 
        error.message.includes('Invalid') || 
        error.message.includes('Insufficient')
      )) {
        throw error;
      }
      
      // Otherwise, wrap it in a secure error
      SecurityErrorHandler.throwSecureError(
        ErrorType.TRANSACTION_FAILED,
        `Failed to send dual transaction: ${error}`,
        'Transaction processing failed'
      );
    }
  }

  // Keep the old method for backward compatibility, but mark as deprecated
  async sendTransaction(recipientAddress: string, amountWei: string): Promise<string> {
    const result = await this.sendDualTransaction(recipientAddress, amountWei, config.xDaiAirdropAmountWei);
    return result.wxHoprTxHash;
  }

  async isConnected(): Promise<boolean> {
    try {
      const blockNumber = await this.publicClient.getBlockNumber();
      logger.web3('info', 'Web3 connection successful', {
        blockNumber: blockNumber.toString(),
        accountAddress: this.account.address
      });
      return true;
    } catch (error) {
      logger.web3('error', 'Web3 connection failed', {
        error: error instanceof Error ? error.message : error,
        accountAddress: this.account.address,
        rpcUrls: config.gnosisRpcUrls
      });
      return false;
    }
  }

  getAccountAddress(): string {
    return this.account.address;
  }
}
