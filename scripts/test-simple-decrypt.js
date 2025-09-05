#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Read current .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const encryptedMatch = envContent.match(/ENCRYPTED_PRIVATE_KEY=([^\\n\\r]+)/);
const passwordMatch = envContent.match(/ENCRYPTION_PASSWORD=([^\\n\\r]+)/);

if (!encryptedMatch || !passwordMatch) {
  console.error('❌ Could not find encrypted data');
  process.exit(1);
}

const encryptedData = encryptedMatch[1].trim();
const password = passwordMatch[1].trim();

console.log('🔍 Testing simple decryption...');
console.log(`   Encrypted data: ${encryptedData}`);
console.log(`   Password: ${password}`);

try {
  // Simple decryption matching the encryption
  const [ivHex, encrypted] = encryptedData.split(':');
  
  if (!ivHex || !encrypted) {
    throw new Error('Invalid format');
  }
  
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(password, 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  console.log('✅ Decryption successful!');
  console.log(`   Decrypted: ${decrypted}`);
  console.log(`   Length: ${decrypted.length}`);
  console.log(`   Valid format: ${decrypted.match(/^[a-fA-F0-9]{64}$/) ? 'Yes' : 'No'}`);
  
} catch (error) {
  console.error(`❌ Decryption failed: ${error}`);
}
