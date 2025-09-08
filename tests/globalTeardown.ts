/**
 * Global teardown for Jest tests
 * Runs once after all test suites
 */

export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  // Clean up test data directories
  const fs = require('fs');
  const path = require('path');
  
  const testDataDir = path.join(__dirname, '../data-test');
  const testLogsDir = path.join(__dirname, '../logs-test');
  
  try {
    // Remove test directories
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    
    if (fs.existsSync(testLogsDir)) {
      fs.rmSync(testLogsDir, { recursive: true, force: true });
    }
    
    console.log('✅ Test environment cleanup complete');
  } catch (error) {
    console.warn('⚠️ Some test cleanup may have failed:', error);
  }
}
