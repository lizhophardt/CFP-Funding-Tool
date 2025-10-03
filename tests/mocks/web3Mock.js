"use strict";
/**
 * Mock Web3 service for testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockWeb3Service = exports.MockWeb3Service = void 0;
class MockWeb3Service {
    constructor(options = {}) {
        this.mockBalance = '1000000000000000000'; // 1 ETH/token
        this.mockXDaiBalance = '2000000000000000000'; // 2 xDai
        this.mockConnected = true;
        this.mockAccountAddress = '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1';
        this.transactionCounter = 0;
        if (options.balance)
            this.mockBalance = options.balance;
        if (options.xDaiBalance)
            this.mockXDaiBalance = options.xDaiBalance;
        if (options.connected !== undefined)
            this.mockConnected = options.connected;
        if (options.accountAddress)
            this.mockAccountAddress = options.accountAddress;
    }
    async isConnected() {
        return this.mockConnected;
    }
    getAccountAddress() {
        return this.mockAccountAddress;
    }
    async getBalance() {
        if (!this.mockConnected) {
            throw new Error('Not connected to network');
        }
        return this.mockBalance;
    }
    async getXDaiBalance() {
        if (!this.mockConnected) {
            throw new Error('Not connected to network');
        }
        return this.mockXDaiBalance;
    }
    async sendDualTransaction(recipientAddress, wxHoprAmount, xDaiAmount) {
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
    setBalance(balance) {
        this.mockBalance = balance;
    }
    setXDaiBalance(balance) {
        this.mockXDaiBalance = balance;
    }
    setConnected(connected) {
        this.mockConnected = connected;
    }
    setAccountAddress(address) {
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
exports.MockWeb3Service = MockWeb3Service;
// Factory function for creating mock instances
const createMockWeb3Service = (options) => {
    return new MockWeb3Service(options);
};
exports.createMockWeb3Service = createMockWeb3Service;
//# sourceMappingURL=web3Mock.js.map