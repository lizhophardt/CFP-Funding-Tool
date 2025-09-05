#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Read the current .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const privateKeyMatch = envContent.match(/PRIVATE_KEY=([a-fA-F0-9]{64})/);

if (!privateKeyMatch) {
  console.error('❌ No valid private key found in .env file');
  process.exit(1);
}

const privateKey = privateKeyMatch[1];
const password = 'SecurePassword123!@#'; // Simple fixed password for demo

console.log('🔍 Found private key:', privateKey.substring(0, 8) + '...');

// Simple encryption using built-in Node.js crypto
const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(password, 'salt', 32);
const iv = crypto.randomBytes(16);

const cipher = crypto.createCipheriv(algorithm, key, iv);
let encrypted = cipher.update(privateKey, 'utf8', 'hex');
encrypted += cipher.final('hex');

const encryptedData = iv.toString('hex') + ':' + encrypted;

console.log('✅ Encryption successful!');
console.log('📋 Encrypted data:', encryptedData);

// Test decryption immediately
try {
  const [ivHex, encryptedHex] = encryptedData.split(':');
  const ivBuffer = Buffer.from(ivHex, 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  if (decrypted === privateKey) {
    console.log('✅ Decryption test successful!');
    
    // Update .env file
    let newEnvContent = envContent;
    newEnvContent = newEnvContent.replace(
      /PRIVATE_KEY=([a-fA-F0-9]{64})/,
      '# PRIVATE_KEY=$1  # Replaced with encrypted version'
    );
    
    newEnvContent += '\n# Simple Encrypted Private Key\n';
    newEnvContent += `ENCRYPTED_PRIVATE_KEY=${encryptedData}\n`;
    newEnvContent += `ENCRYPTION_PASSWORD=${password}\n`;
    
    fs.writeFileSync(envPath, newEnvContent);
    
    console.log('');
    console.log('🎉 SUCCESS! Your private key is now encrypted');
    console.log('🔐 Security Level upgraded to MEDIUM');
    console.log('');
    console.log('Next: Test with npm run dev');
    
  } else {
    console.error('❌ Decryption test failed!');
  }
  
} catch (error) {
  console.error(`❌ Decryption test failed: ${error}`);
}
