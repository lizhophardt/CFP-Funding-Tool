import { Web3Service } from '../../src/services/web3Service';
import { config } from '../../src/config';

// Mock Viem imports
jest.mock('viem', () => {
  const originalViem = jest.requireActual('viem');
  return {
    ...originalViem,
    createPublicClient: jest.fn(),
    createWalletClient: jest.fn(),
    fallback: jest.fn(),
    http: jest.fn(),
    getContract: jest.fn(),
  };
});

jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn(() => ({
    address: '0x1234567890123456789012345678901234567890'
  }))
}));

import { createPublicClient, createWalletClient, fallback, http } from 'viem';

describe('Fallback RPC Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration Loading', () => {
    it('should load primary RPC URL from environment', () => {
      expect(config.gnosisRpcUrl).toBeDefined();
      expect(typeof config.gnosisRpcUrl).toBe('string');
    });

    it('should load fallback RPC URLs array', () => {
      expect(config.gnosisRpcUrls).toBeDefined();
      expect(Array.isArray(config.gnosisRpcUrls)).toBe(true);
      expect(config.gnosisRpcUrls.length).toBeGreaterThan(0);
    });

    it('should include primary URL in fallback URLs array', () => {
      expect(config.gnosisRpcUrls[0]).toBe(config.gnosisRpcUrl);
    });

    it('should have default fallback endpoints when not configured', () => {
      // The default endpoints should be included
      const expectedEndpoints = [
        'https://rpc.ankr.com/gnosis',
        'https://gnosis-mainnet.public.blastapi.io',
        'https://gnosis.blockpi.network/v1/rpc/public'
      ];
      
      // Check if at least some default endpoints are present
      const hasDefaultEndpoints = expectedEndpoints.some(endpoint => 
        config.gnosisRpcUrls.includes(endpoint)
      );
      expect(hasDefaultEndpoints).toBe(true);
    });
  });

  describe('Web3Service Fallback Integration', () => {
    it('should initialize Web3Service with fallback transport', () => {
      // Mock the fallback function to return a mock transport
      const mockTransport = { type: 'fallback' };
      (fallback as jest.Mock).mockReturnValue(mockTransport);
      
      // Mock http function
      (http as jest.Mock).mockImplementation((url) => ({ type: 'http', url }));
      
      // Mock client creation
      (createPublicClient as jest.Mock).mockReturnValue({ mockPublicClient: true });
      (createWalletClient as jest.Mock).mockReturnValue({ mockWalletClient: true });

      // Create Web3Service instance
      const web3Service = new Web3Service();

      // Verify fallback was called with correct parameters
      expect(fallback).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          rank: true,
          retryCount: 3,
          retryDelay: 150
        })
      );

      // Verify http was called for each RPC URL
      config.gnosisRpcUrls.forEach(url => {
        expect(http).toHaveBeenCalledWith(url);
      });

      // Verify clients were created with fallback transport
      expect(createPublicClient).toHaveBeenCalledWith(
        expect.objectContaining({
          transport: mockTransport
        })
      );

      expect(createWalletClient).toHaveBeenCalledWith(
        expect.objectContaining({
          transport: mockTransport
        })
      );
    });

    it('should create HTTP transports for all configured URLs', () => {
      (http as jest.Mock).mockImplementation((url) => ({ type: 'http', url }));
      (fallback as jest.Mock).mockReturnValue({ type: 'fallback' });
      (createPublicClient as jest.Mock).mockReturnValue({});
      (createWalletClient as jest.Mock).mockReturnValue({});

      new Web3Service();

      // Verify http was called for each URL in the configuration
      expect(http).toHaveBeenCalledTimes(config.gnosisRpcUrls.length);
      
      config.gnosisRpcUrls.forEach((url, index) => {
        expect(http).toHaveBeenNthCalledWith(index + 1, url);
      });
    });

    it('should configure fallback with proper options', () => {
      (http as jest.Mock).mockReturnValue({ type: 'http' });
      (fallback as jest.Mock).mockReturnValue({ type: 'fallback' });
      (createPublicClient as jest.Mock).mockReturnValue({});
      (createWalletClient as jest.Mock).mockReturnValue({});

      new Web3Service();

      expect(fallback).toHaveBeenCalledWith(
        expect.any(Array),
        {
          rank: true,
          retryCount: 3,
          retryDelay: 150
        }
      );
    });
  });

  describe('Environment Variable Parsing', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should parse comma-separated fallback URLs from environment', () => {
      process.env.GNOSIS_RPC_URL = 'https://primary.example.com';
      process.env.GNOSIS_FALLBACK_RPC_URLS = 'https://fallback1.example.com,https://fallback2.example.com';
      
      // Re-import config to get updated values
      delete require.cache[require.resolve('../../src/config')];
      const { config: newConfig } = require('../../src/config');
      
      expect(newConfig.gnosisRpcUrls).toEqual([
        'https://primary.example.com',
        'https://fallback1.example.com',
        'https://fallback2.example.com'
      ]);
    });

    it('should handle whitespace in fallback URLs', () => {
      process.env.GNOSIS_RPC_URL = 'https://primary.example.com';
      process.env.GNOSIS_FALLBACK_RPC_URLS = ' https://fallback1.example.com , https://fallback2.example.com ';
      
      delete require.cache[require.resolve('../../src/config')];
      const { config: newConfig } = require('../../src/config');
      
      expect(newConfig.gnosisRpcUrls).toEqual([
        'https://primary.example.com',
        'https://fallback1.example.com',
        'https://fallback2.example.com'
      ]);
    });

    it('should use default fallback URLs when environment variable is not set', () => {
      process.env.GNOSIS_RPC_URL = 'https://primary.example.com';
      delete process.env.GNOSIS_FALLBACK_RPC_URLS;
      
      delete require.cache[require.resolve('../../src/config')];
      const { config: newConfig } = require('../../src/config');
      
      // Should have primary + default fallbacks
      expect(newConfig.gnosisRpcUrls.length).toBeGreaterThan(1);
      expect(newConfig.gnosisRpcUrls[0]).toBe('https://primary.example.com');
      
      // Should include some default endpoints
      const hasAnkr = newConfig.gnosisRpcUrls.includes('https://rpc.ankr.com/gnosis');
      const hasBlast = newConfig.gnosisRpcUrls.includes('https://gnosis-mainnet.public.blastapi.io');
      expect(hasAnkr || hasBlast).toBe(true);
    });
  });
});
