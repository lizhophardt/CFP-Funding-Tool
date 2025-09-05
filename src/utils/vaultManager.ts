import axios from 'axios';

export class VaultManager {
  private vaultUrl: string;
  private vaultToken: string;
  private keyPath: string;

  constructor() {
    this.vaultUrl = process.env.VAULT_URL || 'http://localhost:8200';
    this.vaultToken = process.env.VAULT_TOKEN || '';
    this.keyPath = process.env.VAULT_KEY_PATH || 'secret/data/private-key';

    if (!this.vaultToken) {
      throw new Error('VAULT_TOKEN is required');
    }
  }

  /**
   * Store encrypted private key in Vault
   */
  async storePrivateKey(privateKey: string, keyName: string = 'default'): Promise<void> {
    try {
      const response = await axios.post(
        `${this.vaultUrl}/v1/${this.keyPath}`,
        {
          data: {
            [keyName]: privateKey,
            created_at: new Date().toISOString(),
            purpose: 'wxhopr-airdrop-signing'
          }
        },
        {
          headers: {
            'X-Vault-Token': this.vaultToken,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(`Vault storage failed: ${response.statusText}`);
      }

      console.log('✅ Private key stored in Vault successfully');
    } catch (error) {
      throw new Error(`Failed to store private key in Vault: ${error}`);
    }
  }

  /**
   * Retrieve private key from Vault
   */
  async getPrivateKey(keyName: string = 'default'): Promise<string> {
    try {
      const response = await axios.get(
        `${this.vaultUrl}/v1/${this.keyPath}`,
        {
          headers: {
            'X-Vault-Token': this.vaultToken
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(`Vault retrieval failed: ${response.statusText}`);
      }

      const privateKey = response.data?.data?.data?.[keyName];
      
      if (!privateKey) {
        throw new Error(`Private key '${keyName}' not found in Vault`);
      }

      return privateKey;
    } catch (error) {
      throw new Error(`Failed to retrieve private key from Vault: ${error}`);
    }
  }

  /**
   * Rotate private key (store new, keep old for transition)
   */
  async rotatePrivateKey(newPrivateKey: string, oldKeyName: string = 'default'): Promise<string> {
    const newKeyName = `${oldKeyName}-${Date.now()}`;
    
    try {
      // Store new key
      await this.storePrivateKey(newPrivateKey, newKeyName);
      
      // Update active key reference
      await this.storePrivateKey(newKeyName, 'active');
      
      console.log(`✅ Private key rotated. New key: ${newKeyName}`);
      return newKeyName;
    } catch (error) {
      throw new Error(`Key rotation failed: ${error}`);
    }
  }

  /**
   * Get setup instructions for HashiCorp Vault
   */
  static getSetupInstructions(): string {
    return `
🏛️ HashiCorp Vault Setup Instructions:

1. Install and Start Vault:
   # Download from https://www.vaultproject.io/downloads
   vault server -dev  # Development mode
   # Or use Docker: docker run --cap-add=IPC_LOCK -p 8200:8200 vault:latest

2. Configure Vault:
   export VAULT_ADDR='http://localhost:8200'
   vault auth -method=userpass username=admin password=your-password
   vault secrets enable -path=secret kv-v2

3. Environment Variables:
   VAULT_URL=http://localhost:8200
   VAULT_TOKEN=your-vault-token
   VAULT_KEY_PATH=secret/data/private-keys

4. Store Private Key:
   node scripts/vault-store-key.js

5. Production Considerations:
   - Use TLS/HTTPS for Vault communication
   - Implement proper authentication (AppRole, AWS IAM, etc.)
   - Set up Vault clustering for high availability
   - Configure automatic unsealing
   - Implement key rotation policies

Benefits:
✅ Centralized secret management
✅ Audit logging
✅ Automatic key rotation
✅ Fine-grained access control
✅ Integration with cloud providers
`;
  }
}
