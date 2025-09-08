/**
 * Global setup for Jest tests
 * Runs once before all test suites
 */

export default async function globalSetup() {
  console.log('🧪 Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  
  // Create test data directories if they don't exist
  const fs = require('fs');
  const path = require('path');
  
  const testDataDir = path.join(__dirname, '../data-test');
  const testLogsDir = path.join(__dirname, '../logs-test');
  
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }
  
  if (!fs.existsSync(testLogsDir)) {
    fs.mkdirSync(testLogsDir, { recursive: true });
  }
  
  // Override data and logs directories for tests
  process.env.DATA_DIR = testDataDir;
  process.env.LOGS_DIR = testLogsDir;
  
  console.log('✅ Test environment setup complete');
}
