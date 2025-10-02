import { DatabaseService } from './databaseService';
import { SecretCodeService } from './secretCodeService';
import { AirdropService } from './airdropService';
import { config } from '../config';
import { logger } from '../utils/logger';

export class ServiceContainer {
  private static instance: ServiceContainer;
  private databaseService: DatabaseService;
  private secretCodeService: SecretCodeService;
  private airdropService: AirdropService;
  private initialized: boolean = false;

  private constructor() {
    // Initialize database service
    this.databaseService = new DatabaseService(config.database);
    
    // Initialize services that depend on database
    this.secretCodeService = new SecretCodeService(this.databaseService);
    this.airdropService = new AirdropService(this.databaseService);
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Initialize all services and database connections
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      logger.config('info', 'Initializing database connection...');
      await this.databaseService.connect();
      
      logger.config('info', 'Running database migrations...');
      await this.databaseService.runMigrations();
      
      logger.config('info', 'Services initialized successfully');
      this.initialized = true;
    } catch (error) {
      logger.config('error', 'Failed to initialize services', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Graceful shutdown of all services
   */
  async shutdown(): Promise<void> {
    try {
      logger.config('info', 'Shutting down services...');
      
      if (this.databaseService) {
        await this.databaseService.disconnect();
      }
      
      this.initialized = false;
      logger.config('info', 'Services shut down successfully');
    } catch (error) {
      logger.config('error', 'Error during service shutdown', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    database: { isHealthy: boolean; details: any };
    services: { initialized: boolean };
  }> {
    const databaseHealth = await this.databaseService.healthCheck();
    
    return {
      database: databaseHealth,
      services: { initialized: this.initialized }
    };
  }

  // Service getters
  getDatabaseService(): DatabaseService {
    return this.databaseService;
  }

  getSecretCodeService(): SecretCodeService {
    return this.secretCodeService;
  }

  getAirdropService(): AirdropService {
    return this.airdropService;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
