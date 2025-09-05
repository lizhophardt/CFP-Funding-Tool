#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Read the current .env file
const envPath = path.join(__dirname, '..', '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const privateKeyMatch = envContent.match(/PRIVATE_KEY=([a-fA-F0-9]{64})/);

if (!privateKeyMatch) {
  console.error('❌ No valid private key found in .env file');
  process.exit(1);
}

const privateKey = privateKeyMatch[1];
console.log('🔍 Found private key in .env file');
console.log(`   Length: ${privateKey.length} characters`);

// Generate a secure password
const password = generateSecurePassword();
console.log('🔐 Generated secure encryption password');

// Encrypt the private key
try {
  const encrypted = encryptPrivateKey(privateKey, password);
  console.log('✅ Private key encrypted successfully!');
  
  // Create backup of current .env
  const backupPath = envPath + '.backup.' + Date.now();
  fs.copyFileSync(envPath, backupPath);
  console.log(`💾 Created backup: ${path.basename(backupPath)}`);
  
  // Update .env file
  let newEnvContent = envContent;
  
  // Comment out old private key
  newEnvContent = newEnvContent.replace(
    /PRIVATE_KEY=([a-fA-F0-9]{64})/,
    '# PRIVATE_KEY=$1  # Replaced with encrypted version below'
  );
  
  // Add encrypted key and password
  newEnvContent += '\n# Encrypted Private Key Configuration\n';
  newEnvContent += `ENCRYPTED_PRIVATE_KEY=${encrypted}\n`;
  newEnvContent += `ENCRYPTION_PASSWORD=${password}\n`;
  
  fs.writeFileSync(envPath, newEnvContent);
  
  console.log('');
  console.log('🎉 SUCCESS! Your private key is now encrypted');
  console.log('');
  console.log('📋 What was added to your .env file:');
  console.log(`   ENCRYPTED_PRIVATE_KEY=${encrypted}`);
  console.log(`   ENCRYPTION_PASSWORD=${password}`);
  console.log('');
  console.log('⚠️  IMPORTANT SECURITY NOTES:');
  console.log('1. Your original private key has been commented out (not deleted)');
  console.log('2. The encryption password is stored in the same file for convenience');
  console.log('3. For maximum security, store the password separately');
  console.log('4. The backup file contains your original .env - keep it secure');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('1. Test the setup: npm run dev');
  console.log('2. Look for "Security Level: MEDIUM" in the logs');
  console.log('3. If working, delete the backup file');
  
} catch (error) {
  console.error(`❌ Encryption failed: ${error}`);
  process.exit(1);
}

function generateSecurePassword(length = 24) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

function encryptPrivateKey(privateKey, password) {
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(32);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}`;
}
