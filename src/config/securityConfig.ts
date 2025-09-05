import { KeyManager } from '../utils/keyManager';
// import { KMSKeyManager, getKMSPrivateKey } from '../utils/kmsKeyManager';
// import { VaultManager } from '../utils/vaultManager';

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
    if (process.env.MULTISIG_ADDRESS && process.env.SERVER_PRIVATE_KEY) {
      return KeyManagementStrategy.MULTISIG;
    }
    
    if (process.env.VAULT_URL && process.env.VAULT_TOKEN) {
      return KeyManagementStrategy.VAULT;
    }
    
    if (process.env.AWS_KMS_KEY_ID && process.env.KMS_ENCRYPTED_PRIVATE_KEY) {
      return KeyManagementStrategy.AWS_KMS;
    }
    
    if (process.env.ENCRYPTED_PRIVATE_KEY && process.env.ENCRYPTION_PASSWORD) {
      return KeyManagementStrategy.ENCRYPTED;
    }
    
    if (process.env.PRIVATE_KEY) {
      console.warn('⚠️  Using plain text private key. This is not secure for production!');
      return KeyManagementStrategy.PLAIN_TEXT;
    }
    
    throw new Error('No private key configuration found');
  }

  async getPrivateKey(): Promise<string> {
    try {
      switch (this.strategy) {
        case KeyManagementStrategy.MULTISIG:
          console.log('🏦 Using MultiSig wallet configuration');
          return process.env.SERVER_PRIVATE_KEY || '';

        case KeyManagementStrategy.VAULT:
          console.log('🏛️ Retrieving private key from Vault');
          // const vaultManager = new VaultManager();
          // return await vaultManager.getPrivateKey();
          throw new Error('Vault support requires additional setup');

        case KeyManagementStrategy.AWS_KMS:
          console.log('☁️ Decrypting private key with AWS KMS');
          // return await getKMSPrivateKey();
          throw new Error('AWS KMS support requires additional setup');

        case KeyManagementStrategy.ENCRYPTED:
          console.log('🔐 Decrypting private key with local encryption');
          const encryptedKey = process.env.ENCRYPTED_PRIVATE_KEY!;
          const password = process.env.ENCRYPTION_PASSWORD!;
          return KeyManager.decryptPrivateKey(encryptedKey, password);

        case KeyManagementStrategy.PLAIN_TEXT:
          console.warn('⚠️  Using plain text private key');
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
      case KeyManagementStrategy.AWS_KMS:
        return 'HIGH';
      case KeyManagementStrategy.VAULT:
      case KeyManagementStrategy.MULTISIG:
        return 'ENTERPRISE';
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

      case KeyManagementStrategy.AWS_KMS:
        recommendations.push('🟢 Excellent: Using AWS KMS for key management');
        recommendations.push('🟡 Consider MultiSig for maximum security');
        recommendations.push('🟡 Implement key rotation policies');
        break;

      case KeyManagementStrategy.VAULT:
        recommendations.push('🟢 Excellent: Using Vault for secret management');
        recommendations.push('🟡 Implement automatic key rotation');
        recommendations.push('🟡 Consider MultiSig for distributed trust');
        break;

      case KeyManagementStrategy.MULTISIG:
        recommendations.push('🟢 Excellent: Using MultiSig for distributed security');
        recommendations.push('🟢 Maximum security achieved');
        recommendations.push('🟡 Ensure proper key distribution among trusted parties');
        break;
    }

    return recommendations;
  }
}
