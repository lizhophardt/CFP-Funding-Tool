#!/usr/bin/env node

/**
 * Test Security System Demonstration
 * 
 * This script demonstrates the test private key detection system.
 * It shows how the system responds to different types of test keys.
 * 
 * Usage:
 *   node examples/test-security-system.js [test-key-type]
 * 
 * Test key types:
 *   - hardhat0: Hardhat default account #0
 *   - ganache0: Ganache default account #0
 *   - pattern-a: Repeated 'a' pattern
 *   - deadbeef: Classic deadbeef pattern
 *   - low-entropy: Low entropy key
 *   - valid: Valid secure key
 */

const testKeys = {
  'hardhat0': {
    key: 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    description: 'Hardhat default account #0 - widely known and documented'
  },
  'ganache0': {
    key: '4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
    description: 'Ganache CLI default account #0 - widely known'
  },
  'pattern-a': {
    key: 'a'.repeat(64),
    description: 'Simple test pattern (all "a" characters) - commonly used in tests'
  },
  'deadbeef': {
    key: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    description: 'Classic "deadbeef" test pattern - widely known'
  },
  'low-entropy': {
    key: 'abcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabc',
    description: 'Low entropy key with only 3 unique characters'
  },
  'valid': {
    key: 'e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35',
    description: 'Valid private key with good entropy - should pass validation'
  }
};

function showUsage() {
  console.log('Test Security System Demonstration');
  console.log('');
  console.log('Usage: node examples/test-security-system.js [test-key-type] [environment]');
  console.log('');
  console.log('Test key types:');
  Object.keys(testKeys).forEach(key => {
    console.log(`  ${key.padEnd(12)} - ${testKeys[key].description}`);
  });
  console.log('');
  console.log('Environment: development (default) | production');
  console.log('');
  console.log('Examples:');
  console.log('  node examples/test-security-system.js hardhat0 development');
  console.log('  node examples/test-security-system.js pattern-a production');
  console.log('  node examples/test-security-system.js valid production');
}

function main() {
  const args = process.argv.slice(2);
  const testKeyType = args[0];
  const environment = args[1] || 'development';

  if (!testKeyType || testKeyType === '--help' || testKeyType === '-h') {
    showUsage();
    return;
  }

  if (!testKeys[testKeyType]) {
    console.error(`❌ Unknown test key type: ${testKeyType}`);
    console.error('');
    showUsage();
    process.exit(1);
  }

  const testKey = testKeys[testKeyType];
  
  console.log('🔒 Test Private Key Security System Demonstration');
  console.log('='.repeat(60));
  console.log(`Test Key Type: ${testKeyType}`);
  console.log(`Environment: ${environment}`);
  console.log(`Description: ${testKey.description}`);
  console.log(`Private Key: ${testKey.key.substring(0, 16)}...`);
  console.log('='.repeat(60));
  console.log('');

  // Set up environment variables
  process.env.NODE_ENV = environment;
  process.env.PRIVATE_KEY = testKey.key;
  
  // Mock required environment variables
  process.env.GNOSIS_RPC_URL = 'https://rpc.gnosischain.com';
  process.env.WXHOPR_TOKEN_ADDRESS = '0xD4fdec44DB9D44B8f2b6d529620f9C0C7066A2c1';
  process.env.AIRDROP_AMOUNT_WEI = '10000000000000000';
  process.env.XDAI_AIRDROP_AMOUNT_WEI = '10000000000000000';
  process.env.PORT = '3000';

  console.log('🚀 Loading configuration with test key...');
  console.log('');

  // Clear require cache to ensure fresh load
  const configPath = require.resolve('../dist/config/index');
  const securityAlertsPath = require.resolve('../dist/utils/securityAlerts');
  delete require.cache[configPath];
  delete require.cache[securityAlertsPath];
  
  // Clear all related modules from cache
  Object.keys(require.cache).forEach(key => {
    if (key.includes('/dist/')) {
      delete require.cache[key];
    }
  });

  try {
    // This will trigger the validation system (which calls validateConfig)
    require('../dist/index');
    
    console.log('✅ Configuration loaded successfully!');
    console.log('✅ Test key protection is working - no test keys detected or warnings logged for valid keys.');
    
  } catch (error) {
    if (error.message && error.message.includes('Process exit called')) {
      console.log('🛑 SYSTEM SHUTDOWN TRIGGERED!');
      console.log('');
      console.log('The security system detected a test private key in production');
      console.log('and initiated an emergency shutdown to prevent security risks.');
      console.log('');
      console.log('This is the expected behavior when test keys are detected');
      console.log('in production environments.');
    } else {
      console.error('❌ Error during configuration loading:');
      console.error(error.message);
    }
  }
  
  console.log('');
  console.log('🔍 Test completed. Check the logs above for security validation results.');
}

if (require.main === module) {
  main();
}
