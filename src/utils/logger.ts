/**
 * Centralized Logging System
 * Replaces console.log statements with structured logging
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'grey',
  debug: 'blue',
  silly: 'cyan'
};

winston.addColors(logColors);

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

// File format (no colors for files)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport - determine environment from process.env directly
const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'development') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: logFormat
    })
  );
} else {
  // In production, only log info and above to console
  transports.push(
    new winston.transports.Console({
      level: 'info',
      format: logFormat
    })
  );
}

// File transports for all environments
transports.push(
  // Error logs
  new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  }),
  
  // Combined logs
  new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '7d',
    zippedArchive: true
  }),
  
  // Security logs (separate for audit trail)
  new DailyRotateFile({
    filename: 'logs/security-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'warn', // Security events are typically warn or error
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '30d', // Keep security logs longer
    zippedArchive: true
  })
);

// Create the Winston logger instance
const winstonLogger = winston.createLogger({
  level: nodeEnv === 'development' ? 'debug' : 'info',
  levels: logLevels,
  format: fileFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false
});

// Handle uncaught exceptions and unhandled promise rejections
winstonLogger.exceptions.handle(
  new DailyRotateFile({
    filename: 'logs/exceptions-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true
  })
);

winstonLogger.rejections.handle(
  new DailyRotateFile({
    filename: 'logs/rejections-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true
  })
);

// Logging utility class with specific methods for different contexts
export class Logger {
  private static instance: Logger;
  private winston: winston.Logger;

  private constructor() {
    this.winston = winstonLogger;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // General logging methods
  public error(message: string, meta?: any): void {
    this.winston.error(message, meta);
  }

  public warn(message: string, meta?: any): void {
    this.winston.warn(message, meta);
  }

  public info(message: string, meta?: any): void {
    this.winston.info(message, meta);
  }

  public http(message: string, meta?: any): void {
    this.winston.http(message, meta);
  }

  public debug(message: string, meta?: any): void {
    this.winston.debug(message, meta);
  }

  // Specialized logging methods for different contexts
  public security(level: 'warn' | 'error', message: string, meta?: any): void {
    const securityMeta = {
      type: 'SECURITY_EVENT',
      timestamp: new Date().toISOString(),
      ...meta
    };
    this.winston.log(level, `🛡️ SECURITY: ${message}`, securityMeta);
  }

  public airdrop(level: 'info' | 'warn' | 'error', message: string, meta?: any): void {
    const airdropMeta = {
      type: 'AIRDROP_EVENT',
      timestamp: new Date().toISOString(),
      ...meta
    };
    this.winston.log(level, `💰 AIRDROP: ${message}`, airdropMeta);
  }

  public web3(level: 'info' | 'warn' | 'error', message: string, meta?: any): void {
    const web3Meta = {
      type: 'WEB3_EVENT',
      timestamp: new Date().toISOString(),
      ...meta
    };
    this.winston.log(level, `🔗 WEB3: ${message}`, web3Meta);
  }

  public validation(level: 'info' | 'warn' | 'error', message: string, meta?: any): void {
    const validationMeta = {
      type: 'VALIDATION_EVENT',
      timestamp: new Date().toISOString(),
      ...meta
    };
    this.winston.log(level, `✅ VALIDATION: ${message}`, validationMeta);
  }

  public config(level: 'info' | 'warn' | 'error', message: string, meta?: any): void {
    const configMeta = {
      type: 'CONFIG_EVENT',
      timestamp: new Date().toISOString(),
      ...meta
    };
    this.winston.log(level, `⚙️ CONFIG: ${message}`, configMeta);
  }

  public startup(message: string, meta?: any): void {
    const startupMeta = {
      type: 'STARTUP_EVENT',
      timestamp: new Date().toISOString(),
      ...meta
    };
    this.winston.info(`🚀 STARTUP: ${message}`, startupMeta);
  }

  // Method to log with emojis for better readability (similar to current console logs)
  public success(message: string, meta?: any): void {
    this.winston.info(`✅ ${message}`, meta);
  }

  public failure(message: string, meta?: any): void {
    this.winston.error(`❌ ${message}`, meta);
  }

  public warning(message: string, meta?: any): void {
    this.winston.warn(`⚠️ ${message}`, meta);
  }

  public processing(message: string, meta?: any): void {
    this.winston.info(`🔄 ${message}`, meta);
  }

  // Method to create child loggers with additional context
  public child(defaultMeta: any): winston.Logger {
    return this.winston.child(defaultMeta);
  }

  // Method to get the underlying Winston instance if needed
  public getWinstonInstance(): winston.Logger {
    return this.winston;
  }
}

// Create and export singleton instance
export const logger = Logger.getInstance();

// Export default logger for easy importing
export default logger;
