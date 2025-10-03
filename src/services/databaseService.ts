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

      // Run the initial migration to create tables
      const migrationName = '001_initial_setup.sql';
      const existingMigration = await this.query(
        'SELECT filename FROM migrations WHERE filename = $1',
        [migrationName]
      );

      if (existingMigration.rows.length === 0) {
        logger.config('info', `Running migration: ${migrationName}`);
        
        // Execute the migration SQL
        await this.query(`
          -- Enable UUID extension
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

          -- Create secret_codes table
          CREATE TABLE IF NOT EXISTS secret_codes (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              code VARCHAR(255) NOT NULL UNIQUE,
              description TEXT,
              is_active BOOLEAN NOT NULL DEFAULT true,
              max_uses INTEGER DEFAULT 1,
              current_uses INTEGER DEFAULT 0,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              created_by VARCHAR(100) DEFAULT 'system'
          );

          -- Create code_usage table
          CREATE TABLE IF NOT EXISTS code_usage (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              code_id UUID NOT NULL REFERENCES secret_codes(id) ON DELETE CASCADE,
              recipient_address VARCHAR(42) NOT NULL,
              wxhopr_transaction_hash VARCHAR(66),
              xdai_transaction_hash VARCHAR(66),
              wxhopr_amount_wei VARCHAR(78),
              xdai_amount_wei VARCHAR(78),
              ip_address INET,
              user_agent TEXT,
              used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              status VARCHAR(20) DEFAULT 'completed',
              error_message TEXT,
              metadata JSONB DEFAULT '{}'
          );

          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_secret_codes_code ON secret_codes(code);
          CREATE INDEX IF NOT EXISTS idx_secret_codes_active ON secret_codes(is_active);
          CREATE INDEX IF NOT EXISTS idx_code_usage_code_id ON code_usage(code_id);
          CREATE INDEX IF NOT EXISTS idx_code_usage_recipient ON code_usage(recipient_address);
          CREATE INDEX IF NOT EXISTS idx_code_usage_used_at ON code_usage(used_at);
          CREATE INDEX IF NOT EXISTS idx_code_usage_status ON code_usage(status);
        `);

        // Create functions and triggers
        await this.query(`
          -- Create functions and triggers
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = CURRENT_TIMESTAMP;
              RETURN NEW;
          END;
          $$ language 'plpgsql';

          CREATE TRIGGER update_secret_codes_updated_at 
              BEFORE UPDATE ON secret_codes 
              FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

          CREATE OR REPLACE FUNCTION increment_code_usage()
          RETURNS TRIGGER AS $$
          BEGIN
              IF NEW.status = 'completed' THEN
                  UPDATE secret_codes 
                  SET current_uses = current_uses + 1,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = NEW.code_id;
              END IF;
              RETURN NEW;
          END;
          $$ language 'plpgsql';

          CREATE TRIGGER increment_secret_code_usage 
              AFTER INSERT ON code_usage 
              FOR EACH ROW EXECUTE FUNCTION increment_code_usage();
        `);

        // Create view
        await this.query(`
          -- Create view
          CREATE OR REPLACE VIEW active_codes_with_stats AS
          SELECT 
              sc.id,
              sc.code,
              sc.description,
              sc.max_uses,
              sc.current_uses,
              (sc.max_uses - sc.current_uses) AS remaining_uses,
              CASE 
                  WHEN sc.max_uses IS NULL THEN true
                  WHEN sc.current_uses < sc.max_uses THEN true
                  ELSE false
              END AS can_be_used,
              sc.created_at,
              sc.updated_at,
              COUNT(cu.id) AS total_usage_records,
              COUNT(CASE WHEN cu.status = 'completed' THEN 1 END) AS successful_uses,
              COUNT(CASE WHEN cu.status = 'failed' THEN 1 END) AS failed_uses,
              MAX(cu.used_at) AS last_used_at
          FROM secret_codes sc
          LEFT JOIN code_usage cu ON sc.id = cu.code_id
          WHERE sc.is_active = true
          GROUP BY sc.id, sc.code, sc.description, sc.max_uses, sc.current_uses, sc.created_at, sc.updated_at
          ORDER BY sc.created_at DESC;
        `);

        // Insert default secret codes
        const defaultCodes = [
          'DontTellUncleSam',
          'SecretCode123', 
          'HiddenTreasure',
          'TestCode2024',
          'CFPFunding'
        ];

        for (const code of defaultCodes) {
          try {
            await this.query(
              `INSERT INTO secret_codes (code, description, max_uses, created_by) 
               VALUES ($1, $2, $3, $4) 
               ON CONFLICT (code) DO NOTHING`,
              [code, `Default secret code for airdrop claims`, 1, 'system']
            );
            logger.config('info', `Added default secret code: ${code}`);
          } catch (error) {
            logger.config('warn', `Failed to add secret code ${code}:`, error);
          }
        }

        // Record the migration as completed
        await this.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [migrationName]
        );
        
        logger.config('info', `Migration ${migrationName} completed successfully`);
      } else {
        logger.config('info', `Migration ${migrationName} already applied, skipping`);
      }

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
