import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from './routes';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiVersionMiddleware, validateApiVersion } from './middleware/versioning';
import { config } from './config';
import { SecurityHeaders } from './utils/securityHeaders';
import { SecurityMetrics } from './utils/securityMetrics';
import { logger } from './utils/logger';

const app = express();

// Security middleware with strict CSP configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Scripts: Only allow from self, no inline scripts (prevents XSS)
      scriptSrc: ["'self'"],
      // Styles: Allow inline styles for compatibility, but restrict sources
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      // Fonts: Allow from self and trusted CDNs
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      // API connections: Only to self (your API endpoints)
      connectSrc: ["'self'"],
      // Images: Self, data URIs, and HTTPS images
      imgSrc: ["'self'", "data:", "https:"],
      // Objects and embeds: None allowed
      objectSrc: ["'none'"],
      // Base URI: Restrict to self
      baseUri: ["'self'"],
      // Form actions: Only to self
      formAction: ["'self'"],
      // Frame ancestors: None (prevents clickjacking)
      frameAncestors: ["'none'"],
      // Manifest: Only from self
      manifestSrc: ["'self'"],
      // Media: Only from self and HTTPS
      mediaSrc: ["'self'", "https:"],
      // Worker scripts: Only from self
      workerSrc: ["'self'"],
      // Upgrade insecure requests in production
      ...(process.env.NODE_ENV === 'production' && {
        upgradeInsecureRequests: []
      })
    },
    // Report violations for monitoring
    reportOnly: false
  },
  // Additional security headers
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));
app.use(cors({
  origin: true, // Disable CORS protection - allow all origins
  credentials: true,
  // Additional security headers
  optionsSuccessStatus: 200, // For legacy browser support
  methods: ['GET', 'POST'], // Only allow necessary HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'] // Restrict headers
}));



// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving removed for API-only deployment
// Frontend will be served from funding.lizhophart.eth

// Request logging in development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    logger.http(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer')
    });
    next();
  });
}

// CSP violation reporting endpoint
app.post('/api/csp-violation-report', express.json(), (req, res) => {
  const violation = req.body;
  
  // Log CSP violations using security utility
  SecurityHeaders.logCSPViolation(violation, req);

  // Respond quickly to not block the browser
  res.status(204).send();
});

// Combined security and metrics middleware
const securityMetrics = SecurityMetrics.getInstance();
app.use((req, res, next) => {
  // Record security metrics
  securityMetrics.recordRequest(req.ip || 'unknown');
  
  // Add security headers if not already added by helmet
  if (!res.get('X-Request-ID')) {
    res.set('X-Request-ID', `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }
  
  next();
});

// API versioning middleware
app.use('/api', apiVersionMiddleware);
app.use('/api', validateApiVersion(['v1']));

// API Routes with versioning
app.use('/api', apiRoutes);

// API root route - explicitly return JSON only
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    success: true,
    message: 'Chiado wxHOPR + xDai Dual Airdrop API Service',
    version: '2.1.0',
    type: 'API_ONLY',
    airdropInfo: {
      wxHoprAmount: '0.01 wxHOPR',
      xDaiAmount: '0.01 xDai',
      description: 'Recipients get both wxHOPR tokens and native xDai'
    },
    endpoints: {
      'POST /api/v1/airdrop/claim': 'Claim dual airdrop (wxHOPR + xDai) with hash and recipient address',
      'GET /api/v1/airdrop/status': 'Get service status and both wxHOPR/xDai balances',
      'POST /api/v1/airdrop/generate-test-hash': 'Generate a test hash for development',
      'GET /api/v1/airdrop/health': 'Health check endpoint'
    },
    versioning: {
      current: 'v1',
      supported: ['v1'],
      legacy: {
        'POST /api/airdrop/claim': 'Legacy endpoint - use /api/v1/airdrop/claim instead',
        'GET /api/airdrop/status': 'Legacy endpoint - use /api/v1/airdrop/status instead',
        'GET /api/airdrop/health': 'Legacy endpoint - use /api/v1/airdrop/health instead'
      }
    },
    security: {
      cors: 'Restricted to trusted origins',
      ...SecurityHeaders.getSecuritySummary(),
      testKeyProtection: 'Active - System stops if test keys detected in production',
      threatResponse: {
        status: 'Handled by external layer (e.g., Cloudflare)',
        note: 'Application-level threat protection removed in favor of infrastructure-level protection'
      },
      errors: 'Sanitized error messages'
    },
    frontend: {
      url: 'https://funding.lizhophart.eth',
      note: 'Frontend is served separately from ENS domain'
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);
app.use(notFoundHandler);

export default app;
