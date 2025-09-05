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
const password = 'MySecurePassword123';

console.log('🔍 Encrypting private key...');

// Use simple XOR encryption for demo (not production grade but works)
function simpleEncrypt(text, password) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ password.charCodeAt(i % password.length);
    result += charCode.toString(16).padStart(2, '0');
  }
  return result;
}

function simpleDecrypt(encrypted, password) {
  let result = '';
  for (let i = 0; i < encrypted.length; i += 2) {
    const charCode = parseInt(encrypted.substr(i, 2), 16) ^ password.charCodeAt((i/2) % password.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}

const encrypted = simpleEncrypt(privateKey, password);

// Test decryption
const decrypted = simpleDecrypt(encrypted, password);

if (decrypted === privateKey) {
  console.log('✅ Encryption/decryption test successful!');
  
  // Update .env file
  let newEnvContent = envContent;
  newEnvContent = newEnvContent.replace(
    /PRIVATE_KEY=([a-fA-F0-9]{64})/,
    '# PRIVATE_KEY=$1  # Replaced with encrypted version'
  );
  
  newEnvContent += '\n# Encrypted Private Key (Simple XOR)\n';
  newEnvContent += `ENCRYPTED_PRIVATE_KEY=${encrypted}\n`;
  newEnvContent += `ENCRYPTION_PASSWORD=${password}\n`;
  
  fs.writeFileSync(envPath, newEnvContent);
  
  console.log('🎉 SUCCESS! Private key encrypted');
  console.log(`   Encrypted: ${encrypted}`);
  console.log(`   Password: ${password}`);
  console.log('');
  console.log('🚀 Now test with: npm run dev');
  
} else {
  console.error('❌ Encryption test failed!');
  console.error(`Expected: ${privateKey}`);
  console.error(`Got: ${decrypted}`);
}
