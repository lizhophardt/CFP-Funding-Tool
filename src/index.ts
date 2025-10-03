import app from './app';
import { config, validateConfig } from './config';
import { getContainer, DIContainer } from './container/DIContainer';
import { logger } from './utils/logger';

async function startServer(): Promise<void> {
  let diContainer: DIContainer | null = null;
  
  try {
    console.log('🚀 Starting CFP Funding Tool server...');
    console.log('📍 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔌 PORT:', process.env.PORT || 3000);
    
    // Validate configuration
    console.log('⚙️  Validating configuration...');
    logger.config('info', 'Validating configuration...');
    validateConfig();
    console.log('✅ Configuration validated successfully');
    logger.config('info', 'Configuration validated successfully');

    // Initialize services
    console.log('🔧 Initializing dependency injection container...');
    logger.config('info', 'Initializing dependency injection container...');
    diContainer = getContainer();
    
    console.log('🔄 Starting DI container initialization...');
    
    // Add timeout to prevent hanging
    const initPromise = diContainer.initialize();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('DI container initialization timeout after 30 seconds')), 30000)
    );
    
    await Promise.race([initPromise, timeoutPromise]);
    console.log('✅ Dependency injection container initialized successfully');
    logger.config('info', 'Dependency injection container initialized successfully');

    // Start the server
    const server = app.listen(config.port, () => {
      logger.startup('Chiado wxHOPR Airdrop Service started successfully');
      logger.startup(`Server running on port ${config.port}`);
      logger.startup(`Environment: ${config.nodeEnv}`);
      logger.startup(`Airdrop amount: ${config.airdropAmountWei} wei`);
      logger.startup(`Gnosis RPC: ${config.gnosisRpcUrl}`);
      logger.info('Available endpoints:', {
        'v1 (current)': [
          `POST http://localhost:${config.port}/api/v1/airdrop/claim`,
          `GET  http://localhost:${config.port}/api/v1/airdrop/status`,
          `POST http://localhost:${config.port}/api/v1/airdrop/generate-test-code`,
          `GET  http://localhost:${config.port}/api/v1/airdrop/health`
        ],
        'legacy (deprecated)': [
          `POST http://localhost:${config.port}/api/airdrop/claim`,
          `GET  http://localhost:${config.port}/api/airdrop/status`,
          `GET  http://localhost:${config.port}/api/airdrop/health`
        ]
      });
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      server.close(async () => {
        try {
          if (diContainer) {
            await diContainer.shutdown();
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
