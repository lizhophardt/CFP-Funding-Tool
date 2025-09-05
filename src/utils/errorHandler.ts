/**
 * Secure error handling utility to prevent information disclosure
 */

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export interface SecureError {
  type: ErrorType;
  publicMessage: string;
  internalMessage: string;
  code: string;
}

export class SecurityErrorHandler {
  private static isProduction = process.env.NODE_ENV === 'production';

  /**
   * Create a secure error that shows safe messages in production
   */
  static createSecureError(
    type: ErrorType,
    internalMessage: string,
    publicMessage?: string
  ): SecureError {
    const errorMappings = {
      [ErrorType.VALIDATION]: {
        public: 'Invalid request parameters',
        code: 'VAL_001'
      },
      [ErrorType.INSUFFICIENT_BALANCE]: {
        public: 'Insufficient funds for transaction',
        code: 'BAL_001'
      },
      [ErrorType.NETWORK_ERROR]: {
        public: 'Network connection error',
        code: 'NET_001'
      },
      [ErrorType.TRANSACTION_FAILED]: {
        public: 'Transaction could not be processed',
        code: 'TXN_001'
      },
      [ErrorType.AUTHENTICATION_FAILED]: {
        public: 'Authentication failed',
        code: 'AUTH_001'
      },
      [ErrorType.INTERNAL_ERROR]: {
        public: 'An internal error occurred',
        code: 'INT_001'
      }
    };

    const mapping = errorMappings[type];
    
    return {
      type,
      publicMessage: publicMessage || mapping.public,
      internalMessage,
      code: mapping.code
    };
  }

  /**
   * Log error securely and return appropriate message for client
   */
  static handleError(error: SecureError | Error | string): string {
    let secureError: SecureError;

    // Convert different error types to SecureError
    if (typeof error === 'string') {
      secureError = this.createSecureError(ErrorType.INTERNAL_ERROR, error);
    } else if (error instanceof Error) {
      secureError = this.createSecureError(ErrorType.INTERNAL_ERROR, error.message);
    } else {
      secureError = error;
    }

    // Always log the detailed error for debugging
    console.error(`[${secureError.code}] ${secureError.type}:`, {
      internal: secureError.internalMessage,
      public: secureError.publicMessage,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });

    // Return appropriate message based on environment
    return this.isProduction ? secureError.publicMessage : secureError.internalMessage;
  }

  /**
   * Throw a secure error
   */
  static throwSecureError(type: ErrorType, internalMessage: string, publicMessage?: string): never {
    const secureError = this.createSecureError(type, internalMessage, publicMessage);
    const message = this.handleError(secureError);
    throw new Error(message);
  }

  /**
   * Sanitize error message for API responses
   */
  static sanitizeForAPI(error: any): { success: false; message: string; code?: string } {
    if (typeof error === 'object' && error.type && error.publicMessage) {
      // It's already a SecureError
      const secureError = error as SecureError;
      return {
        success: false,
        message: this.isProduction ? secureError.publicMessage : secureError.internalMessage,
        code: secureError.code
      };
    }

    // Handle regular Error objects
    const secureError = this.createSecureError(
      ErrorType.INTERNAL_ERROR,
      error?.message || String(error)
    );

    this.handleError(secureError);

    return {
      success: false,
      message: this.isProduction ? secureError.publicMessage : secureError.internalMessage,
      code: secureError.code
    };
  }
}
