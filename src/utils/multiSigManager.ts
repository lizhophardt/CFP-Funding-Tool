import Web3 from 'web3';

// Gnosis Safe MultiSig ABI (simplified)
const MULTISIG_ABI = [
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "value", "type": "uint256"},
      {"name": "data", "type": "bytes"},
      {"name": "operation", "type": "uint8"},
      {"name": "safeTxGas", "type": "uint256"},
      {"name": "baseGas", "type": "uint256"},
      {"name": "gasPrice", "type": "uint256"},
      {"name": "gasToken", "type": "address"},
      {"name": "refundReceiver", "type": "address"},
      {"name": "signatures", "type": "bytes"}
    ],
    "name": "execTransaction",
    "outputs": [{"name": "success", "type": "bool"}],
    "type": "function"
  }
];

export class MultiSigManager {
  private web3: Web3;
  private multiSigAddress: string;
  private contract: any;
  private serverPrivateKey: string;

  constructor(web3: Web3, multiSigAddress: string, serverPrivateKey: string) {
    this.web3 = web3;
    this.multiSigAddress = multiSigAddress;
    this.serverPrivateKey = serverPrivateKey;
    this.contract = new web3.eth.Contract(MULTISIG_ABI, multiSigAddress);
  }

  /**
   * Propose a transaction to the multisig wallet
   * Requires additional signatures from other owners
   */
  async proposeTransaction(
    to: string,
    value: string,
    data: string = '0x'
  ): Promise<{
    transactionHash: string;
    requiresAdditionalSignatures: boolean;
    signaturesNeeded: number;
  }> {
    try {
      // Get transaction parameters
      const nonce = await this.contract.methods.nonce().call();
      const safeTxGas = 0;
      const baseGas = 0;
      const gasPrice = 0;
      const gasToken = '0x0000000000000000000000000000000000000000';
      const refundReceiver = '0x0000000000000000000000000000000000000000';

      // Create transaction hash for signing
      const txHash = await this.contract.methods.getTransactionHash(
        to,
        value,
        data,
        0, // operation (0 = call)
        safeTxGas,
        baseGas,
        gasPrice,
        gasToken,
        refundReceiver,
        nonce
      ).call();

      // Sign with server key
      const signature = await this.web3.eth.accounts.sign(txHash, this.serverPrivateKey);
      
      // Check how many signatures are required
      const threshold = await this.contract.methods.getThreshold().call();
      const owners = await this.contract.methods.getOwners().call();

      console.log(`📝 MultiSig transaction proposed:`);
      console.log(`   🎯 To: ${to}`);
      console.log(`   💰 Value: ${this.web3.utils.fromWei(value, 'ether')} ETH`);
      console.log(`   🔐 Threshold: ${threshold}/${owners.length}`);
      console.log(`   📋 Transaction Hash: ${txHash}`);

      return {
        transactionHash: txHash,
        requiresAdditionalSignatures: true,
        signaturesNeeded: threshold - 1 // Minus our signature
      };

    } catch (error) {
      throw new Error(`MultiSig transaction proposal failed: ${error}`);
    }
  }

  /**
   * Execute transaction when enough signatures are collected
   */
  async executeTransaction(
    to: string,
    value: string,
    data: string,
    signatures: string[]
  ): Promise<string> {
    try {
      const combinedSignatures = signatures.join('');
      
      const txData = this.contract.methods.execTransaction(
        to,
        value,
        data,
        0, // operation
        0, // safeTxGas
        0, // baseGas
        0, // gasPrice
        '0x0000000000000000000000000000000000000000', // gasToken
        '0x0000000000000000000000000000000000000000', // refundReceiver
        combinedSignatures
      ).encodeABI();

      const account = this.web3.eth.accounts.privateKeyToAccount(this.serverPrivateKey);
      
      const transaction = {
        from: account.address,
        to: this.multiSigAddress,
        data: txData,
        gas: await this.web3.eth.estimateGas({
          from: account.address,
          to: this.multiSigAddress,
          data: txData
        }),
        gasPrice: await this.web3.eth.getGasPrice()
      };

      const signedTx = await this.web3.eth.accounts.signTransaction(transaction, this.serverPrivateKey);
      const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction!);

      return receipt.transactionHash.toString();

    } catch (error) {
      throw new Error(`MultiSig execution failed: ${error}`);
    }
  }

  /**
   * Get setup instructions for MultiSig wallet
   */
  static getSetupInstructions(): string {
    return `
🏦 MultiSig Wallet Setup Instructions:

1. Deploy Gnosis Safe MultiSig:
   - Go to https://gnosis-safe.io/
   - Create new Safe with 2-3 owners
   - Set threshold to 2 (requires 2 signatures)
   - Fund the Safe with wxHOPR tokens and xDai

2. Server Configuration:
   - Server holds 1 private key (for automatic signing)
   - Other keys held by trusted parties (manual signing)
   - Transactions require multiple signatures

3. Environment Variables:
   MULTISIG_ADDRESS=0x1234...
   SERVER_PRIVATE_KEY=abc123... (one of the Safe owners)
   MULTISIG_THRESHOLD=2

4. Workflow:
   - Server proposes transaction
   - Sends notification to other owners
   - Other owners sign via Safe interface
   - Server executes when threshold reached

Benefits:
✅ No single point of failure
✅ Distributed trust model
✅ Transparent transaction history
✅ Can revoke compromised keys
`;
  }
}
