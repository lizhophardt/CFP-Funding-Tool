/**
 * Mock Web3 service for testing
 */

export class MockWeb3Service {
  private mockBalance = '1000000000000000000'; // 1 ETH/token
  private mockXDaiBalance = '2000000000000000000'; // 2 xDai
  private mockConnected = true;
  private mockAccountAddress = '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1';
  private transactionCounter = 0;

  constructor(options: {
    balance?: string;
    xDaiBalance?: string;
    connected?: boolean;
    accountAddress?: string;
  } = {}) {
    if (options.balance) this.mockBalance = options.balance;
    if (options.xDaiBalance) this.mockXDaiBalance = options.xDaiBalance;
    if (options.connected !== undefined) this.mockConnected = options.connected;
    if (options.accountAddress) this.mockAccountAddress = options.accountAddress;
  }

  async isConnected(): Promise<boolean> {
    return this.mockConnected;
  }

  getAccountAddress(): string {
    return this.mockAccountAddress;
  }

  async getBalance(): Promise<string> {
    if (!this.mockConnected) {
      throw new Error('Not connected to network');
    }
    return this.mockBalance;
  }

  async getXDaiBalance(): Promise<string> {
    if (!this.mockConnected) {
      throw new Error('Not connected to network');
    }
    return this.mockXDaiBalance;
  }

  async sendDualTransaction(
    recipientAddress: string,
    wxHoprAmount: string,
    xDaiAmount: string
  ): Promise<{
    wxHoprTxHash: string;
    xDaiTxHash: string;
  }> {
    if (!this.mockConnected) {
      throw new Error('Not connected to network');
    }

    // Simulate insufficient balance
    if (this.mockBalance === '0' || this.mockXDaiBalance === '0') {
      throw new Error('Insufficient balance');
    }

    // Simulate invalid address
    if (!recipientAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid recipient address');
    }

    this.transactionCounter++;
    
    return {
      wxHoprTxHash: `0x${'1'.repeat(63)}${this.transactionCounter}`,
      xDaiTxHash: `0x${'2'.repeat(63)}${this.transactionCounter}`
    };
  }

  // Test helper methods
  setBalance(balance: string) {
    this.mockBalance = balance;
  }

  setXDaiBalance(balance: string) {
    this.mockXDaiBalance = balance;
  }

  setConnected(connected: boolean) {
    this.mockConnected = connected;
  }

  setAccountAddress(address: string) {
    this.mockAccountAddress = address;
  }

  reset() {
    this.mockBalance = '1000000000000000000';
    this.mockXDaiBalance = '2000000000000000000';
    this.mockConnected = true;
    this.mockAccountAddress = '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1';
    this.transactionCounter = 0;
  }
}

// Factory function for creating mock instances
export const createMockWeb3Service = (options?: {
  balance?: string;
  xDaiBalance?: string;
  connected?: boolean;
  accountAddress?: string;
}) => {
  return new MockWeb3Service(options);
};
