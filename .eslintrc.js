module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // Prevent console.* usage - force use of Winston logger
    'no-console': 'error',
    
    // Basic rules
    'no-unused-vars': 'off', // Turn off base rule to use TypeScript version
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-var-requires': 'warn',
  },
  env: {
    node: true,
    es6: true,
  },
  overrides: [
    {
      // Allow console.* in test files for debugging purposes
      files: ['tests/**/*.ts', 'tests/**/*.js', '**/*.test.ts', '**/*.spec.ts'],
      rules: {
        'no-console': 'warn', // Downgrade to warning in test files
      },
    },
    {
      // Allow console.* in scripts directory for CLI tools
      files: ['scripts/**/*.js', 'scripts/**/*.ts'],
      rules: {
        'no-console': 'off', // Allow console in scripts
        '@typescript-eslint/no-var-requires': 'off', // Allow require() in scripts
      },
    },
  ],
};