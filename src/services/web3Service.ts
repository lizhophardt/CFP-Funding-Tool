import Web3 from 'web3';
import { config } from '../config';

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
      const decimals = await this.tokenContract.methods.decimals().call();
      return (BigInt(balance) / BigInt(10 ** Number(decimals))).toString();
    } catch (error) {
      throw new Error(`Failed to get wxHOPR balance: ${error}`);
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

      // Check if we have enough wxHOPR token balance
      const tokenBalance = await this.tokenContract.methods.balanceOf(this.account.address).call();
      const amountBigInt = BigInt(amountWei);
      const tokenBalanceBigInt = BigInt(tokenBalance);

      if (tokenBalanceBigInt < amountBigInt) {
        throw new Error('Insufficient wxHOPR balance for airdrop');
      }

      // Check native xDai balance for gas fees
      const nativeBalance = await this.web3.eth.getBalance(this.account.address);
      const gasPrice = await this.web3.eth.getGasPrice();
      
      // Estimate gas for token transfer
      const transferData = this.tokenContract.methods.transfer(recipientAddress, amountWei).encodeABI();
      const gasEstimate = await this.web3.eth.estimateGas({
        from: this.account.address,
        to: config.wxHoprTokenAddress,
        data: transferData
      });

      // Check if we have enough native balance for gas fees
      const gasCost = BigInt(gasPrice) * BigInt(gasEstimate);
      if (BigInt(nativeBalance) < gasCost) {
        throw new Error('Insufficient xDai balance for gas fees');
      }

      // Send token transfer transaction
      const transaction = {
        from: this.account.address,
        to: config.wxHoprTokenAddress,
        data: transferData,
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
      throw new Error(`Failed to send wxHOPR transaction: ${error}`);
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
