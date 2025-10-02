import { validatePrivateKeyForProduction } from '../../src/utils/testKeyProtection';

describe('Simple Test Key Protection', () => {
  let originalNodeEnv: string | undefined;
  let mockExit: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;

  beforeAll(() => {
    originalNodeEnv = process.env.NODE_ENV;
    
    // Mock process.exit to prevent actual exit during tests
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('Process exit called');
    });
    
    // Mock console.error to prevent noise in test output
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restore original environment
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
    
    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should allow valid keys in any environment', () => {
    process.env.NODE_ENV = 'production';
    const validKey = 'e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35';
    
    expect(() => validatePrivateKeyForProduction(validKey)).not.toThrow();
    expect(mockExit).not.toHaveBeenCalled();
  });

  test('should warn about test keys in development', () => {
    process.env.NODE_ENV = 'development';
    const hardhatKey = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    
    expect(() => validatePrivateKeyForProduction(hardhatKey)).not.toThrow();
    expect(mockExit).not.toHaveBeenCalled();
  });

  test('should stop system for test keys in production', () => {
    process.env.NODE_ENV = 'production';
    const hardhatKey = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    
    expect(() => validatePrivateKeyForProduction(hardhatKey)).toThrow('Process exit called');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('should detect various test key patterns', () => {
    process.env.NODE_ENV = 'production';
    
    const testKeys = [
      'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Hardhat
      '4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d', // Ganache
      'a'.repeat(64), // Pattern
      'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef' // Classic
    ];
    
    testKeys.forEach(key => {
      mockExit.mockClear();
      expect(() => validatePrivateKeyForProduction(key)).toThrow('Process exit called');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  test('should detect repeated patterns in production', () => {
    process.env.NODE_ENV = 'production';
    const repeatedPattern = '1'.repeat(64);
    
    expect(() => validatePrivateKeyForProduction(repeatedPattern)).toThrow('Process exit called');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
