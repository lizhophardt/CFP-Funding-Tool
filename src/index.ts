import app from './app';
import { config, validateConfig } from './config';
import { ServiceContainer } from './services/serviceContainer';
import { logger } from './utils/logger';

async function startServer(): Promise<void> {
  let serviceContainer: ServiceContainer | null = null;
  
  try {
    // Validate configuration
    logger.config('info', 'Validating configuration...');
    validateConfig();
    logger.config('info', 'Configuration validated successfully');

    // Initialize services
    logger.config('info', 'Initializing services...');
    serviceContainer = ServiceContainer.getInstance();
    await serviceContainer.initialize();
    logger.config('info', 'Services initialized successfully');

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
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      server.close(async () => {
        try {
          if (serviceContainer) {
            await serviceContainer.shutdown();
          }
          logger.info('Server and services closed');
          process.exit(0);
        } catch (error) {
          logger.config('error', 'Error during shutdown', {
            error: error instanceof Error ? error.message : error
          });
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.failure('Failed to start server', { error: error instanceof Error ? error.message : error });
    process.exit(1);
  }
}

startServer();
