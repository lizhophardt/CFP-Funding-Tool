#!/usr/bin/env node

/**
 * Generate unique secret codes for the airdrop system
 * Usage: node scripts/generate-secret-codes.js [count] [prefix]
 */

const crypto = require('crypto');

// Configuration
const DEFAULT_COUNT = 50;
const DEFAULT_PREFIX = 'Code';

// Word lists for generating memorable codes
const ADJECTIVES = [
    'Secret', 'Hidden', 'Magic', 'Golden', 'Silver', 'Diamond', 'Royal', 'Elite',
    'Premium', 'Special', 'Rare', 'Epic', 'Legendary', 'Mystic', 'Ancient',
    'Cosmic', 'Thunder', 'Lightning', 'Fire', 'Ice', 'Shadow', 'Light',
    'Dark', 'Bright', 'Swift', 'Strong', 'Mighty', 'Wild', 'Free', 'Bold'
];

const NOUNS = [
    'Dragon', 'Phoenix', 'Tiger', 'Eagle', 'Wolf', 'Lion', 'Bear', 'Hawk',
    'Falcon', 'Raven', 'Serpent', 'Panther', 'Jaguar', 'Leopard', 'Cheetah',
    'Knight', 'Warrior', 'Guardian', 'Champion', 'Hero', 'Legend', 'Master',
    'Sage', 'Oracle', 'Prophet', 'Wizard', 'Mage', 'Sorcerer', 'Enchanter',
    'Hunter', 'Ranger', 'Scout', 'Explorer', 'Adventurer', 'Voyager', 'Pioneer',
    'Star', 'Moon', 'Sun', 'Storm', 'Thunder', 'Lightning', 'Flame', 'Frost',
    'Crystal', 'Gem', 'Pearl', 'Ruby', 'Emerald', 'Sapphire', 'Diamond'
];

function generateRandomCode(prefix = DEFAULT_PREFIX) {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const number = Math.floor(Math.random() * 9999) + 1;
    
    return `${prefix}${adjective}${noun}${number}`;
}

function generateSimpleCode(prefix = DEFAULT_PREFIX) {
    const randomString = crypto.randomBytes(4).toString('hex').toUpperCase();
    const number = Math.floor(Math.random() * 999) + 1;
    
    return `${prefix}${randomString}${number}`;
}

function generateMemorableCode() {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const number = Math.floor(Math.random() * 99) + 1;
    
    return `${adjective}${noun}${number}`;
}

function generateSecretCodes(count, type = 'memorable', prefix = DEFAULT_PREFIX) {
    const codes = new Set();
    
    while (codes.size < count) {
        let code;
        
        switch (type) {
            case 'simple':
                code = generateSimpleCode(prefix);
                break;
            case 'random':
                code = generateRandomCode(prefix);
                break;
            case 'memorable':
            default:
                code = generateMemorableCode();
                break;
        }
        
        codes.add(code);
    }
    
    return Array.from(codes);
}

function main() {
    const args = process.argv.slice(2);
    const count = parseInt(args[0]) || DEFAULT_COUNT;
    const type = args[1] || 'memorable';
    const prefix = args[2] || DEFAULT_PREFIX;
    
    console.log(`🔑 Generating ${count} secret codes...`);
    console.log(`📝 Type: ${type}`);
    if (type !== 'memorable') {
        console.log(`🏷️  Prefix: ${prefix}`);
    }
    console.log('');
    
    const codes = generateSecretCodes(count, type, prefix);
    
    console.log('✅ Generated Secret Codes:');
    console.log('========================');
    
    // Display codes in a nice format
    codes.forEach((code, index) => {
        console.log(`${String(index + 1).padStart(2, '0')}. ${code}`);
    });
    
    console.log('');
    console.log('📋 For your .env file (copy this line):');
    console.log('=====================================');
    console.log(`SECRET_CODES=${codes.join(',')}`);
    
    console.log('');
    console.log('💡 Usage Tips:');
    console.log('- Each code can only be used once');
    console.log('- Codes are case-sensitive');
    console.log('- Share these codes with your airdrop recipients');
    console.log('- Keep a backup of unused codes');
}

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('🔑 Secret Code Generator for wxHOPR Airdrop');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/generate-secret-codes.js [count] [type] [prefix]');
    console.log('');
    console.log('Arguments:');
    console.log('  count   Number of codes to generate (default: 50)');
    console.log('  type    Type of codes: memorable, simple, random (default: memorable)');
    console.log('  prefix  Prefix for simple/random codes (default: Code)');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/generate-secret-codes.js 50');
    console.log('  node scripts/generate-secret-codes.js 100 memorable');
    console.log('  node scripts/generate-secret-codes.js 25 simple Airdrop');
    console.log('  node scripts/generate-secret-codes.js 75 random HOPR');
    console.log('');
    console.log('Code Types:');
    console.log('  memorable: MagicDragon42, SecretPhoenix99 (easy to remember)');
    console.log('  simple:    CodeAB1F123, AirdropC2E4567 (prefix + hex + number)');
    console.log('  random:    CodeMightyEagle1234, HOPRSecretWolf5678 (prefix + words + number)');
    process.exit(0);
}

main();
