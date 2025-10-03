/**
 * Mock Web3 service for testing
 */
export declare class MockWeb3Service {
    private mockBalance;
    private mockXDaiBalance;
    private mockConnected;
    private mockAccountAddress;
    private transactionCounter;
    constructor(options?: {
        balance?: string;
        xDaiBalance?: string;
        connected?: boolean;
        accountAddress?: string;
    });
    isConnected(): Promise<boolean>;
    getAccountAddress(): string;
    getBalance(): Promise<string>;
    getXDaiBalance(): Promise<string>;
    sendDualTransaction(recipientAddress: string, wxHoprAmount: string, xDaiAmount: string): Promise<{
        wxHoprTxHash: string;
        xDaiTxHash: string;
    }>;
    setBalance(balance: string): void;
    setXDaiBalance(balance: string): void;
    setConnected(connected: boolean): void;
    setAccountAddress(address: string): void;
    reset(): void;
}
export declare const createMockWeb3Service: (options?: {
    balance?: string;
    xDaiBalance?: string;
    connected?: boolean;
    accountAddress?: string;
}) => MockWeb3Service;
//# sourceMappingURL=web3Mock.d.ts.map