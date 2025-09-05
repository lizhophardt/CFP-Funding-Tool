import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import airdropRoutes from './routes/airdropRoutes';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { config } from './config';

const app = express();

// Security middleware with CSP configuration for inline scripts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? [
    // Production: Only allow specific trusted domains
    'https://funding.lizhophart.eth',
    'https://funding.lizhophardt.eth',
    'https://funding.lizhophardt.eth.limo',
    'https://funding.lizhophardt.eth.link',
    'https://bafybeigcvasvqsodkijgat5s2zxgaf32n37qtf2j3syr6ljraphmsqiusy.ipfs.dweb.link',
    'https://bafybeigcvasvqsodkijgat5s2zxgaf32n37qtf2j3syr6ljraphmsqiusy.ipfs.cf-ipfs.com',
    'https://ipfs.io'
  ] : [
    // Development: Only allow specific localhost origins (no wildcards)
    'http://localhost:3000',
    'http://localhost:8000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8000',
    'http://0.0.0.0:3000',
    'http://0.0.0.0:8000'
  ],
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
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/airdrop', airdropRoutes);

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
      'POST /api/airdrop/claim': 'Claim dual airdrop (wxHOPR + xDai) with hash and recipient address',
      'GET /api/airdrop/status': 'Get service status and both wxHOPR/xDai balances',
      'POST /api/airdrop/generate-test-hash': 'Generate a test hash for development',
      'GET /api/airdrop/health': 'Health check endpoint'
    },
    frontend: {
      url: 'https://funding.lizhophart.eth',
      note: 'Frontend is served separately from ENS domain'
    }
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
