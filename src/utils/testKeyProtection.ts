/**
 * Simple Test Private Key Protection
 * 
 * Prevents test private keys from being used in production.
 * Strict failure - system stops immediately if test key detected.
 */

import { logger } from './logger';

// Known test private keys that should never be used in production
const KNOWN_TEST_KEYS = [
  // Hardhat default accounts
  'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Account #0
  '59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', // Account #1
  '5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a', // Account #2
  
  // Ganache default accounts
  '4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
  '6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1b',
  
  // Common test patterns
  'a'.repeat(64),  // All 'a's
  'b'.repeat(64),  // All 'b's
  '1'.repeat(64),  // All '1's
  '0'.repeat(64),  // All '0's
  'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
];

/**
 * Check if private key is a known test key and handle appropriately
 */
export function validatePrivateKeyForProduction(privateKey: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const key = privateKey.toLowerCase();
  
  // Check against known test keys
  if (KNOWN_TEST_KEYS.includes(key)) {
    if (isProduction) {
      // PRODUCTION: Immediate shutdown
      logger.config('error', '🚨 CRITICAL SECURITY VIOLATION: Test private key detected in production!');
      logger.config('error', '🛑 SYSTEM SHUTDOWN: Cannot operate with test keys in production');
      console.error('\n🚨 CRITICAL SECURITY VIOLATION 🚨');
      console.error('Test private key detected in production environment!');
      console.error('System shutting down immediately for security.\n');
      process.exit(1);
    } else {
      // DEVELOPMENT: Warning only
      logger.config('warn', '⚠️ WARNING: Test private key detected in development');
      logger.config('warn', 'This is OK for development but NEVER use in production!');
    }
  }
  
  // Simple pattern check for obviously weak keys
  if (isProduction && /^(.)\1{63}$/.test(key)) {
    logger.config('error', '🚨 CRITICAL: Weak private key pattern detected in production!');
    logger.config('error', '🛑 SYSTEM SHUTDOWN: Private key has suspicious repeated pattern');
    console.error('\n🚨 WEAK PRIVATE KEY DETECTED 🚨');
    console.error('Private key appears to be a test pattern.');
    console.error('System shutting down for security.\n');
    process.exit(1);
  }
}
