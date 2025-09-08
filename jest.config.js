/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Test environment
  testEnvironment: 'node',
  
  // Root directory for tests and modules
  rootDir: '.',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Coverage configuration
  collectCoverage: false, // Enable manually with --coverage flag
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/types/**',
    '!src/index.ts' // Entry point, usually just imports
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    // Stricter thresholds for critical files
    './src/services/**/*.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/utils/inputValidator.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // Test timeout (30 seconds for integration tests)
  testTimeout: 30000,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output
  verbose: false,
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/'
  ],
  
  // Watch ignore patterns
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '/logs/',
    '/data/'
  ],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/globalTeardown.ts',
  
  // Error handling
  errorOnDeprecated: true,
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './coverage',
        outputName: 'junit.xml'
      }
    ]
  ]
};
