/**
 * Mock DatabaseService for testing
 */
export declare class MockDatabaseService {
    private isConnectedFlag;
    private mockData;
    constructor(config?: any);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    query(text: string, params?: any[]): Promise<any>;
    transaction(queries: Array<{
        text: string;
        params?: any[];
    }>): Promise<any[]>;
    runMigrations(): Promise<void>;
    healthCheck(): Promise<{
        isHealthy: boolean;
        details: any;
    }>;
    getPoolStats(): {
        totalConnections: number;
        idleConnections: number;
        waitingClients: number;
    };
    isConnectionHealthy(): boolean;
    resetMockData(): void;
    addMockSecretCode(code: any): void;
    getMockData(): typeof this.mockData;
}
//# sourceMappingURL=databaseMock.d.ts.map