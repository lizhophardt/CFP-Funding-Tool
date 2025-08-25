#!/usr/bin/env node

const crypto = require('crypto');

function generateHash(preimage) {
  return crypto.createHash('sha256').update(preimage, 'utf8').digest('hex');
}

// Get preimage from command line arguments
const preimage = process.argv[2];

if (!preimage) {
  console.log('Usage: node scripts/generate-hash.js <preimage>');
  console.log('Example: node scripts/generate-hash.js "hello world"');
  process.exit(1);
}

const hash = generateHash(preimage);

console.log('Preimage:', preimage);
console.log('SHA-256 Hash:', hash);
console.log('');
console.log('Use this hash in your airdrop claim:');
console.log(`curl -X POST http://localhost:3000/api/airdrop/claim \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -d '{`);
console.log(`    "hash": "${hash}",`);
console.log(`    "recipientAddress": "0xYourAddressHere"`);
console.log(`  }'`);
