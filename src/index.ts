import app from './app';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';

async function startServer(): Promise<void> {
  try {
    // Validate configuration
    logger.config('info', 'Validating configuration...');
    validateConfig();
    logger.config('info', 'Configuration validated successfully');

    // Start the server
    const server = app.listen(config.port, () => {
      logger.startup('Chiado wxHOPR Airdrop Service started successfully');
      logger.startup(`Server running on port ${config.port}`);
      logger.startup(`Environment: ${config.nodeEnv}`);
      logger.startup(`Airdrop amount: ${config.airdropAmountWei} wei`);
      logger.startup(`Gnosis RPC: ${config.gnosisRpcUrl}`);
      logger.info('Available endpoints:', {
        endpoints: [
          `POST http://localhost:${config.port}/api/airdrop/claim`,
          `GET  http://localhost:${config.port}/api/airdrop/status`,
          `POST http://localhost:${config.port}/api/airdrop/generate-test-hash`,
          `GET  http://localhost:${config.port}/api/airdrop/health`
        ]
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.failure('Failed to start server', { error: error instanceof Error ? error.message : error });
    process.exit(1);
  }
}

startServer();
