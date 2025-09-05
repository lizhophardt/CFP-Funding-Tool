import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiting configuration for different endpoints
 * Protects against brute force attacks and DoS attempts
 */

// Custom key generator that considers both IP and user agent for better tracking
const generateKey = (req: Request): string => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  // Create a simple hash of IP + UserAgent for better rate limiting
  const combined = `${ip}-${userAgent.substring(0, 50)}`;
  return combined;
};

// Custom handler for rate limit exceeded
const rateLimitHandler = (req: Request, res: Response) => {
  console.warn(`🚫 RATE LIMIT EXCEEDED:`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    endpoint: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: Math.ceil(60) // seconds
  });
};

/**
 * STRICT: For airdrop claims (highest security)
 * - 3 attempts per 15 minutes per IP+UserAgent
 * - Prevents airdrop farming and abuse
 */
export const claimRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP+UserAgent to 3 requests per windowMs
  keyGenerator: generateKey,
  handler: rateLimitHandler,
  message: {
    success: false,
    message: 'Too many airdrop attempts. Please wait 15 minutes before trying again.',
    code: 'CLAIM_RATE_LIMIT'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting in development for testing
    return process.env.NODE_ENV === 'development' && req.ip === '::1';
  }
});

/**
 * MODERATE: For status checks
 * - 30 requests per 5 minutes per IP
 * - Allows reasonable monitoring but prevents abuse
 */
export const statusRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  keyGenerator: (req) => req.ip || 'unknown',
  handler: rateLimitHandler,
  message: {
    success: false,
    message: 'Too many status requests. Please slow down.',
    code: 'STATUS_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * LENIENT: For health checks
 * - 60 requests per 1 minute per IP
 * - Allows monitoring systems to check health frequently
 */
export const healthRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  keyGenerator: (req) => req.ip || 'unknown',
  handler: rateLimitHandler,
  message: {
    success: false,
    message: 'Health check rate limit exceeded',
    code: 'HEALTH_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * DEVELOPMENT: For test code generation (development only)
 * - 5 requests per 10 minutes per IP
 * - Only active in development environment
 */
export const testCodeRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  keyGenerator: generateKey,
  handler: rateLimitHandler,
  message: {
    success: false,
    message: 'Too many test code generation requests',
    code: 'TEST_CODE_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Only apply in development
    return process.env.NODE_ENV !== 'development';
  }
});

/**
 * GLOBAL: General API protection
 * - 100 requests per 15 minutes per IP
 * - Catches any endpoints not covered by specific limits
 */
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: (req) => req.ip || 'unknown',
  handler: rateLimitHandler,
  message: {
    success: false,
    message: 'Too many requests to API. Please slow down.',
    code: 'GLOBAL_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip for health checks and other monitoring
    return req.path.includes('/health');
  }
});

/**
 * Rate limiting summary for logging
 */
export const getRateLimitSummary = () => {
  return {
    endpoints: {
      '/api/airdrop/claim': '3 requests per 15 minutes',
      '/api/airdrop/status': '30 requests per 5 minutes', 
      '/api/airdrop/health': '60 requests per 1 minute',
      '/api/airdrop/generate-test-code': '5 requests per 10 minutes (dev only)',
      'global': '100 requests per 15 minutes'
    },
    features: [
      'IP + User-Agent based tracking',
      'Environment-aware (lenient in development)',
      'Structured error responses',
      'Rate limit headers included',
      'Comprehensive logging'
    ]
  };
};
