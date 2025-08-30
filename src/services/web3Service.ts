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

  async getXDaiBalance(): Promise<string> {
    try {
      const balance = await this.web3.eth.getBalance(this.account.address);
      return this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      throw new Error(`Failed to get xDai balance: ${error}`);
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
        throw new Error('Invalid recipient address');
      }
      
      console.log(`✅ Address validation passed!`);

      // Check if we have enough wxHOPR token balance
      const tokenBalance = await this.tokenContract.methods.balanceOf(this.account.address).call();
      const wxHoprAmountBigInt = BigInt(wxHoprAmountWei);
      const tokenBalanceBigInt = BigInt(tokenBalance);

      if (tokenBalanceBigInt < wxHoprAmountBigInt) {
        throw new Error('Insufficient wxHOPR balance for airdrop');
      }

      // Check native xDai balance
      const nativeBalance = await this.web3.eth.getBalance(this.account.address);
      const gasPrice = await this.web3.eth.getGasPrice();
      
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

      // Calculate total gas costs
      const tokenGasCost = BigInt(gasPrice) * BigInt(tokenGasEstimate);
      const xDaiGasCost = BigInt(gasPrice) * BigInt(xDaiGasEstimate);
      const totalGasCost = tokenGasCost + xDaiGasCost;
      const xDaiAmountBigInt = BigInt(xDaiAmountWei);
      const totalXDaiNeeded = totalGasCost + xDaiAmountBigInt;

      if (BigInt(nativeBalance) < totalXDaiNeeded) {
        throw new Error(`Insufficient xDai balance. Need ${this.web3.utils.fromWei(totalXDaiNeeded.toString(), 'ether')} xDai but only have ${this.web3.utils.fromWei(nativeBalance, 'ether')}`);
      }

      // Send wxHOPR token transfer transaction first
      const tokenTransaction = {
        from: this.account.address,
        to: config.wxHoprTokenAddress,
        data: transferData,
        gas: tokenGasEstimate,
        gasPrice: gasPrice
      };

      const signedTokenTransaction = await this.web3.eth.accounts.signTransaction(
        tokenTransaction,
        '0x' + config.privateKey
      );

      if (!signedTokenTransaction.rawTransaction) {
        throw new Error('Failed to sign wxHOPR token transaction');
      }

      const tokenReceipt = await this.web3.eth.sendSignedTransaction(signedTokenTransaction.rawTransaction);
      console.log(`✅ wxHOPR token transfer successful: ${tokenReceipt.transactionHash}`);

      // Send native xDai transfer transaction
      const xDaiTransaction = {
        from: this.account.address,
        to: recipientAddress,
        value: xDaiAmountWei,
        gas: xDaiGasEstimate,
        gasPrice: gasPrice
      };

      const signedXDaiTransaction = await this.web3.eth.accounts.signTransaction(
        xDaiTransaction,
        '0x' + config.privateKey
      );

      if (!signedXDaiTransaction.rawTransaction) {
        throw new Error('Failed to sign xDai transaction');
      }

      const xDaiReceipt = await this.web3.eth.sendSignedTransaction(signedXDaiTransaction.rawTransaction);
      console.log(`✅ xDai transfer successful: ${xDaiReceipt.transactionHash}`);

      return {
        wxHoprTxHash: tokenReceipt.transactionHash.toString(),
        xDaiTxHash: xDaiReceipt.transactionHash.toString()
      };
    } catch (error) {
      throw new Error(`Failed to send dual transaction: ${error}`);
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
