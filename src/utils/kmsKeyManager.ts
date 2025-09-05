import { KMSClient, DecryptCommand, EncryptCommand } from '@aws-sdk/client-kms';
import * as crypto from 'crypto';

export class KMSKeyManager {
  private kmsClient: KMSClient;
  private keyId: string;

  constructor(region: string = 'us-east-1', keyId?: string) {
    this.kmsClient = new KMSClient({ region });
    this.keyId = keyId || process.env.AWS_KMS_KEY_ID || '';
    
    if (!this.keyId) {
      throw new Error('AWS KMS Key ID is required');
    }
  }

  /**
   * Encrypt private key using AWS KMS
   */
  async encryptPrivateKey(privateKey: string): Promise<string> {
    try {
      const command = new EncryptCommand({
        KeyId: this.keyId,
        Plaintext: Buffer.from(privateKey, 'utf8'),
        EncryptionContext: {
          purpose: 'private-key-encryption',
          service: 'wxhopr-airdrop'
        }
      });

      const result = await this.kmsClient.send(command);
      
      if (!result.CiphertextBlob) {
        throw new Error('KMS encryption returned no ciphertext');
      }

      return Buffer.from(result.CiphertextBlob).toString('base64');
    } catch (error) {
      throw new Error(`KMS encryption failed: ${error}`);
    }
  }

  /**
   * Decrypt private key using AWS KMS
   */
  async decryptPrivateKey(encryptedKey: string): Promise<string> {
    try {
      const command = new DecryptCommand({
        CiphertextBlob: Buffer.from(encryptedKey, 'base64'),
        EncryptionContext: {
          purpose: 'private-key-encryption',
          service: 'wxhopr-airdrop'
        }
      });

      const result = await this.kmsClient.send(command);
      
      if (!result.Plaintext) {
        throw new Error('KMS decryption returned no plaintext');
      }

      return Buffer.from(result.Plaintext).toString('utf8');
    } catch (error) {
      throw new Error(`KMS decryption failed: ${error}`);
    }
  }

  /**
   * Generate setup instructions for AWS KMS
   */
  static getSetupInstructions(): string {
    return `
🔐 AWS KMS Setup Instructions:

1. Install AWS SDK:
   npm install @aws-sdk/client-kms

2. Create KMS Key in AWS Console:
   - Go to AWS KMS Console
   - Create a symmetric key for encryption/decryption
   - Note the Key ID (e.g., arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012)

3. Set up IAM permissions:
   - Create IAM user/role with KMS permissions
   - Attach policy allowing kms:Encrypt and kms:Decrypt

4. Configure environment variables:
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   AWS_KMS_KEY_ID=your_key_id
   KMS_ENCRYPTED_PRIVATE_KEY=your_encrypted_key

5. Use encryption script to encrypt your private key:
   node scripts/kms-encrypt-key.js
`;
  }
}

// Usage example in config
export async function getKMSPrivateKey(): Promise<string> {
  const encryptedKey = process.env.KMS_ENCRYPTED_PRIVATE_KEY;
  
  if (!encryptedKey) {
    throw new Error('KMS_ENCRYPTED_PRIVATE_KEY not found');
  }
  
  const kmsManager = new KMSKeyManager();
  return await kmsManager.decryptPrivateKey(encryptedKey);
}
