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
    try {
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

      // Validate token address before creating contract
      if (!config.wxHoprTokenAddress || !config.wxHoprTokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error(`Invalid wxHOPR token address: ${config.wxHoprTokenAddress}`);
      }

      try {
        // Store the contract info for direct publicClient usage
        this.tokenContract = {
          address: config.wxHoprTokenAddress,
          abi: ERC20_ABI,
          publicClient: this.publicClient
        };

        logger.web3('info', 'Token contract initialized successfully', {
          tokenAddress: config.wxHoprTokenAddress,
          hasPublicClient: !!this.tokenContract.publicClient,
          contractAddress: this.tokenContract.address
        });

      } catch (contractError) {
        logger.web3('error', 'Failed to initialize token contract', {
          error: contractError instanceof Error ? contractError.message : contractError,
          stack: contractError instanceof Error ? contractError.stack : undefined,
          tokenAddress: config.wxHoprTokenAddress,
          publicClientExists: !!this.publicClient,
          accountExists: !!this.account,
          accountAddress: this.account?.address || 'undefined',
          viemVersion: 'unknown', // We can't easily get this
          chainId: 100 // Gnosis Chain
        });
        // Set tokenContract to null to make the failure explicit
        this.tokenContract = null;
        throw new Error(`Token contract initialization failed: ${contractError instanceof Error ? contractError.message : contractError}`);
      }

      logger.web3('info', 'Web3Service initialized successfully', {
        tokenAddress: config.wxHoprTokenAddress,
        accountAddress: this.account.address
      });

    } catch (error) {
      logger.web3('error', 'Failed to initialize Web3Service', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        tokenAddress: config.wxHoprTokenAddress,
        privateKeyProvided: !!config.privateKey
      });
      throw error;
    }
  }

  async getBalance(): Promise<string> {
    try {
      // Defensive check for tokenContract with direct publicClient approach
      if (!this.tokenContract || !this.tokenContract.publicClient) {
        throw new Error('Token contract not initialized. Web3Service constructor failed to create the contract instance.');
      }

      logger.web3('info', 'Attempting to get wxHOPR balance with direct publicClient', {
        tokenAddress: config.wxHoprTokenAddress,
        accountAddress: this.account.address
      });
      
      const balance = await this.publicClient.readContract({
        address: config.wxHoprTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [this.account.address]
      });
      
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

      // Defensive check for tokenContract with direct publicClient approach
      if (!this.tokenContract || !this.tokenContract.publicClient) {
        throw new Error('Token contract not initialized. Web3Service constructor failed to create the contract instance.');
      }

      // Check if we have enough wxHOPR token balance
      const tokenBalance = await this.publicClient.readContract({
        address: config.wxHoprTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [this.account.address]
      });
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

      logger.web3('info', 'wxHOPR transaction sent', {
        transactionHash: tokenHash,
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

      logger.web3('info', 'xDai transaction sent', {
        transactionHash: xDaiHash,
        recipient: validatedAddress,
        amount: xDaiAmountWei
      });

      // Try to wait for receipts, but don't fail if they timeout
      let tokenReceiptSuccess = false;
      let xDaiReceiptSuccess = false;

      try {
        logger.web3('info', 'Waiting for wxHOPR transaction receipt', {
          transactionHash: tokenHash
        });
        
        const tokenReceipt = await this.publicClient.waitForTransactionReceipt({
          hash: tokenHash,
          timeout: 60_000, // 1 minute timeout - reduced for better UX
          retryCount: 2,
          retryDelay: 2_000
        });
        
        logger.web3('info', 'wxHOPR token transfer confirmed', {
          transactionHash: tokenReceipt.transactionHash,
          blockNumber: tokenReceipt.blockNumber
        });
        tokenReceiptSuccess = true;
      } catch (receiptError) {
        logger.web3('warn', 'wxHOPR transaction receipt timeout - transaction likely still processing', {
          transactionHash: tokenHash,
          error: receiptError instanceof Error ? receiptError.message : receiptError
        });
      }

      try {
        logger.web3('info', 'Waiting for xDai transaction receipt', {
          transactionHash: xDaiHash
        });
        
        const xDaiReceipt = await this.publicClient.waitForTransactionReceipt({
          hash: xDaiHash,
          timeout: 60_000, // 1 minute timeout - reduced for better UX
          retryCount: 2,
          retryDelay: 2_000
        });
        
        logger.web3('info', 'xDai transfer confirmed', {
          transactionHash: xDaiReceipt.transactionHash,
          blockNumber: xDaiReceipt.blockNumber
        });
        xDaiReceiptSuccess = true;
      } catch (receiptError) {
        logger.web3('warn', 'xDai transaction receipt timeout - transaction likely still processing', {
          transactionHash: xDaiHash,
          error: receiptError instanceof Error ? receiptError.message : receiptError
        });
      }

      // Log transaction completion
      logger.web3('info', 'Dual transaction completed', {
        tokenHash,
        xDaiHash,
        confirmationsReceived: tokenReceiptSuccess && xDaiReceiptSuccess
      });

      return {
        wxHoprTxHash: tokenHash,
        xDaiTxHash: xDaiHash
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
      
      // Log the error for debugging
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.web3('error', 'Dual transaction failed', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Otherwise, wrap it in a secure error with more detail
      SecurityErrorHandler.throwSecureError(
        ErrorType.TRANSACTION_FAILED,
        `Failed to send dual transaction: ${errorMessage}`,
        `Transaction failed: ${errorMessage}`
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

  /**
   * Check if the Web3Service is properly initialized
   * @returns true if all components are initialized, false otherwise
   */
  isInitialized(): boolean {
    try {
      return !!(
        this.account &&
        this.publicClient &&
        this.walletClient &&
        this.tokenContract &&
        this.tokenContract.publicClient
      );
    } catch (error) {
      logger.web3('error', 'Error checking Web3Service initialization', {
        error: error instanceof Error ? error.message : error
      });
      return false;
    }
  }
}
