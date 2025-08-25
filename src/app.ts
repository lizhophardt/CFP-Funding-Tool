import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import airdropRoutes from './routes/airdropRoutes';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { config } from './config';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true, // Configure as needed
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/airdrop', airdropRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Chiado xDai Airdrop Service',
    version: '1.0.0',
    endpoints: {
      'POST /api/airdrop/claim': 'Claim an airdrop with hash and recipient address',
      'GET /api/airdrop/status': 'Get service status and balance',
      'POST /api/airdrop/generate-test-hash': 'Generate a test hash for development',
      'GET /api/airdrop/health': 'Health check endpoint'
    }
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
