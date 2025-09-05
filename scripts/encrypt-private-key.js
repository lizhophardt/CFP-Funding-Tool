#!/usr/bin/env node
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Private Key Encryption Tool');
console.log('This will encrypt your private key for secure storage.');
console.log('');

rl.question('Enter your private key (64 hex chars, without 0x): ', (privateKey) => {
  if (!privateKey.match(/^[a-fA-F0-9]{64}$/)) {
    console.error('❌ Invalid private key format. Must be 64 hexadecimal characters.');
    process.exit(1);
  }
  
  rl.question('Enter encryption password (min 12 chars): ', (password) => {
    if (password.length < 12) {
      console.error('❌ Password must be at least 12 characters');
      process.exit(1);
    }
    
    try {
      const encrypted = encryptPrivateKey(privateKey, password);
      console.log('');
      console.log('✅ Private key encrypted successfully!');
      console.log('');
      console.log('Add these to your .env file:');
      console.log(`ENCRYPTED_PRIVATE_KEY=${encrypted}`);
      console.log(`ENCRYPTION_PASSWORD=${password}`);
      console.log('');
      console.log('⚠️  SECURITY RECOMMENDATIONS:');
      console.log('1. Store ENCRYPTION_PASSWORD separately from ENCRYPTED_PRIVATE_KEY');
      console.log('2. Consider using environment-specific password management');
      console.log('3. Remove the old PRIVATE_KEY variable from .env');
      console.log('4. Never commit the encryption password to version control');
      
    } catch (error) {
      console.error(`❌ Encryption failed: ${error}`);
    }
    
    rl.close();
  });
});

function encryptPrivateKey(privateKey, password) {
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(32);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  
  const cipher = crypto.createCipher('aes-256-gcm', key);
  cipher.setAAD(Buffer.from('privatekey'));
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
