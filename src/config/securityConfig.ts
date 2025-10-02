import { KeyManager } from '../utils/keyManager';

export enum KeyManagementStrategy {
  PLAIN_TEXT = 'plain',
  ENCRYPTED = 'encrypted', 
  AWS_KMS = 'kms',
  VAULT = 'vault',
  MULTISIG = 'multisig'
}

export class SecurityConfig {
  private strategy: KeyManagementStrategy;

  constructor() {
    this.strategy = this.determineStrategy();
  }

  private determineStrategy(): KeyManagementStrategy {
    // Priority order for key management
    if (process.env.ENCRYPTED_PRIVATE_KEY && process.env.ENCRYPTION_PASSWORD) {
      return KeyManagementStrategy.ENCRYPTED;
    }
    
    if (process.env.PRIVATE_KEY) {
      const { logger } = require('../utils/logger');
      logger.security('warn', 'Using plain text private key. This is not secure for production!');
      return KeyManagementStrategy.PLAIN_TEXT;
    }
    
    throw new Error('No private key configuration found');
  }

  async getPrivateKey(): Promise<string> {
    const { logger } = require('../utils/logger');
    
    try {
      switch (this.strategy) {
        case KeyManagementStrategy.ENCRYPTED:
          logger.config('info', 'Decrypting private key with local encryption');
          const encryptedKey = process.env.ENCRYPTED_PRIVATE_KEY!;
          const password = process.env.ENCRYPTION_PASSWORD!;
          return KeyManager.decryptPrivateKey(encryptedKey, password);

        case KeyManagementStrategy.PLAIN_TEXT:
          logger.security('warn', 'Using plain text private key');
          return process.env.PRIVATE_KEY || '';

        default:
          throw new Error(`Unknown key management strategy: ${this.strategy}`);
      }
    } catch (error) {
      throw new Error(`Failed to retrieve private key: ${error}`);
    }
  }

  getStrategy(): KeyManagementStrategy {
    return this.strategy;
  }

  isProductionReady(): boolean {
    return this.strategy !== KeyManagementStrategy.PLAIN_TEXT;
  }

  getSecurityLevel(): 'LOW' | 'MEDIUM' | 'HIGH' | 'ENTERPRISE' {
    switch (this.strategy) {
      case KeyManagementStrategy.PLAIN_TEXT:
        return 'LOW';
      case KeyManagementStrategy.ENCRYPTED:
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }

  getRecommendations(): string[] {
    const recommendations: string[] = [];

    switch (this.strategy) {
      case KeyManagementStrategy.PLAIN_TEXT:
        recommendations.push('🔴 CRITICAL: Upgrade to encrypted private key storage');
        recommendations.push('🔴 CRITICAL: Never use plain text keys in production');
        recommendations.push('🟡 Consider implementing AWS KMS or Vault for enterprise security');
        break;

      case KeyManagementStrategy.ENCRYPTED:
        recommendations.push('🟢 Good: Using encrypted private key storage');
        recommendations.push('🟡 Consider AWS KMS for cloud-native applications');
        recommendations.push('🟡 Consider Vault for centralized secret management');
        break;
    }

    return recommendations;
  }
}
