#!/usr/bin/env node

/**
 * Re-encryption script for fixing KeyManager encryption mismatch
 * 
 * This script helps migrate from the old broken XOR encryption to the new AES-256-CBC encryption.
 * It can either:
 * 1. Take a plain text private key and encrypt it with the new method
 * 2. Take an old encrypted key, decrypt it with XOR, and re-encrypt with AES-256-CBC
 */

const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// New AES-256-CBC encryption method (matches the fixed KeyManager)
function encryptPrivateKeyNew(privateKey, password) {
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(32);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}`;
}

// Old XOR decryption method (for decrypting old keys)
function decryptPrivateKeyOld(encryptedData, password) {
  try {
    let result = '';
    for (let i = 0; i < encryptedData.length; i += 2) {
      const charCode = parseInt(encryptedData.substr(i, 2), 16) ^ password.charCodeAt((i/2) % password.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (error) {
    throw new Error(`Failed to decrypt with old method: ${error}`);
  }
}

// Test if the encrypted data can be decrypted with the new method
function testNewDecryption(encryptedData, password) {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      return false;
    }
    
    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted.length === 64 && /^[a-fA-F0-9]{64}$/.test(decrypted);
  } catch (error) {
    return false;
  }
}

console.log('🔐 Private Key Re-encryption Tool');
console.log('This tool will help you migrate to the new AES-256-CBC encryption method.');
console.log('');

rl.question('Do you have:\n1. A plain text private key\n2. An old encrypted private key\n\nEnter 1 or 2: ', (choice) => {
  if (choice === '1') {
    // Handle plain text private key
    rl.question('Enter your private key (64 hex characters): ', (privateKey) => {
      if (!privateKey.match(/^[a-fA-F0-9]{64}$/)) {
        console.error('❌ Invalid private key format. Must be 64 hexadecimal characters.');
        process.exit(1);
      }
      
      rl.question('Enter encryption password (min 12 characters): ', (password) => {
        if (password.length < 12) {
          console.error('❌ Password must be at least 12 characters long.');
          process.exit(1);
        }
        
        try {
          const encrypted = encryptPrivateKeyNew(privateKey, password);
          console.log('\n✅ Private key encrypted successfully with new AES-256-CBC method!');
          console.log('\n📋 Add these to your deployment environment variables:');
          console.log(`ENCRYPTED_PRIVATE_KEY=${encrypted}`);
          console.log(`ENCRYPTION_PASSWORD=${password}`);
          console.log('\n⚠️  Store the ENCRYPTION_PASSWORD securely and separately!');
          
        } catch (error) {
          console.error(`❌ Encryption failed: ${error}`);
        }
        
        rl.close();
      });
    });
    
  } else if (choice === '2') {
    // Handle old encrypted private key
    rl.question('Enter your old encrypted private key: ', (oldEncrypted) => {
      rl.question('Enter the password used for the old encryption: ', (password) => {
        try {
          // First, try to decrypt with new method (in case it's already using new encryption)
          if (testNewDecryption(oldEncrypted, password)) {
            console.log('✅ Your key is already using the new AES-256-CBC encryption method!');
            console.log('No re-encryption needed. Your current encrypted key should work.');
            rl.close();
            return;
          }
          
          // Try to decrypt with old XOR method
          console.log('🔄 Attempting to decrypt with old XOR method...');
          const decryptedKey = decryptPrivateKeyOld(oldEncrypted, password);
          
          if (!decryptedKey.match(/^[a-fA-F0-9]{64}$/)) {
            throw new Error('Decrypted key is not in valid format');
          }
          
          console.log('✅ Successfully decrypted with old method!');
          console.log('🔄 Re-encrypting with new AES-256-CBC method...');
          
          const newEncrypted = encryptPrivateKeyNew(decryptedKey, password);
          
          console.log('\n✅ Private key re-encrypted successfully!');
          console.log('\n📋 Replace your environment variables with:');
          console.log(`ENCRYPTED_PRIVATE_KEY=${newEncrypted}`);
          console.log(`ENCRYPTION_PASSWORD=${password}`);
          console.log('\n🔄 Redeploy your application with these new values.');
          
        } catch (error) {
          console.error(`❌ Re-encryption failed: ${error.message}`);
          console.log('\n💡 Possible solutions:');
          console.log('1. Double-check your encrypted key and password');
          console.log('2. If you have the original plain text key, use option 1 instead');
          console.log('3. Generate a new private key if the old one cannot be recovered');
        }
        
        rl.close();
      });
    });
    
  } else {
    console.error('❌ Invalid choice. Please enter 1 or 2.');
    process.exit(1);
  }
});
