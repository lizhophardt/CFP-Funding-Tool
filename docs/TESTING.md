# Testing Infrastructure

This directory contains the comprehensive testing suite for the CFP Funding Tool.

## 📁 Directory Structure

```
tests/
├── README.md                 # This file
├── setup.ts                  # Jest setup configuration
├── globalSetup.ts           # Global test setup
├── globalTeardown.ts        # Global test cleanup
├── unit/                    # Unit tests
│   ├── inputValidator.test.ts
│   ├── airdropService.test.ts
│   └── ...
├── integration/             # Integration tests
│   ├── airdropApi.test.ts
│   └── ...
├── security/               # Security-focused tests
│   ├── securityValidation.test.ts
│   └── ...
├── mocks/                  # Mock implementations
│   ├── web3Mock.ts
│   └── ...
├── fixtures/               # Test data and fixtures
│   ├── testData.ts
│   └── ...
└── utils/                  # Test utilities and helpers
    ├── testHelpers.ts
    └── ...
```

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:security

# Run tests for CI/CD
npm run test:ci

# Debug tests
npm run test:debug

# Clear Jest cache
npm run test:clear
```

### Running Specific Tests

```bash
# Run a specific test file
npm test -- inputValidator.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should validate"

# Run tests in a specific directory
npm test -- tests/unit/

# Run tests with verbose output
npm test -- --verbose
```

## 🎯 Test Categories

### Unit Tests (`tests/unit/`)
- Test individual functions and classes in isolation
- Mock external dependencies
- Focus on business logic and edge cases
- Fast execution (< 1 second per test)

**Examples:**
- Input validation logic
- Service class methods
- Utility functions
- Configuration parsing

### Integration Tests (`tests/integration/`)
- Test API endpoints end-to-end
- Test component interactions
- Use real Express app instance
- Mock external services (Web3, file system)

**Examples:**
- API endpoint responses
- Middleware integration
- Error handling flows

### Security Tests (`tests/security/`)
- Test security measures and attack prevention
- Validate input sanitization
- Verify security headers

**Examples:**
- XSS protection
- SQL injection prevention
- Command injection blocking
- CORS policy enforcement

## 🛠️ Test Utilities

### TestHelpers (`tests/utils/testHelpers.ts`)
Provides common testing utilities:

```typescript
// Create test Express app
const app = await TestHelpers.createTestApp();

// Create authenticated request
const request = TestHelpers.createRequest(app);

// Generate test data
const validRequest = TestHelpers.generateValidAirdropRequest();
const mockAddresses = TestHelpers.generateMockAddresses(5);

// Validate responses
TestHelpers.validateApiResponse(response.body);
TestHelpers.validateErrorResponse(response.body);
```

### Mocks (`tests/mocks/`)
Mock implementations for external dependencies:

```typescript
// Mock Web3 service
import { MockWeb3Service } from '../mocks/web3Mock';
const mockWeb3 = new MockWeb3Service({
  balance: '1000000000000000000',
  connected: true
});
```

### Fixtures (`tests/fixtures/`)
Predefined test data:

```typescript
import { validAirdropRequests, maliciousPayloads } from '../fixtures/testData';

// Use in tests
const request = validAirdropRequests.basic;
const xssPayload = maliciousPayloads.xssPayloads[0];
```

## 📊 Coverage Requirements

The project maintains the following coverage thresholds:

- **Global minimum**: 70% (branches, functions, lines, statements)
- **Services**: 80% (critical business logic)
- **Input validation**: 90% (security-critical code)

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open HTML coverage report
open coverage/lcov-report/index.html

# View coverage summary
npm test -- --coverage --coverageReporters=text-summary
```

## 🔧 Configuration

### Jest Configuration (`jest.config.js`)
- TypeScript support with ts-jest
- Custom matchers for Ethereum addresses
- Coverage thresholds and exclusions
- Test environment setup

### Environment Variables
Tests use isolated environment variables:

```typescript
process.env.NODE_ENV = 'test';
process.env.GNOSIS_RPC_URL = 'http://localhost:8545';
process.env.PRIVATE_KEY = 'a'.repeat(64);
// ... other test-specific values
```

## 🧪 Writing Tests

### Test Structure

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should handle normal case', () => {
      // Arrange
      const input = 'test input';
      
      // Act
      const result = component.method(input);
      
      // Assert
      expect(result).toBe('expected output');
    });

    it('should handle edge case', () => {
      // Test edge cases
    });

    it('should handle error case', () => {
      // Test error conditions
    });
  });
});
```

### Best Practices

1. **Descriptive test names**: Use "should" statements
2. **Arrange-Act-Assert**: Structure tests clearly
3. **One assertion per test**: Focus on single behaviors
4. **Mock external dependencies**: Keep tests isolated
5. **Test edge cases**: Include boundary conditions
6. **Clean up**: Use beforeEach/afterEach for setup/teardown

### Custom Matchers

```typescript
// Custom matchers available in all tests
expect('0x742d35...').toBeValidEthereumAddress();
expect('0x1234...').toBeValidTransactionHash();
```

### Async Testing

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

it('should handle rejections', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error message');
});
```

## 🐛 Debugging Tests

### Debug Mode
```bash
# Run with debugger
npm run test:debug

# Then open Chrome and navigate to chrome://inspect
```

### Console Output
```typescript
// Restore console for specific tests
beforeEach(() => {
  testUtils.restoreConsole();
});

// Suppress console noise
beforeEach(() => {
  testUtils.suppressConsole();
});
```

### Isolating Tests
```bash
# Run only specific test
npm test -- --testNamePattern="specific test name"

# Skip tests
describe.skip('ComponentName', () => { ... });
it.skip('should skip this test', () => { ... });

# Run only these tests
describe.only('ComponentName', () => { ... });
it.only('should run only this test', () => { ... });
```

## 🚨 Troubleshooting

### Common Issues

1. **Tests timeout**: Increase timeout in jest.config.js or use `jest.setTimeout()`
2. **Mock not working**: Ensure mocks are in correct location and properly cleared
3. **Environment variables**: Check test setup and global configuration
4. **Coverage issues**: Verify file paths in coverage configuration

### Performance Issues

```bash
# Run tests with performance monitoring
npm test -- --logHeapUsage

# Run tests in band (sequential)
npm test -- --runInBand

# Limit worker processes
npm test -- --maxWorkers=2
```

## 📈 Continuous Integration

The test suite is designed for CI/CD integration:

```bash
# CI command (no watch, coverage, exit on completion)
npm run test:ci
```

Generates:
- Coverage reports (HTML, LCOV)
- JUnit XML for CI integration
- Performance metrics

## 🔒 Security Testing

Security tests validate:
- Input sanitization
- Attack vector prevention
- Security header presence
- Error message sanitization

Run security tests specifically:
```bash
npm run test:security
```

## 📝 Adding New Tests

1. **Determine test type**: Unit, integration, or security
2. **Create test file**: Follow naming convention `*.test.ts`
3. **Use appropriate utilities**: Import from fixtures, mocks, utils
4. **Follow test structure**: Describe blocks and clear assertions
5. **Update coverage**: Ensure new code is covered
6. **Run tests**: Verify all tests pass

## 🎯 Test Metrics

Track these metrics for test quality:
- **Coverage percentage**: Aim for thresholds
- **Test execution time**: Keep under 30 seconds total
- **Test count**: Maintain good test-to-code ratio
- **Flaky test rate**: Keep at 0%
- **Security test coverage**: 100% of attack vectors

---

For questions or issues with the testing infrastructure, check the test output logs or run tests with `--verbose` flag for detailed information.
