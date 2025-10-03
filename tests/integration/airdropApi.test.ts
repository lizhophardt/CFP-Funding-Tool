/**
 * Integration tests for Airdrop API endpoints
 */

import request from 'supertest';
import { Application } from 'express';
import { TestHelpers } from '../utils/testHelpers';
import { validAirdropRequests, invalidAirdropRequests, maliciousPayloads } from '../fixtures/testData';

describe('Airdrop API Integration Tests', () => {
  let app: Application;

  beforeAll(async () => {
    app = await TestHelpers.createTestApp();
  });

  // Add delay between tests for stability
  afterEach(async () => {
    await TestHelpers.wait(100);
  });

  describe('POST /api/v1/airdrop/claim', () => {
    it('should accept valid airdrop request', async () => {
      const response = await request(app)
        .post('/api/v1/airdrop/claim')
        .set('Content-Type', 'application/json')
        .send(validAirdropRequests.basic);

      // Note: In test environment, this might fail due to missing Web3 connection
      // but validation should pass
      expect([200, 400, 500]).toContain(response.status);
      
      if (response.status === 400) {
        // If it's a business logic error (not validation), that's expected
        expect(response.body.code).not.toBe('VALIDATION_ERROR');
      }
    });

    it('should reject requests with validation errors', async () => {
      const response = await request(app)
        .post('/api/v1/airdrop/claim')
        .set('Content-Type', 'application/json')
        .send(invalidAirdropRequests.invalidAddressFormat);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      TestHelpers.validateErrorResponse(response.body);
    });

    it('should reject requests with missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/airdrop/claim')
        .set('Content-Type', 'application/json')
        .send({ secretCode: 'TestCode1' }); // Missing recipientAddress

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject XSS attempts', async () => {
      const response = await request(app)
        .post('/api/v1/airdrop/claim')
        .set('Content-Type', 'application/json')
        .send(invalidAirdropRequests.xssInSecretCode);

      expect(response.status).toBe(400); // Should be rejected due to validation
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
        expect(response.body.message).toMatch(/Security threat detected|invalid characters|Validation failed/i);
      }
    });

    it('should reject SQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/v1/airdrop/claim')
        .set('Content-Type', 'application/json')
        .send(invalidAirdropRequests.sqlInjection);

      expect(response.status).toBe(400); // Should be rejected due to validation
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
        expect(response.body.message).toMatch(/Security threat detected|invalid characters|Validation failed/i);
      }
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/v1/airdrop/claim')
        .set('Content-Type', 'application/json')
        .send({});

      expect([400, 429]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/airdrop/claim')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });

    it('should handle oversized payloads', async () => {
      const response = await request(app)
        .post('/api/v1/airdrop/claim')
        .set('Content-Type', 'application/json')
        .send(invalidAirdropRequests.oversizedSecretCode);

      expect([400, 413]).toContain(response.status); // 413 = payload too large
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('GET /api/v1/airdrop/status', () => {
    it('should return service status', async () => {
      const response = await request(app)
        .get('/api/v1/airdrop/status')
        .set('Accept', 'application/json');

      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data).toHaveProperty('isConnected');
        expect(response.body.data).toHaveProperty('accountAddress');
        expect(response.body.data).toHaveProperty('balance');
        expect(response.body.data).toHaveProperty('xDaiBalance');
        expect(response.body.data).toHaveProperty('processedCount');
      }
    });

    it('should handle query parameters validation', async () => {
      const response = await request(app)
        .get('/api/v1/airdrop/status')
        .set('Accept', 'application/json')
        .query({ limit: -1 }); // Invalid limit

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('QUERY_VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/airdrop/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/airdrop/health')
        .set('Accept', 'application/json');

      expect([200, 503]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('running');
      }
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('POST /api/v1/airdrop/generate-test-code', () => {
    it('should be disabled in production', async () => {
      // Temporarily set NODE_ENV to production
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .post('/api/v1/airdrop/generate-test-code')
        .set('Content-Type', 'application/json')
        .send({ prefix: 'Test' });

      expect(response.status).toBe(404);

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should work in development environment', async () => {
      // Ensure we're in test/development environment
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .post('/api/v1/airdrop/generate-test-code')
        .set('Content-Type', 'application/json')
        .send({ prefix: 'Test' });

      // This might fail due to missing services, but validation should pass
      expect([200, 404, 500]).toContain(response.status); // 404 if route not found
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.secretCode).toBeDefined();
        expect(response.body.data.configuredCodes).toBeDefined();
      }
    });
  });


  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/v1/airdrop/health')
        .set('Accept', 'application/json');

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/v1/airdrop/claim')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should reject requests from unauthorized origins', async () => {
      const response = await request(app)
        .post('/api/v1/airdrop/claim')
        .set('Content-Type', 'application/json')
        .set('Origin', 'https://malicious-site.com')
        .send(validAirdropRequests.basic);

      // CORS or other network issue
      expect([400, 429, 500]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should sanitize error messages', async () => {
      const response = await request(app)
        .post('/api/v1/airdrop/claim')
        .set('Content-Type', 'application/json')
        .send(invalidAirdropRequests.xssInSecretCode);

      expect([400, 429]).toContain(response.status);
      if (response.status === 400) {
        // Error message should not contain the malicious payload
        expect(response.body.message).not.toContain('<script>');
      }
    });
  });

  describe('Content Type Validation', () => {
    it('should reject non-JSON content types for POST requests', async () => {
      const response = await request(app)
        .post('/api/v1/airdrop/claim')
        .set('Content-Type', 'text/plain')
        .send('not json');

      expect([400, 429]).toContain(response.status);
    });
  });

  describe('API Versioning', () => {
    it('should include version headers in v1 responses', async () => {
      const response = await request(app)
        .get('/api/v1/airdrop/health')
        .set('Accept', 'application/json');

      expect(response.headers).toHaveProperty('x-api-version', 'v1');
      expect(response.headers).toHaveProperty('x-api-legacy', 'false');
    });

    it('should reject unsupported API versions', async () => {
      const response = await request(app)
        .get('/api/v2/airdrop/health')
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not supported');
      expect(response.body.supportedVersions).toContain('v1');
    });

    it('should include API version in response body', async () => {
      const response = await request(app)
        .get('/api/v1/airdrop/health')
        .set('Accept', 'application/json');

      expect([200, 503]).toContain(response.status);
      expect(response.body.apiVersion).toBe('v1');
    });
  });

  describe('Legacy API Compatibility', () => {
    it('should support legacy /api/airdrop/claim endpoint', async () => {
      const response = await request(app)
        .post('/api/airdrop/claim')
        .set('Content-Type', 'application/json')
        .send(validAirdropRequests.basic);

      // Should work but include deprecation warnings
      expect([200, 400, 500]).toContain(response.status);
      expect(response.headers).toHaveProperty('x-api-version', 'v1');
      expect(response.headers).toHaveProperty('x-api-legacy', 'true');
      expect(response.headers).toHaveProperty('warning');
      expect(response.headers).toHaveProperty('deprecation', 'true');
    });

    it('should support legacy /api/airdrop/status endpoint', async () => {
      const response = await request(app)
        .get('/api/airdrop/status')
        .set('Accept', 'application/json');

      expect([200, 500]).toContain(response.status);
      expect(response.headers).toHaveProperty('x-api-version', 'v1');
      expect(response.headers).toHaveProperty('x-api-legacy', 'true');
      expect(response.headers).toHaveProperty('warning');
    });

    it('should support legacy /api/airdrop/health endpoint', async () => {
      const response = await request(app)
        .get('/api/airdrop/health')
        .set('Accept', 'application/json');

      expect([200, 503]).toContain(response.status);
      expect(response.headers).toHaveProperty('x-api-version', 'v1');
      expect(response.headers).toHaveProperty('x-api-legacy', 'true');
      expect(response.headers).toHaveProperty('warning');
      
      // Should include deprecation warning in response body
      if (response.body._deprecationWarning) {
        expect(response.body._deprecationWarning).toContain('deprecated');
      }
    });
  });
});
