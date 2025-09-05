#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Read the .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const encryptedKeyMatch = envContent.match(/ENCRYPTED_PRIVATE_KEY=([^\\n\\r]+)/);
const passwordMatch = envContent.match(/ENCRYPTION_PASSWORD=([^\\n\\r]+)/);

if (!encryptedKeyMatch || !passwordMatch) {
  console.error('❌ Could not find encrypted key or password in .env file');
  process.exit(1);
}

const encryptedKey = encryptedKeyMatch[1].trim();
const password = passwordMatch[1].trim();

console.log('🔍 Testing decryption...');
console.log(`   Encrypted key length: ${encryptedKey.length}`);
console.log(`   Password length: ${password.length}`);
console.log(`   Key parts: ${encryptedKey.split(':').length}`);

try {
  const decrypted = decryptPrivateKey(encryptedKey, password);
  console.log('✅ Decryption successful!');
  console.log(`   Decrypted key: ${decrypted}`);
  console.log(`   Length: ${decrypted.length} characters`);
  
  // Validate it's a proper private key
  if (decrypted.match(/^[a-fA-F0-9]{64}$/)) {
    console.log('✅ Decrypted key is valid format');
  } else {
    console.log('❌ Decrypted key is not valid format');
  }
  
} catch (error) {
  console.error(`❌ Decryption failed: ${error}`);
}

function decryptPrivateKey(encryptedData, password) {
  const [saltHex, ivHex, encrypted] = encryptedData.split(':');
  
  if (!saltHex || !ivHex || !encrypted) {
    throw new Error('Invalid encrypted key format');
  }
  
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
