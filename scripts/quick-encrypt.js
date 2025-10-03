#!/usr/bin/env node

/**
 * Quick Private Key Encryption Tool
 * 
 * A simplified interface for encrypting private keys for production deployment.
 * Uses AES-256-CBC with PBKDF2 key derivation (100,000 iterations, SHA-256).
 * 
 * Usage:
 *   npm run quick-encrypt
 *   node scripts/quick-encrypt.js
 */

const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Quick Private Key Encryption for Deployment');
console.log('');
console.log('🔐 Algorithm: AES-256-CBC with PBKDF2');
console.log('🔑 Key Derivation: 100,000 iterations, SHA-256');
console.log('📦 Output Format: salt:iv:encrypted_data (hex-encoded)');
console.log('');

async function main() {
  try {
    const privateKey = await askQuestion('Enter your private key (without 0x prefix): ');
    
    if (!isValidPrivateKey(privateKey)) {
      console.error('❌ Invalid private key format. Must be 64 hexadecimal characters.');
      process.exit(1);
    }
    
    const password = await askQuestion('Enter encryption password (min 12 characters): ');
    
    if (password.length < 12) {
      console.error('❌ Password must be at least 12 characters long.');
      process.exit(1);
    }
    
    const encrypted = encryptPrivateKey(privateKey, password);
    
    console.log('');
    console.log('✅ Private key encrypted successfully!');
    console.log('');
    console.log('📋 Environment Variables for .env:');
    console.log('─'.repeat(50));
    console.log(`ENCRYPTED_PRIVATE_KEY=${encrypted}`);
    console.log(`ENCRYPTION_PASSWORD=${password}`);
    console.log('─'.repeat(50));
    console.log('');
    console.log('🚀 Quick Deployment Steps:');
    console.log('1. Copy the variables above to your .env file');
    console.log('2. Comment out or remove the PRIVATE_KEY variable');
    console.log('3. Deploy using: npm run deploy or docker-compose up');
    console.log('');
    console.log('⚠️  Security Recommendations:');
    console.log('• Store ENCRYPTION_PASSWORD separately in production');
    console.log('• Use environment-specific secret management');
    console.log('• Never commit passwords to version control');
    console.log('• Consider using Railway variables or Docker secrets');
    
  } catch (error) {
    console.error(`❌ Encryption failed: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function isValidPrivateKey(key) {
  // Remove 0x prefix if present
  const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
  return /^[a-fA-F0-9]{64}$/.test(cleanKey);
}

function encryptPrivateKey(privateKey, password) {
  // Remove 0x prefix if present
  const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(32);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(cleanKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}`;
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Encryption cancelled by user');
  process.exit(0);
});

// Run the main function
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
