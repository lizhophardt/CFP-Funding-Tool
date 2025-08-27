import Web3 from 'web3';
import { config } from '../config';

export class Web3Service {
  private web3: Web3;
  private account: any;

  constructor() {
    this.web3 = new Web3(config.gnosisRpcUrl);
    this.account = this.web3.eth.accounts.privateKeyToAccount('0x' + config.privateKey);
    this.web3.eth.accounts.wallet.add(this.account);
  }

  async getBalance(): Promise<string> {
    try {
      const balance = await this.web3.eth.getBalance(this.account.address);
      return this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`);
    }
  }

  async sendTransaction(recipientAddress: string, amountWei: string): Promise<string> {
    try {
      console.log(`🔍 WEB3 ADDRESS VALIDATION:`);
      console.log(`   📍 Address: "${recipientAddress}"`);
      console.log(`   📏 Length: ${recipientAddress.length}`);
      console.log(`   🔍 isAddress result: ${this.web3.utils.isAddress(recipientAddress)}`);
      
      // Validate recipient address
      if (!this.web3.utils.isAddress(recipientAddress)) {
        console.log(`❌ Address validation failed!`);
        throw new Error('Invalid recipient address');
      }
      
      console.log(`✅ Address validation passed!`);

      // Check if we have enough balance
      const balance = await this.web3.eth.getBalance(this.account.address);
      const amountBigInt = BigInt(amountWei);
      const balanceBigInt = BigInt(balance);

      if (balanceBigInt < amountBigInt) {
        throw new Error('Insufficient balance for airdrop');
      }

      // Get gas price and estimate gas
      const gasPrice = await this.web3.eth.getGasPrice();
      const gasEstimate = await this.web3.eth.estimateGas({
        from: this.account.address,
        to: recipientAddress,
        value: amountWei
      });

      // Check if we have enough balance including gas fees
      const totalCost = amountBigInt + (BigInt(gasPrice) * BigInt(gasEstimate));
      if (balanceBigInt < totalCost) {
        throw new Error('Insufficient balance for airdrop including gas fees');
      }

      // Send transaction
      const transaction = {
        from: this.account.address,
        to: recipientAddress,
        value: amountWei,
        gas: gasEstimate,
        gasPrice: gasPrice
      };

      const signedTransaction = await this.web3.eth.accounts.signTransaction(
        transaction,
        '0x' + config.privateKey
      );

      if (!signedTransaction.rawTransaction) {
        throw new Error('Failed to sign transaction');
      }

      const receipt = await this.web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
      return receipt.transactionHash.toString();
    } catch (error) {
      throw new Error(`Failed to send transaction: ${error}`);
    }
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
