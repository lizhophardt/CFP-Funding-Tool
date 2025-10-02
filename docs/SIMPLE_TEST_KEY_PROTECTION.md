# 🔒 Simple Test Key Protection

A lightweight security feature that prevents test private keys from being used in production.

## What it does

- **Development**: Warns when test keys are detected, but allows operation
- **Production**: Immediately stops the system if test keys are detected

## Protected Keys

- Hardhat default accounts (first 3)
- Ganache CLI default accounts (first 2) 
- Common test patterns (`aaaa...`, `1111...`, `deadbeef...`)
- Simple repeated character patterns

## How it works

```typescript
// In src/utils/testKeyProtection.ts
export function validatePrivateKeyForProduction(privateKey: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (KNOWN_TEST_KEYS.includes(privateKey.toLowerCase())) {
    if (isProduction) {
      console.error('🚨 CRITICAL: Test private key detected in production!');
      process.exit(1); // STOP THE SYSTEM
    } else {
      logger.warn('⚠️ WARNING: Test private key detected in development');
    }
  }
}
```

## Usage

The protection runs automatically during configuration loading. No setup required.

## Testing

```bash
# Test with different keys
node examples/test-security-system.js hardhat0 development  # Warning
node examples/test-security-system.js hardhat0 production   # System stops
node examples/test-security-system.js valid development     # No warning
```

## Files

- `src/utils/testKeyProtection.ts` - Main protection logic (47 lines)
- `tests/security/testKeyProtection.test.ts` - Simple tests
- `examples/test-security-system.js` - Demo script

Simple, effective, and gets the job done! 🎯
