/**
 * Dependency Injection Container
 * 
 * This container manages service instantiation and dependency resolution
 * for improved testability and composability.
 */

import { DatabaseService } from '../services/databaseService';
import { SecretCodeService } from '../services/secretCodeService';
import { AirdropService } from '../services/airdropService';
import { Web3Service } from '../services/web3Service';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface ServiceDependencies {
  databaseService: DatabaseService;
  secretCodeService: SecretCodeService;
  airdropService: AirdropService;
  web3Service: Web3Service;
}

/**
 * Dependency Injection Container for managing service lifecycles
 * and dependencies. Supports both singleton and transient service creation.
 */
export class DIContainer {
  private services = new Map<string, any>();
  private singletons = new Map<string, any>();
  private initialized = false;

  /**
   * Register a service factory function
   */
  register<T>(name: string, factory: () => T, singleton: boolean = true): void {
    this.services.set(name, { factory, singleton });
  }

  /**
   * Register a service instance directly
   */
  registerInstance<T>(name: string, instance: T): void {
    this.singletons.set(name, instance);
  }

  /**
   * Resolve a service by name
   */
  resolve<T>(name: string): T {
    // Check if we have a singleton instance
    if (this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Check if we have a factory registered
    const serviceConfig = this.services.get(name);
    if (!serviceConfig) {
      throw new Error(`Service '${name}' not registered`);
    }

    const instance = serviceConfig.factory();

    // Store as singleton if configured
    if (serviceConfig.singleton) {
      this.singletons.set(name, instance);
    }

    return instance;
  }

  /**
   * Get all services as a complete dependency object
   */
  getServices(): ServiceDependencies {
    return {
      databaseService: this.resolve<DatabaseService>('databaseService'),
      secretCodeService: this.resolve<SecretCodeService>('secretCodeService'),
      airdropService: this.resolve<AirdropService>('airdropService'),
      web3Service: this.resolve<Web3Service>('web3Service')
    };
  }

  /**
   * Initialize the container with default service registrations
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      logger.config('info', 'Initializing dependency injection container...');

      // Register database service
      this.register('databaseService', () => {
        return new DatabaseService(config.database);
      });

      // Register web3 service
      this.register('web3Service', () => {
        try {
          logger.config('info', 'Creating Web3Service instance...');
          const web3Service = new Web3Service();
          
          // Verify the service is properly initialized
          if (!web3Service.isInitialized()) {
            throw new Error('Web3Service created but not properly initialized');
          }
          
          logger.config('info', 'Web3Service created and initialized successfully');
          return web3Service;
        } catch (error) {
          logger.config('error', 'Failed to create Web3Service', {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined
          });
          throw error;
        }
      });

      // Register secret code service (depends on database service)
      this.register('secretCodeService', () => {
        const databaseService = this.resolve<DatabaseService>('databaseService');
        return new SecretCodeService(databaseService);
      });

      // Register airdrop service (depends on database, web3, and secret code services)
      this.register('airdropService', () => {
        const databaseService = this.resolve<DatabaseService>('databaseService');
        const web3Service = this.resolve<Web3Service>('web3Service');
        const secretCodeService = this.resolve<SecretCodeService>('secretCodeService');
        return new AirdropService(databaseService, web3Service, secretCodeService);
      });

      // Initialize database connection with fallback
      const databaseService = this.resolve<DatabaseService>('databaseService');
      logger.config('info', 'Initializing database connection...');
      try {
        await databaseService.connect();
      } catch (error) {
        logger.config('warn', 'Database connection failed, continuing with environment-based secret codes', {
          error: error instanceof Error ? error.message : error
        });
        // Don't throw - allow app to start without database
      }
      
      // Skip migrations for local testing since we set up the DB manually
      // logger.config('info', 'Running database migrations...');
      // await databaseService.runMigrations();
      
      logger.config('info', 'Dependency injection container initialized successfully');
      this.initialized = true;
    } catch (error) {
      logger.config('error', 'Failed to initialize dependency injection container', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    database: { isHealthy: boolean; details?: any };
    services: { initialized: boolean };
  }> {
    try {
      const databaseService = this.resolve<DatabaseService>('databaseService');
      const dbHealth = await databaseService.healthCheck();

      return {
        database: {
          isHealthy: dbHealth.isHealthy,
          details: dbHealth.details
        },
        services: {
          initialized: this.initialized
        }
      };
    } catch (error) {
      return {
        database: {
          isHealthy: false,
          details: { error: error instanceof Error ? error.message : String(error) }
        },
        services: {
          initialized: false
        }
      };
    }
  }

  /**
   * Graceful shutdown of all services
   */
  async shutdown(): Promise<void> {
    try {
      logger.config('info', 'Shutting down dependency injection container...');

      // Shutdown database service if it exists
      if (this.singletons.has('databaseService')) {
        const databaseService = this.singletons.get('databaseService') as DatabaseService;
        await databaseService.disconnect();
      }

      // Clear all services
      this.services.clear();
      this.singletons.clear();
      this.initialized = false;

      logger.config('info', 'Dependency injection container shut down successfully');
    } catch (error) {
      logger.config('error', 'Error during dependency injection container shutdown', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.singletons.clear();
    this.initialized = false;
  }

  /**
   * Check if the container is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Global container instance
let globalContainer: DIContainer | null = null;

/**
 * Get the global DI container instance
 */
export function getContainer(): DIContainer {
  if (!globalContainer) {
    globalContainer = new DIContainer();
  }
  return globalContainer;
}

/**
 * Set a custom container (useful for testing)
 */
export function setContainer(container: DIContainer): void {
  globalContainer = container;
}

/**
 * Reset the global container (useful for testing)
 */
export function resetContainer(): void {
  globalContainer = null;
}
