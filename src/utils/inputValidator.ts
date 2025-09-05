/**
 * Comprehensive Input Validation and Sanitization System
 * Provides enterprise-grade input security against various attack vectors
 */

import Joi from 'joi';
import validator from 'validator';

export interface ValidationResult {
  isValid: boolean;
  sanitizedData?: any;
  errors?: string[];
  securityRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class InputValidator {
  private static readonly MAX_STRING_LENGTH = 1000;
  private static readonly MAX_ADDRESS_LENGTH = 42;
  private static readonly MIN_ADDRESS_LENGTH = 42;
  
  // Ethereum address pattern (more strict)
  private static readonly ETH_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
  
  // Secret code pattern (alphanumeric + some special chars, no scripts)
  private static readonly SECRET_CODE_PATTERN = /^[a-zA-Z0-9\-_\.]{1,100}$/;
  
  // Dangerous patterns that could indicate injection attacks
  private static readonly DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,  // Script tags
    /javascript:/gi,                                        // JavaScript protocol
    /on\w+\s*=/gi,                                         // Event handlers
    /expression\s*\(/gi,                                   // CSS expressions
    /eval\s*\(/gi,                                         // eval() calls
    /Function\s*\(/gi,                                     // Function constructor
    /setTimeout\s*\(/gi,                                   // setTimeout
    /setInterval\s*\(/gi,                                  // setInterval
    /document\./gi,                                        // DOM manipulation
    /window\./gi,                                          // Window object access
    /<iframe/gi,                                           // iframe tags
    /<object/gi,                                           // object tags
    /<embed/gi,                                            // embed tags
    /vbscript:/gi,                                         // VBScript protocol
    /data:text\/html/gi,                                   // Data URIs with HTML
    /data:application\/x-javascript/gi,                    // Data URIs with JS
    /data:text\/javascript/gi,                             // Data URIs with JS
    /\.\.\//gi,                                            // Directory traversal
    /\0/g,                                                 // Null bytes
    /%00/gi,                                               // URL-encoded null bytes
    /%3Cscript/gi,                                         // URL-encoded script
    /%3C%2Fscript/gi,                                      // URL-encoded /script
    /union\s+select/gi,                                    // SQL injection
    /insert\s+into/gi,                                     // SQL injection
    /delete\s+from/gi,                                     // SQL injection
    /drop\s+table/gi,                                      // SQL injection
    /create\s+table/gi,                                    // SQL injection
    /alter\s+table/gi,                                     // SQL injection
    /exec\s*\(/gi,                                         // Command execution
    /system\s*\(/gi,                                       // System calls
    /cmd\s*\(/gi,                                          // Command calls
    /powershell/gi,                                        // PowerShell
    /bash/gi,                                              // Bash
    /sh\s/gi,                                              // Shell
    /\$\{/gi,                                              // Template literal injection
    /\$\(/gi,                                              // Command substitution
    /`[^`]*`/gi,                                           // Template literals
    /<!--[\s\S]*?-->/gi,                                   // HTML comments (potential data hiding)
  ];

  /**
   * Joi schemas for different types of requests
   */
  private static readonly schemas = {
    airdropRequest: Joi.object({
      secretCode: Joi.string()
        .min(1)
        .max(100)
        .pattern(InputValidator.SECRET_CODE_PATTERN)
        .required()
        .messages({
          'string.pattern.base': 'Secret code contains invalid characters. Only alphanumeric characters, hyphens, underscores, and dots are allowed.',
          'string.min': 'Secret code cannot be empty',
          'string.max': 'Secret code too long (max 100 characters)',
          'any.required': 'Secret code is required'
        }),
      recipientAddress: Joi.string()
        .length(42)
        .pattern(InputValidator.ETH_ADDRESS_PATTERN)
        .required()
        .messages({
          'string.pattern.base': 'Invalid Ethereum address format. Must be 42 characters starting with 0x followed by 40 hexadecimal characters.',
          'string.length': 'Ethereum address must be exactly 42 characters',
          'any.required': 'Recipient address is required'
        })
    }),

    testHashRequest: Joi.object({
      preimage: Joi.string()
        .min(1)
        .max(200)
        .pattern(/^[a-zA-Z0-9\-_\s]{1,200}$/)
        .required()
        .messages({
          'string.pattern.base': 'Preimage contains invalid characters. Only alphanumeric characters, hyphens, underscores, and spaces are allowed.',
          'string.min': 'Preimage cannot be empty',
          'string.max': 'Preimage too long (max 200 characters)',
          'any.required': 'Preimage is required'
        })
    }),

    testCodeRequest: Joi.object({
      prefix: Joi.string()
        .min(1)
        .max(50)
        .pattern(/^[a-zA-Z0-9\-_]{1,50}$/)
        .optional()
        .messages({
          'string.pattern.base': 'Prefix contains invalid characters. Only alphanumeric characters, hyphens, and underscores are allowed.',
          'string.min': 'Prefix cannot be empty if provided',
          'string.max': 'Prefix too long (max 50 characters)'
        })
    }),

    // Query parameters validation
    queryParams: Joi.object({
      limit: Joi.number().integer().min(1).max(100).optional(),
      offset: Joi.number().integer().min(0).optional(),
      sort: Joi.string().valid('asc', 'desc').optional(),
      format: Joi.string().valid('json', 'xml').optional()
    })
  };

  /**
   * Validate and sanitize input data
   */
  static validate(data: any, schemaType: keyof typeof InputValidator.schemas): ValidationResult {
    try {
      // Step 1: Schema validation
      const schema = InputValidator.schemas[schemaType];
      const { error, value } = schema.validate(data, { 
        abortEarly: false,
        stripUnknown: true,  // Remove unknown properties
        convert: true        // Convert types when possible
      });

      if (error) {
        return {
          isValid: false,
          errors: error.details.map(detail => detail.message),
          securityRisk: 'MEDIUM'
        };
      }

      // Step 2: Security scan for dangerous patterns
      const securityScan = InputValidator.scanForThreats(value);
      if (!securityScan.isSafe) {
        return {
          isValid: false,
          errors: [`Security threat detected: ${securityScan.threatType}`],
          securityRisk: securityScan.riskLevel
        };
      }

      // Step 3: Sanitize the validated data
      const sanitizedData = InputValidator.sanitizeData(value);

      return {
        isValid: true,
        sanitizedData,
        securityRisk: 'LOW'
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        securityRisk: 'HIGH'
      };
    }
  }

  /**
   * Scan input for security threats
   */
  private static scanForThreats(data: any): { isSafe: boolean; threatType?: string; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' } {
    const dataString = JSON.stringify(data).toLowerCase();

    // Check for dangerous patterns
    for (const pattern of InputValidator.DANGEROUS_PATTERNS) {
      if (pattern.test(dataString)) {
        const threatType = InputValidator.identifyThreatType(pattern);
        return {
          isSafe: false,
          threatType,
          riskLevel: InputValidator.assessRiskLevel(pattern)
        };
      }
    }

    // Check for suspicious character sequences
    if (InputValidator.hasSuspiciousCharacters(dataString)) {
      return {
        isSafe: false,
        threatType: 'Suspicious character sequence detected',
        riskLevel: 'MEDIUM'
      };
    }

    return { isSafe: true, riskLevel: 'LOW' };
  }

  /**
   * Identify the type of security threat
   */
  private static identifyThreatType(pattern: RegExp): string {
    const patternString = pattern.toString();
    
    if (patternString.includes('script') || patternString.includes('javascript')) {
      return 'XSS (Cross-Site Scripting) attempt';
    }
    if (patternString.includes('union') || patternString.includes('select') || patternString.includes('insert')) {
      return 'SQL Injection attempt';
    }
    if (patternString.includes('eval') || patternString.includes('Function') || patternString.includes('exec')) {
      return 'Code Injection attempt';
    }
    if (patternString.includes('iframe') || patternString.includes('object') || patternString.includes('embed')) {
      return 'HTML Injection attempt';
    }
    if (patternString.includes('\\.\\./')) {
      return 'Directory Traversal attempt';
    }
    if (patternString.includes('cmd') || patternString.includes('bash') || patternString.includes('powershell')) {
      return 'Command Injection attempt';
    }
    
    return 'Malicious pattern detected';
  }

  /**
   * Assess risk level based on threat pattern
   */
  private static assessRiskLevel(pattern: RegExp): 'LOW' | 'MEDIUM' | 'HIGH' {
    const patternString = pattern.toString();
    
    // High risk patterns
    if (patternString.includes('script') || patternString.includes('eval') || 
        patternString.includes('exec') || patternString.includes('system')) {
      return 'HIGH';
    }
    
    // Medium risk patterns
    if (patternString.includes('union') || patternString.includes('iframe') || 
        patternString.includes('\\.\\./') || patternString.includes('cmd')) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  /**
   * Check for suspicious character sequences
   */
  private static hasSuspiciousCharacters(input: string): boolean {
    // Multiple consecutive special characters
    if (/[<>'"&%]{3,}/.test(input)) return true;
    
    // Excessive URL encoding
    if ((input.match(/%[0-9a-f]{2}/gi) || []).length > 5) return true;
    
    // Multiple script-like patterns
    if ((input.match(/[<>(){}[\]]/g) || []).length > 10) return true;
    
    return false;
  }

  /**
   * Sanitize validated data
   */
  private static sanitizeData(data: any): any {
    if (typeof data === 'string') {
      return InputValidator.sanitizeString(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => InputValidator.sanitizeData(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = InputValidator.sanitizeData(value);
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * Sanitize string input
   */
  private static sanitizeString(input: string): string {
    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');
    
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    // Remove potentially dangerous HTML entities
    sanitized = validator.escape(sanitized);
    
    // Additional sanitization for specific contexts
    sanitized = sanitized.replace(/[<>]/g, ''); // Remove angle brackets
    
    return sanitized;
  }

  /**
   * Validate Ethereum address with additional security checks
   */
  static validateEthereumAddress(address: string): ValidationResult {
    // Basic format validation
    if (!InputValidator.ETH_ADDRESS_PATTERN.test(address)) {
      return {
        isValid: false,
        errors: ['Invalid Ethereum address format'],
        securityRisk: 'MEDIUM'
      };
    }

    // Check for common attack patterns in addresses
    const lowerAddress = address.toLowerCase();
    
    // Check for suspicious patterns that might indicate fake addresses
    const suspiciousPatterns = [
      /^0x0+$/,           // All zeros
      /^0xf+$/,           // All F's
      /(.)\1{10,}/,       // Too many repeated characters
      /^0x(dead|beef|cafe|babe|face)/  // Common test patterns
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(lowerAddress)) {
        return {
          isValid: false,
          errors: ['Suspicious address pattern detected'],
          securityRisk: 'HIGH'
        };
      }
    }

    // Checksum validation (if mixed case)
    if (address !== address.toLowerCase() && address !== address.toUpperCase()) {
      // This would require web3 utils for proper checksum validation
      // For now, we'll accept it if it passes basic format validation
    }

    return {
      isValid: true,
      sanitizedData: address.toLowerCase(), // Normalize to lowercase
      securityRisk: 'LOW'
    };
  }

  /**
   * Validate query parameters
   */
  static validateQueryParams(query: any): ValidationResult {
    return InputValidator.validate(query, 'queryParams');
  }

  /**
   * Get validation schema for a specific request type
   */
  static getSchema(schemaType: keyof typeof InputValidator.schemas) {
    return InputValidator.schemas[schemaType];
  }

  /**
   * Security audit log for validation failures
   */
  static logSecurityEvent(eventType: string, data: any, risk: 'LOW' | 'MEDIUM' | 'HIGH', clientInfo?: any) {
    const securityEvent = {
      type: 'INPUT_VALIDATION_FAILURE',
      eventType,
      timestamp: new Date().toISOString(),
      risk,
      data: {
        // Log sanitized version to avoid logging sensitive data
        keys: Object.keys(data || {}),
        dataTypes: typeof data === 'object' ? 
          Object.entries(data || {}).reduce((acc, [key, value]) => ({
            ...acc,
            [key]: typeof value
          }), {}) : typeof data
      },
      client: clientInfo
    };

    if (risk === 'HIGH') {
      console.error('🚨 HIGH RISK INPUT VALIDATION FAILURE:', securityEvent);
    } else if (risk === 'MEDIUM') {
      console.warn('⚠️  MEDIUM RISK INPUT VALIDATION FAILURE:', securityEvent);
    } else {
      console.log('ℹ️  INPUT VALIDATION FAILURE:', securityEvent);
    }

    return securityEvent;
  }
}
