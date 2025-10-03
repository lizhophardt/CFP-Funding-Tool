"use strict";
/**
 * Mock DatabaseService for testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockDatabaseService = void 0;
class MockDatabaseService {
    constructor(config) {
        this.isConnectedFlag = true;
        this.mockData = {
            secretCodes: [
                {
                    id: 'test-id-1',
                    code: 'TestCode1',
                    description: 'Test code 1',
                    is_active: true,
                    max_uses: 1,
                    current_uses: 0,
                    created_at: new Date(),
                    updated_at: new Date(),
                    created_by: 'test'
                },
                {
                    id: 'test-id-2',
                    code: 'TestCode2',
                    description: 'Test code 2',
                    is_active: true,
                    max_uses: 1,
                    current_uses: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                    created_by: 'test'
                },
                {
                    id: 'test-id-3',
                    code: 'TestCode3',
                    description: 'Test code 3',
                    is_active: true,
                    max_uses: null,
                    current_uses: 0,
                    created_at: new Date(),
                    updated_at: new Date(),
                    created_by: 'test'
                }
            ],
            codeUsage: []
        };
        // Mock constructor
    }
    async connect() {
        this.isConnectedFlag = true;
    }
    async disconnect() {
        this.isConnectedFlag = false;
    }
    async query(text, params) {
        // Simple mock query implementation
        if (text.includes('SELECT') && text.includes('secret_codes')) {
            if (text.includes('WHERE code = $1')) {
                const code = params?.[0];
                const found = this.mockData.secretCodes.find(sc => sc.code === code);
                return { rows: found ? [found] : [] };
            }
            return { rows: this.mockData.secretCodes };
        }
        if (text.includes('INSERT INTO code_usage')) {
            const usage = {
                id: `usage-${Date.now()}`,
                code_id: params?.[0],
                recipient_address: params?.[1],
                wxhopr_transaction_hash: params?.[2],
                xdai_transaction_hash: params?.[3],
                wxhopr_amount_wei: params?.[4],
                xdai_amount_wei: params?.[5],
                ip_address: params?.[6],
                user_agent: params?.[7],
                status: params?.[8] || 'completed',
                error_message: params?.[9],
                metadata: params?.[10],
                used_at: new Date()
            };
            this.mockData.codeUsage.push(usage);
            // Update usage count
            const codeIndex = this.mockData.secretCodes.findIndex(sc => sc.id === params?.[0]);
            if (codeIndex >= 0 && params?.[8] === 'completed') {
                this.mockData.secretCodes[codeIndex].current_uses++;
            }
            return { rows: [usage] };
        }
        if (text.includes('SELECT COUNT(*) as count FROM code_usage')) {
            const address = params?.[0];
            const count = this.mockData.codeUsage.filter(cu => cu.recipient_address === address && cu.status === 'completed').length;
            return { rows: [{ count: count.toString() }] };
        }
        if (text.includes('active_codes_with_stats')) {
            return {
                rows: this.mockData.secretCodes.map(sc => ({
                    ...sc,
                    successful_uses: this.mockData.codeUsage.filter(cu => cu.code_id === sc.id && cu.status === 'completed').length,
                    failed_uses: this.mockData.codeUsage.filter(cu => cu.code_id === sc.id && cu.status === 'failed').length,
                    total_usage_records: this.mockData.codeUsage.filter(cu => cu.code_id === sc.id).length
                }))
            };
        }
        return { rows: [] };
    }
    async transaction(queries) {
        const results = [];
        for (const query of queries) {
            results.push(await this.query(query.text, query.params));
        }
        return results;
    }
    async runMigrations() {
        // Mock migration
    }
    async healthCheck() {
        return {
            isHealthy: this.isConnectedFlag,
            details: {
                connected: this.isConnectedFlag,
                timestamp: new Date(),
                version: 'Mock PostgreSQL',
                poolSize: 1,
                idleConnections: 0,
                waitingClients: 0
            }
        };
    }
    getPoolStats() {
        return {
            totalConnections: 1,
            idleConnections: 0,
            waitingClients: 0
        };
    }
    isConnectionHealthy() {
        return this.isConnectedFlag;
    }
    // Test helpers
    resetMockData() {
        this.mockData = {
            secretCodes: [
                {
                    id: 'test-id-1',
                    code: 'TestCode1',
                    description: 'Test code 1',
                    is_active: true,
                    max_uses: 1,
                    current_uses: 0,
                    created_at: new Date(),
                    updated_at: new Date(),
                    created_by: 'test'
                },
                {
                    id: 'test-id-2',
                    code: 'TestCode2',
                    description: 'Test code 2',
                    is_active: true,
                    max_uses: 1,
                    current_uses: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                    created_by: 'test'
                },
                {
                    id: 'test-id-3',
                    code: 'TestCode3',
                    description: 'Test code 3',
                    is_active: true,
                    max_uses: null,
                    current_uses: 0,
                    created_at: new Date(),
                    updated_at: new Date(),
                    created_by: 'test'
                }
            ],
            codeUsage: []
        };
    }
    addMockSecretCode(code) {
        this.mockData.secretCodes.push(code);
    }
    getMockData() {
        return this.mockData;
    }
}
exports.MockDatabaseService = MockDatabaseService;
//# sourceMappingURL=databaseMock.js.map