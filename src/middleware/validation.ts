import { Request, Response, NextFunction } from 'express';
import { InputValidator } from '../utils/inputValidator';

export const validateAirdropRequest = (req: Request, res: Response, next: NextFunction): void => {
  // Comprehensive validation using InputValidator
  const validationResult = InputValidator.validate(req.body, 'airdropRequest');

  if (!validationResult.isValid) {
    // Log security event for monitoring
    InputValidator.logSecurityEvent(
      'AIRDROP_REQUEST_VALIDATION_FAILED',
      req.body,
      validationResult.securityRisk || 'MEDIUM',
      {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer')
      }
    );

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationResult.errors,
      code: 'VALIDATION_ERROR'
    });
    return;
  }

  // Replace request body with sanitized data
  req.body = validationResult.sanitizedData;
  
  // Add validation metadata for logging
  req.validationMeta = {
    validated: true,
    securityRisk: validationResult.securityRisk,
    timestamp: new Date().toISOString()
  };

  next();
};

export const validateTestHashRequest = (req: Request, res: Response, next: NextFunction): void => {
  // Comprehensive validation using InputValidator
  const validationResult = InputValidator.validate(req.body, 'testHashRequest');

  if (!validationResult.isValid) {
    // Log security event for monitoring
    InputValidator.logSecurityEvent(
      'TEST_HASH_REQUEST_VALIDATION_FAILED',
      req.body,
      validationResult.securityRisk || 'MEDIUM',
      {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer')
      }
    );

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationResult.errors,
      code: 'VALIDATION_ERROR'
    });
    return;
  }

  // Replace request body with sanitized data
  req.body = validationResult.sanitizedData;
  
  // Add validation metadata for logging
  req.validationMeta = {
    validated: true,
    securityRisk: validationResult.securityRisk,
    timestamp: new Date().toISOString()
  };

  next();
};

export const validateTestCodeRequest = (req: Request, res: Response, next: NextFunction): void => {
  // Comprehensive validation using InputValidator
  const validationResult = InputValidator.validate(req.body, 'testCodeRequest');

  if (!validationResult.isValid) {
    // Log security event for monitoring
    InputValidator.logSecurityEvent(
      'TEST_CODE_REQUEST_VALIDATION_FAILED',
      req.body,
      validationResult.securityRisk || 'MEDIUM',
      {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer')
      }
    );

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationResult.errors,
      code: 'VALIDATION_ERROR'
    });
    return;
  }

  // Replace request body with sanitized data
  req.body = validationResult.sanitizedData;
  
  // Add validation metadata for logging
  req.validationMeta = {
    validated: true,
    securityRisk: validationResult.securityRisk,
    timestamp: new Date().toISOString()
  };

  next();
};

export const validateQueryParams = (req: Request, res: Response, next: NextFunction): void => {
  // Validate query parameters
  const validationResult = InputValidator.validateQueryParams(req.query);

  if (!validationResult.isValid) {
    // Log security event for monitoring
    InputValidator.logSecurityEvent(
      'QUERY_PARAMS_VALIDATION_FAILED',
      req.query,
      validationResult.securityRisk || 'LOW',
      {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer')
      }
    );

    res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: validationResult.errors,
      code: 'QUERY_VALIDATION_ERROR'
    });
    return;
  }

  // Replace query with sanitized data
  req.query = validationResult.sanitizedData;

  next();
};
