import app from './app';
import { config, validateConfig } from './config';

async function startServer(): Promise<void> {
  try {
    // Validate configuration
    console.log('Validating configuration...');
    validateConfig();
    console.log('✅ Configuration validated successfully');

    // Start the server
    const server = app.listen(config.port, () => {
      console.log(`🚀 Chiado xDai Airdrop Service started successfully`);
      console.log(`📡 Server running on port ${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`💰 Airdrop amount: ${config.airdropAmountWei} wei`);
      console.log(`🔗 Chiado RPC: ${config.chiadoRpcUrl}`);
      console.log('');
      console.log('Available endpoints:');
      console.log(`  POST http://localhost:${config.port}/api/airdrop/claim`);
      console.log(`  GET  http://localhost:${config.port}/api/airdrop/status`);
      console.log(`  POST http://localhost:${config.port}/api/airdrop/generate-test-hash`);
      console.log(`  GET  http://localhost:${config.port}/api/airdrop/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
