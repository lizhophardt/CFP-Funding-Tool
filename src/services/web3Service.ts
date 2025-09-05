import Web3 from 'web3';
import { config } from '../config';
import { SecurityErrorHandler, ErrorType } from '../utils/errorHandler';

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

export class Web3Service {
  private web3: Web3;
  private account: any;
  private tokenContract: any;

  constructor() {
    this.web3 = new Web3(config.gnosisRpcUrl);
    this.account = this.web3.eth.accounts.privateKeyToAccount('0x' + config.privateKey);
    this.web3.eth.accounts.wallet.add(this.account);
    this.tokenContract = new this.web3.eth.Contract(ERC20_ABI, config.wxHoprTokenAddress);
  }

  async getBalance(): Promise<string> {
    try {
      const balance = await this.tokenContract.methods.balanceOf(this.account.address).call();
      // Use Web3's fromWei to properly handle decimals (wxHOPR has 18 decimals like ETH)
      return this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      SecurityErrorHandler.throwSecureError(
        ErrorType.NETWORK_ERROR,
        `Failed to get wxHOPR balance: ${error}`,
        'Unable to retrieve token balance'
      );
    }
  }

  async getXDaiBalance(): Promise<string> {
    try {
      const balance = await this.web3.eth.getBalance(this.account.address);
      return this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      SecurityErrorHandler.throwSecureError(
        ErrorType.NETWORK_ERROR,
        `Failed to get xDai balance: ${error}`,
        'Unable to retrieve native balance'
      );
    }
  }

  async sendDualTransaction(recipientAddress: string, wxHoprAmountWei: string, xDaiAmountWei: string): Promise<{wxHoprTxHash: string, xDaiTxHash: string}> {
    try {
      console.log(`🔍 WEB3 ADDRESS VALIDATION:`);
      console.log(`   📍 Address: "${recipientAddress}"`);
      console.log(`   📏 Length: ${recipientAddress.length}`);
      console.log(`   🔍 isAddress result: ${this.web3.utils.isAddress(recipientAddress)}`);
      
      // Validate recipient address
      if (!this.web3.utils.isAddress(recipientAddress)) {
        console.log(`❌ Address validation failed!`);
        SecurityErrorHandler.throwSecureError(
          ErrorType.VALIDATION,
          `Invalid recipient address: ${recipientAddress}`,
          'Invalid wallet address format'
        );
      }
      
      console.log(`✅ Address validation passed!`);

      // Check if we have enough wxHOPR token balance
      const tokenBalance = await this.tokenContract.methods.balanceOf(this.account.address).call();
      const wxHoprAmountBigInt = BigInt(wxHoprAmountWei);
      const tokenBalanceBigInt = BigInt(tokenBalance);

      if (tokenBalanceBigInt < wxHoprAmountBigInt) {
        SecurityErrorHandler.throwSecureError(
          ErrorType.INSUFFICIENT_BALANCE,
          `Insufficient wxHOPR balance: need ${wxHoprAmountWei} but have ${tokenBalance}`,
          'Insufficient token balance for airdrop'
        );
      }

      // Check native xDai balance
      const nativeBalance = await this.web3.eth.getBalance(this.account.address);
      const gasPrice = await this.web3.eth.getGasPrice();
      
      // Increase gas price by 20% to ensure transaction goes through
      const adjustedGasPrice = (BigInt(gasPrice) * BigInt(120)) / BigInt(100);
      
      // Estimate gas for token transfer
      const transferData = this.tokenContract.methods.transfer(recipientAddress, wxHoprAmountWei).encodeABI();
      const tokenGasEstimate = await this.web3.eth.estimateGas({
        from: this.account.address,
        to: config.wxHoprTokenAddress,
        data: transferData
      });

      // Estimate gas for native xDai transfer
      const xDaiGasEstimate = await this.web3.eth.estimateGas({
        from: this.account.address,
        to: recipientAddress,
        value: xDaiAmountWei
      });

      // Calculate total gas costs using adjusted gas price
      const tokenGasCost = adjustedGasPrice * BigInt(tokenGasEstimate);
      const xDaiGasCost = adjustedGasPrice * BigInt(xDaiGasEstimate);
      const totalGasCost = tokenGasCost + xDaiGasCost;
      const xDaiAmountBigInt = BigInt(xDaiAmountWei);
      const totalXDaiNeeded = totalGasCost + xDaiAmountBigInt;

      if (BigInt(nativeBalance) < totalXDaiNeeded) {
        const needed = this.web3.utils.fromWei(totalXDaiNeeded.toString(), 'ether');
        const available = this.web3.utils.fromWei(nativeBalance, 'ether');
        SecurityErrorHandler.throwSecureError(
          ErrorType.INSUFFICIENT_BALANCE,
          `Insufficient xDai balance. Need ${needed} xDai but only have ${available}`,
          'Insufficient native balance for transaction fees'
        );
      }

      // Send wxHOPR token transfer transaction first
      const tokenTransaction = {
        from: this.account.address,
        to: config.wxHoprTokenAddress,
        data: transferData,
        gas: tokenGasEstimate,
        gasPrice: adjustedGasPrice.toString()
      };

      const signedTokenTransaction = await this.web3.eth.accounts.signTransaction(
        tokenTransaction,
        '0x' + config.privateKey
      );

      if (!signedTokenTransaction.rawTransaction) {
        SecurityErrorHandler.throwSecureError(
          ErrorType.TRANSACTION_FAILED,
          'Failed to sign wxHOPR token transaction - no raw transaction returned',
          'Transaction signing failed'
        );
      }

      const tokenReceipt = await this.web3.eth.sendSignedTransaction(signedTokenTransaction.rawTransaction);
      console.log(`✅ wxHOPR token transfer successful: ${tokenReceipt.transactionHash}`);

      // Send native xDai transfer transaction
      const xDaiTransaction = {
        from: this.account.address,
        to: recipientAddress,
        value: xDaiAmountWei,
        gas: xDaiGasEstimate,
        gasPrice: adjustedGasPrice.toString()
      };

      const signedXDaiTransaction = await this.web3.eth.accounts.signTransaction(
        xDaiTransaction,
        '0x' + config.privateKey
      );

      if (!signedXDaiTransaction.rawTransaction) {
        SecurityErrorHandler.throwSecureError(
          ErrorType.TRANSACTION_FAILED,
          'Failed to sign xDai transaction - no raw transaction returned',
          'Transaction signing failed'
        );
      }

      const xDaiReceipt = await this.web3.eth.sendSignedTransaction(signedXDaiTransaction.rawTransaction);
      console.log(`✅ xDai transfer successful: ${xDaiReceipt.transactionHash}`);

      return {
        wxHoprTxHash: tokenReceipt.transactionHash.toString(),
        xDaiTxHash: xDaiReceipt.transactionHash.toString()
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
      await this.web3.eth.getBlockNumber();
      return true;
    } catch (error) {
      return false;
    }
  }

  getAccountAddress(): string {
    return this.account.address;
  }
}
