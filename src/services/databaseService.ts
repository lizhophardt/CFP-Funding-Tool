import { Pool, Client, PoolClient } from 'pg';
import { logger } from '../utils/logger';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  connectionString?: string;
}

export class DatabaseService {
  private pool: Pool;
  private isConnected: boolean = false;

  constructor(config: DatabaseConfig) {
    // Create connection pool
    this.pool = new Pool({
      connectionString: config.connectionString,
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of connections in the pool
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error if connection takes longer than 2 seconds
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.config('error', 'Database pool error', { error: err.message });
    });

    // Handle client connection
    this.pool.on('connect', (client) => {
      logger.config('info', 'New database client connected');
    });

    // Handle client removal
    this.pool.on('remove', (client) => {
      logger.config('info', 'Database client removed from pool');
    });
  }

  /**
   * Initialize database connection and test connectivity
   */
  async connect(): Promise<void> {
    try {
      // Test connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      logger.config('info', 'Database connected successfully', {
        timestamp: result.rows[0].now
      });
    } catch (error) {
      this.isConnected = false;
      logger.config('error', 'Database connection failed', {
        error: error instanceof Error ? error.message : error
      });
      throw new Error(`Database connection failed: ${error}`);
    }
  }

  /**
   * Get a client from the connection pool
   */
  async getClient(): Promise<PoolClient> {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.pool.connect();
  }

  /**
   * Execute a query with automatic connection management
   */
  async query(text: string, params?: any[]): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      logger.config('error', 'Database query failed', {
        query: text,
        params: params,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(queries: Array<{ text: string; params?: any[] }>): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const results = [];

      for (const query of queries) {
        const result = await client.query(query.text, query.params);
        results.push(result);
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.config('error', 'Database transaction failed', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run database migrations
   */
  async runMigrations(): Promise<void> {
    logger.config('info', 'Running database migrations...');
    
    try {
      // Create migrations table if it doesn't exist
      await this.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // For now, we'll just ensure the schema exists
      // In a more complex setup, you'd read migration files and execute them
      logger.config('info', 'Database migrations completed');
    } catch (error) {
      logger.config('error', 'Database migration failed', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Check database health
   */
  async healthCheck(): Promise<{ isHealthy: boolean; details: any }> {
    try {
      const result = await this.query('SELECT NOW() as timestamp, version() as version');
      return {
        isHealthy: true,
        details: {
          connected: this.isConnected,
          timestamp: result.rows[0].timestamp,
          version: result.rows[0].version,
          poolSize: this.pool.totalCount,
          idleConnections: this.pool.idleCount,
          waitingClients: this.pool.waitingCount
        }
      };
    } catch (error) {
      return {
        isHealthy: false,
        details: {
          connected: this.isConnected,
          error: error instanceof Error ? error.message : error
        }
      };
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats(): {
    totalConnections: number;
    idleConnections: number;
    waitingClients: number;
  } {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount
    };
  }

  /**
   * Close all connections and shut down the pool
   */
  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      this.isConnected = false;
      logger.config('info', 'Database disconnected successfully');
    } catch (error) {
      logger.config('error', 'Error disconnecting from database', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Check if database is connected
   */
  isConnectionHealthy(): boolean {
    return this.isConnected;
  }
}
