import dotenv from 'dotenv';
import { Config } from '../types';
import { SecurityConfig } from './securityConfig';
import { logger } from '../utils/logger';
import { validatePrivateKeyForProduction } from '../utils/testKeyProtection';

dotenv.config();


// Initialize security configuration
const securityConfig = new SecurityConfig();


// Unified configuration creation function
function createConfig(): Config {
  const encryptedKey = process.env.ENCRYPTED_PRIVATE_KEY;
  const encryptionPassword = process.env.ENCRYPTION_PASSWORD;
  const plainKey = process.env.PRIVATE_KEY;
  
  let privateKey = '';
  
  if (encryptedKey && encryptionPassword) {
    try {
      const KeyManager = require('../utils/keyManager').KeyManager;
      logger.config('info', 'Using encrypted private key');
      privateKey = KeyManager.decryptPrivateKey(encryptedKey, encryptionPassword);
    } catch (error) {
      logger.config('error', 'Failed to decrypt private key', {
        error: error instanceof Error ? error.message : error
      });
      throw new Error(`Failed to decrypt private key: ${error}`);
    }
  } else if (plainKey) {
    logger.config('warn', 'Using unencrypted private key. Consider using ENCRYPTED_PRIVATE_KEY for better security.');
    privateKey = plainKey;
  }

  return {
    gnosisRpcUrl: process.env.GNOSIS_RPC_URL || 'https://rpc.gnosischain.com',
    privateKey,
    secretCodes: process.env.SECRET_CODES 
      ? process.env.SECRET_CODES.split(',').map(s => s.trim())
      : ['DontTellUncleSam', 'SecretCode123', 'HiddenTreasure'],
    wxHoprTokenAddress: process.env.WXHOPR_TOKEN_ADDRESS || '0xD4fdec44DB9D44B8f2b6d529620f9C0C7066A2c1',
    airdropAmountWei: process.env.AIRDROP_AMOUNT_WEI || '10000000000000000',
    xDaiAirdropAmountWei: process.env.XDAI_AIRDROP_AMOUNT_WEI || '10000000000000000',
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'cfp_funding_tool',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production',
      connectionString: process.env.DATABASE_URL // Railway/Heroku style connection string
    }
  };
}

// Single configuration instance
export const config = createConfig();

// Log security level
const encryptedKey = process.env.ENCRYPTED_PRIVATE_KEY;
const plainKey = process.env.PRIVATE_KEY;

if (encryptedKey) {
  logger.config('info', 'Security Level: MEDIUM (Encrypted Private Key)');
} else if (plainKey) {
  logger.config('warn', 'Security Level: LOW (Plain Text Private Key)');
  if (process.env.NODE_ENV === 'production') {
    logger.config('error', 'PRODUCTION ERROR: Plain text private key detected in production!');
    process.exit(1);
  }
} else {
  logger.config('error', 'No private key configuration found');
}

// Log security information on startup
logger.config('info', `Security Level: ${securityConfig.getSecurityLevel()}`);
logger.config('info', `Key Strategy: ${securityConfig.getStrategy()}`);

if (!securityConfig.isProductionReady() && process.env.NODE_ENV === 'production') {
  logger.config('error', 'PRODUCTION ERROR: Insecure key management detected in production environment!');
  process.exit(1);
}

// Show security recommendations
const recommendations = securityConfig.getRecommendations();
recommendations.forEach(rec => logger.config('info', rec));

export function validateConfig(): void {
  const requiredFields: (keyof Config)[] = ['privateKey'];
  
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Missing required environment variable: ${field.toUpperCase()}`);
    }
  }

  // Validate database configuration
  if (!config.database.connectionString) {
    // If no connection string, validate individual fields
    if (!config.database.host) {
      throw new Error('Missing required environment variable: DB_HOST or DATABASE_URL');
    }
    if (!config.database.user) {
      throw new Error('Missing required environment variable: DB_USER');
    }
    if (!config.database.password) {
      throw new Error('Missing required environment variable: DB_PASSWORD');
    }
    if (!config.database.database) {
      throw new Error('Missing required environment variable: DB_NAME');
    }
  }

  // Validate that we have at least one secret code (for backward compatibility)
  if (!config.secretCodes || config.secretCodes.length === 0 || 
      (config.secretCodes.length === 1 && !config.secretCodes[0])) {
    logger.config('warn', 'No SECRET_CODES environment variable found. This is expected when using database storage.');
  }

  // Validate private key format
  if (!config.privateKey.match(/^[a-fA-F0-9]{64}$/)) {
    throw new Error('Private key must be a 64-character hexadecimal string');
  }

  // SIMPLE TEST KEY PROTECTION: Check for known test keys
  validatePrivateKeyForProduction(config.privateKey);

  // Validate airdrop amounts are valid numbers
  if (isNaN(Number(config.airdropAmountWei)) || Number(config.airdropAmountWei) <= 0) {
    throw new Error('wxHOPR airdrop amount must be a positive number');
  }
  
  if (isNaN(Number(config.xDaiAirdropAmountWei)) || Number(config.xDaiAirdropAmountWei) <= 0) {
    throw new Error('xDai airdrop amount must be a positive number');
  }
}
