#!/usr/bin/env node

/**
 * Key Helper CLI Tool
 * 
 * A comprehensive CLI tool for private key management tasks including:
 * - Encrypting private keys for production deployment
 * - Decrypting keys for verification
 * - Validating key formats
 * - Generating deployment configurations
 * 
 * Usage:
 *   npm run key-helper
 *   node scripts/key-helper.js [command]
 */

const crypto = require('crypto');
const readline = require('readline');

class KeyHelper {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async run() {
    console.log('🔐 Private Key Management Helper');
    console.log('');
    
    const command = process.argv[2];
    
    try {
      switch (command) {
        case 'encrypt':
        case 'e':
          await this.encryptKey();
          break;
        case 'decrypt':
        case 'd':
          await this.decryptKey();
          break;
        case 'validate':
        case 'v':
          await this.validateKey();
          break;
        case 'generate-config':
        case 'g':
          await this.generateConfig();
          break;
        case 'help':
        case 'h':
        case undefined:
          this.showHelp();
          break;
        default:
          console.log(`❌ Unknown command: ${command}`);
          this.showHelp();
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  showHelp() {
    console.log('📖 Available Commands:');
    console.log('');
    console.log('  encrypt, e        Encrypt a private key for production');
    console.log('  decrypt, d        Decrypt an encrypted private key');
    console.log('  validate, v       Validate private key format');
    console.log('  generate-config, g Generate deployment configuration');
    console.log('  help, h           Show this help message');
    console.log('');
    console.log('🔒 Encryption Details:');
    console.log('  Algorithm: AES-256-CBC with PBKDF2');
    console.log('  Key Derivation: 100,000 iterations, SHA-256');
    console.log('  Format: salt:iv:encrypted_data (hex-encoded)');
    console.log('');
    console.log('📖 Examples:');
    console.log('  npm run key-helper encrypt');
    console.log('  node scripts/key-helper.js decrypt');
    console.log('  npm run key-helper validate');
  }

  async encryptKey() {
    console.log('🔐 Encrypt Private Key for Production');
    console.log('');
    
    const privateKey = await this.askQuestion('Enter your private key (without 0x): ');
    
    if (!this.isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key format. Must be 64 hexadecimal characters.');
    }
    
    const password = await this.askQuestion('Enter encryption password (min 12 chars): ');
    
    if (password.length < 12) {
      throw new Error('Password must be at least 12 characters long.');
    }
    
    const encrypted = this.encryptPrivateKey(privateKey, password);
    
    console.log('');
    console.log('✅ Private key encrypted successfully!');
    console.log('');
    console.log('📋 Add to your .env file:');
    console.log('─'.repeat(60));
    console.log(`ENCRYPTED_PRIVATE_KEY=${encrypted}`);
    console.log(`ENCRYPTION_PASSWORD=${password}`);
    console.log('─'.repeat(60));
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Copy the variables above to your .env file');
    console.log('2. Comment out or remove the PRIVATE_KEY variable');
    console.log('3. Deploy your application');
    console.log('');
    console.log('⚠️  Security Reminder:');
    console.log('Store the ENCRYPTION_PASSWORD securely and separately from the encrypted key.');
  }

  async decryptKey() {
    console.log('🔓 Decrypt Private Key for Verification');
    console.log('');
    
    const encryptedKey = await this.askQuestion('Enter encrypted private key: ');
    const password = await this.askQuestion('Enter encryption password: ');
    
    try {
      const decrypted = this.decryptPrivateKey(encryptedKey, password);
      console.log('');
      console.log('✅ Decryption successful!');
      console.log(`🔑 Decrypted key: ${decrypted}`);
      console.log('');
      console.log('⚠️  Keep this key secure and delete from terminal history!');
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  async validateKey() {
    console.log('✅ Validate Private Key Format');
    console.log('');
    
    const key = await this.askQuestion('Enter private key to validate: ');
    const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
    
    if (this.isValidPrivateKey(cleanKey)) {
      console.log('✅ Valid private key format!');
      console.log(`📏 Length: ${cleanKey.length} characters`);
      console.log('🔤 Format: Hexadecimal');
    } else {
      console.log('❌ Invalid private key format!');
      console.log('📋 Requirements:');
      console.log('  - Must be exactly 64 hexadecimal characters');
      console.log('  - Can optionally start with 0x');
      console.log('  - Only characters 0-9 and a-f (case insensitive)');
    }
  }

  async generateConfig() {
    console.log('⚙️  Generate Deployment Configuration');
    console.log('');
    
    const deploymentType = await this.askQuestion('Deployment type (railway/docker/local): ');
    const useEncryption = await this.askQuestion('Use encrypted private key? (y/n): ');
    
    console.log('');
    console.log('📋 Generated Configuration:');
    console.log('─'.repeat(60));
    
    if (deploymentType.toLowerCase() === 'railway') {
      this.generateRailwayConfig(useEncryption.toLowerCase() === 'y');
    } else if (deploymentType.toLowerCase() === 'docker') {
      this.generateDockerConfig(useEncryption.toLowerCase() === 'y');
    } else {
      this.generateLocalConfig(useEncryption.toLowerCase() === 'y');
    }
    
    console.log('─'.repeat(60));
    console.log('');
    console.log('💡 Tips:');
    console.log('• Replace placeholder values with your actual configuration');
    console.log('• Never commit private keys or passwords to version control');
    console.log('• Use environment-specific secret management in production');
  }

  generateRailwayConfig(useEncryption) {
    console.log('# Railway Environment Variables');
    console.log('DATABASE_URL=${{Postgres.DATABASE_URL}}');
    console.log('GNOSIS_RPC_URL=https://rpc.gnosischain.com');
    console.log('WXHOPR_TOKEN_ADDRESS=0xD4fdec44DB9D44B8f2b6d529620f9C0C7066A2c1');
    
    if (useEncryption) {
      console.log('ENCRYPTED_PRIVATE_KEY=your_encrypted_private_key');
      console.log('ENCRYPTION_PASSWORD=your_encryption_password');
    } else {
      console.log('PRIVATE_KEY=your_private_key_without_0x');
    }
    
    console.log('AIRDROP_AMOUNT_WEI=10000000000000000');
    console.log('XDAI_AIRDROP_AMOUNT_WEI=10000000000000000');
    console.log('PORT=3000');
    console.log('NODE_ENV=production');
  }

  generateDockerConfig(useEncryption) {
    console.log('# Docker Compose .env file');
    console.log('GNOSIS_RPC_URL=https://rpc.gnosischain.com');
    console.log('WXHOPR_TOKEN_ADDRESS=0xD4fdec44DB9D44B8f2b6d529620f9C0C7066A2c1');
    
    if (useEncryption) {
      console.log('ENCRYPTED_PRIVATE_KEY=your_encrypted_private_key');
      console.log('ENCRYPTION_PASSWORD=your_encryption_password');
    } else {
      console.log('PRIVATE_KEY=your_private_key_without_0x');
    }
    
    console.log('DATABASE_URL=postgresql://postgres:password@postgres:5432/cfp_funding_tool');
    console.log('AIRDROP_AMOUNT_WEI=10000000000000000');
    console.log('XDAI_AIRDROP_AMOUNT_WEI=10000000000000000');
    console.log('PORT=3000');
    console.log('NODE_ENV=development');
  }

  generateLocalConfig(useEncryption) {
    console.log('# Local .env file');
    console.log('GNOSIS_RPC_URL=https://rpc.gnosischain.com');
    console.log('WXHOPR_TOKEN_ADDRESS=0xD4fdec44DB9D44B8f2b6d529620f9C0C7066A2c1');
    
    if (useEncryption) {
      console.log('ENCRYPTED_PRIVATE_KEY=your_encrypted_private_key');
      console.log('ENCRYPTION_PASSWORD=your_encryption_password');
    } else {
      console.log('PRIVATE_KEY=your_private_key_without_0x');
    }
    
    console.log('DATABASE_URL=postgresql://postgres:password@localhost:5432/cfp_funding_tool');
    console.log('AIRDROP_AMOUNT_WEI=10000000000000000');
    console.log('XDAI_AIRDROP_AMOUNT_WEI=10000000000000000');
    console.log('SECRET_CODES=DontTellUncleSam,SecretCode123,HiddenTreasure');
    console.log('PORT=3000');
    console.log('NODE_ENV=development');
  }

  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  isValidPrivateKey(key) {
    const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
    return /^[a-fA-F0-9]{64}$/.test(cleanKey);
  }

  encryptPrivateKey(privateKey, password) {
    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    
    const iv = crypto.randomBytes(16);
    const salt = crypto.randomBytes(32);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(cleanKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}`;
  }

  decryptPrivateKey(encryptedData, password) {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Operation cancelled by user');
  process.exit(0);
});

// Run the CLI tool
const keyHelper = new KeyHelper();
keyHelper.run().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
