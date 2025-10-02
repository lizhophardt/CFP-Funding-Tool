import * as crypto from 'crypto';
import { logger } from './logger';

export class KeyManager {
  private static readonly ALGORITHM = 'aes-256-cbc';
  
  /**
   * Encrypt a private key for storage
   */
  static encryptPrivateKey(privateKey: string, password: string): string {
    const iv = crypto.randomBytes(16);
    const salt = crypto.randomBytes(32);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}`;
  }
  
  /**
   * Decrypt a private key from storage
   */
  static decryptPrivateKey(encryptedData: string, password: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const salt = Buffer.from(parts[0], 'hex');
      const iv = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
      
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Failed to decrypt private key', { error: error instanceof Error ? error.message : error });
      throw new Error(`Failed to decrypt private key: ${error instanceof Error ? error.message : error}`);
    }
  }
  
  /**
   * Generate encryption script for initial setup
   */
  static generateEncryptionScript(): string {
    return `
#!/usr/bin/env node
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

logger.info('🔐 Private Key Encryption Tool');
logger.info('This will encrypt your private key for secure storage.');

rl.question('Enter your private key (64 hex chars): ', (privateKey) => {
  if (!privateKey.match(/^[a-fA-F0-9]{64}$/)) {
    logger.error('❌ Invalid private key format');
    process.exit(1);
  }
  
  rl.question('Enter encryption password: ', (password) => {
    if (password.length < 12) {
      logger.error('❌ Password must be at least 12 characters');
      process.exit(1);
    }
    
    try {
      const encrypted = encryptPrivateKey(privateKey, password);
      logger.success('Private key encrypted successfully!');
      logger.info('Add this to your .env file:', {
        ENCRYPTED_PRIVATE_KEY: encrypted,
        ENCRYPTION_PASSWORD: password
      });
      logger.warning('Store the ENCRYPTION_PASSWORD securely and separately!');
      
    } catch (error) {
      logger.error(\`❌ Encryption failed: \${error}\`);
    }
    
    rl.close();
  });
});

function encryptPrivateKey(privateKey, password) {
  // Same implementation as above
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(32);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return \`\${salt.toString('hex')}:\${iv.toString('hex')}:\${encrypted}\`;
}
`;
  }
}
