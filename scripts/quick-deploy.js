#!/usr/bin/env node

/**
 * Quick deployment script for development/testing
 * This script builds and runs the service locally without Docker
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Quick Deploy - Gnosis Chain wxHOPR Airdrop Service');
console.log('===============================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
    console.log('⚠️  No .env file found. Creating from env.example...');
    const envExamplePath = path.join(__dirname, '..', 'env.example');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file.');
    console.log('\n❗ Please edit .env with your configuration:');
    console.log('  - PRIVATE_KEY: Your wallet private key (without 0x prefix)');
    console.log('  - SECRET_PREIMAGE: Your secret preimage for hash validation');
    console.log('  - AIRDROP_AMOUNT_WEI: Amount to send per claim (default: 0.01 wxHOPR)');
    console.log('\nRun this script again after configuring your .env file.');
    process.exit(1);
}

// Load environment variables
require('dotenv').config();

// Validate required environment variables
if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY === 'your_private_key_here') {
    console.log('❌ PRIVATE_KEY not configured in .env file');
    process.exit(1);
}

if (!process.env.SECRET_PREIMAGE || process.env.SECRET_PREIMAGE === 'your_secret_preimage_here') {
    console.log('❌ SECRET_PREIMAGE not configured in .env file');
    process.exit(1);
}

console.log('✅ Environment configuration validated\n');

// Function to run command
function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        console.log(`🔨 Running: ${command} ${args.join(' ')}`);
        const child = spawn(command, args, { 
            stdio: 'inherit', 
            shell: true,
            ...options 
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with code ${code}`));
            }
        });
    });
}

async function deploy() {
    try {
        // Install dependencies
        console.log('📦 Installing dependencies...');
        await runCommand('npm', ['install']);
        
        // Build the project
        console.log('\n🔨 Building project...');
        await runCommand('npm', ['run', 'build']);
        
        console.log('\n✅ Build completed successfully!');
        console.log('\n🚀 Starting service...');
        
        // Start the service
        await runCommand('npm', ['start']);
        
    } catch (error) {
        console.error('\n❌ Deployment failed:', error.message);
        process.exit(1);
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n\n👋 Deployment interrupted by user');
    process.exit(0);
});

deploy();
