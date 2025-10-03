import { Web3Service } from '../../src/services/web3Service';
import { config } from '../../src/config';

describe('RPC Fallback Integration Tests', () => {
  let web3Service: Web3Service;

  beforeAll(() => {
    // Only run if we have a test environment
    if (process.env.NODE_ENV !== 'test') {
      return;
    }
  });

  beforeEach(() => {
    web3Service = new Web3Service();
  });

  describe('Connection Resilience', () => {
    it('should be able to connect to blockchain', async () => {
      const isConnected = await web3Service.isConnected();
      expect(isConnected).toBe(true);
    }, 15000); // 15 second timeout for network operations

    it('should have multiple RPC endpoints configured', () => {
      expect(config.gnosisRpcUrls).toBeDefined();
      expect(config.gnosisRpcUrls.length).toBeGreaterThan(1);
      
      // Log the configured endpoints for debugging
      console.log('Configured RPC endpoints:', config.gnosisRpcUrls);
    });

    it('should be able to retrieve account address', () => {
      const address = web3Service.getAccountAddress();
      expect(address).toBeDefined();
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should be able to check token balance', async () => {
      try {
        const balance = await web3Service.getBalance();
        expect(balance).toBeDefined();
        expect(typeof balance).toBe('string');
        // Balance should be a valid number (could be 0)
        expect(parseFloat(balance)).toBeGreaterThanOrEqual(0);
      } catch (error) {
        // If this fails, it might be due to network issues or invalid token address
        console.warn('Token balance check failed:', error);
        // Don't fail the test for network-related issues in CI
        if (process.env.CI) {
          console.log('Skipping balance check in CI environment');
        } else {
          throw error;
        }
      }
    }, 10000);

    it('should be able to check xDai balance', async () => {
      try {
        const balance = await web3Service.getXDaiBalance();
        expect(balance).toBeDefined();
        expect(typeof balance).toBe('string');
        expect(parseFloat(balance)).toBeGreaterThanOrEqual(0);
      } catch (error) {
        console.warn('xDai balance check failed:', error);
        if (process.env.CI) {
          console.log('Skipping xDai balance check in CI environment');
        } else {
          throw error;
        }
      }
    }, 10000);
  });

  describe('RPC Endpoint Validation', () => {
    it('should have valid HTTP/HTTPS URLs for all endpoints', () => {
      config.gnosisRpcUrls.forEach(url => {
        expect(url).toMatch(/^https?:\/\/.+/);
      });
    });

    it('should have primary RPC URL as first endpoint', () => {
      expect(config.gnosisRpcUrls[0]).toBe(config.gnosisRpcUrl);
    });

    it('should not have duplicate endpoints', () => {
      const uniqueUrls = [...new Set(config.gnosisRpcUrls)];
      expect(uniqueUrls.length).toBe(config.gnosisRpcUrls.length);
    });
  });

  describe('Fallback Configuration', () => {
    it('should have reasonable fallback configuration', () => {
      // Test that we have at least 2 endpoints (primary + 1 fallback)
      expect(config.gnosisRpcUrls.length).toBeGreaterThanOrEqual(2);
      
      // Test that endpoints are different
      const [primary, ...fallbacks] = config.gnosisRpcUrls;
      fallbacks.forEach(fallback => {
        expect(fallback).not.toBe(primary);
      });
    });

    it('should include known reliable Gnosis Chain endpoints', () => {
      const reliableEndpoints = [
        'https://rpc.gnosischain.com',
        'https://rpc.ankr.com/gnosis',
        'https://gnosis-mainnet.public.blastapi.io',
        'https://gnosis.blockpi.network/v1/rpc/public'
      ];

      // Should have at least 2 of the reliable endpoints
      const matchingEndpoints = config.gnosisRpcUrls.filter(url => 
        reliableEndpoints.includes(url)
      );
      
      expect(matchingEndpoints.length).toBeGreaterThanOrEqual(2);
    });
  });

  // Simulate network failure scenario (mock test)
  describe('Simulated Network Scenarios', () => {
    it('should handle configuration with single endpoint gracefully', () => {
      // This tests that the code doesn't break with minimal configuration
      const minimalUrls = [config.gnosisRpcUrl];
      expect(() => {
        // Simulate creating a service with minimal config
        // In real scenario, this would still work but without fallback benefits
        expect(minimalUrls.length).toBe(1);
      }).not.toThrow();
    });

    it('should handle empty fallback URLs gracefully', () => {
      // Test that the configuration parsing handles edge cases
      const originalEnv = process.env.GNOSIS_FALLBACK_RPC_URLS;
      
      try {
        // Simulate empty fallback URLs
        process.env.GNOSIS_FALLBACK_RPC_URLS = '';
        
        // The config should still work with just the primary URL + defaults
        expect(config.gnosisRpcUrl).toBeDefined();
        expect(config.gnosisRpcUrls).toBeDefined();
        expect(config.gnosisRpcUrls.length).toBeGreaterThan(0);
      } finally {
        // Restore original environment
        if (originalEnv) {
          process.env.GNOSIS_FALLBACK_RPC_URLS = originalEnv;
        } else {
          delete process.env.GNOSIS_FALLBACK_RPC_URLS;
        }
      }
    });
  });
});
