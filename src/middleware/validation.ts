import { Request, Response, NextFunction } from 'express';
import { InputValidator } from '../utils/inputValidator';
import { SecurityMetrics } from '../utils/securityMetrics';
import { ThreatResponse } from '../utils/threatResponse';

export const validateAirdropRequest = (req: Request, res: Response, next: NextFunction): void => {
  // Comprehensive validation using InputValidator
  const validationResult = InputValidator.validate(req.body, 'airdropRequest');

  if (!validationResult.isValid) {
    // Record security metrics
    const securityMetrics = SecurityMetrics.getInstance();
    const threatResponse = ThreatResponse.getInstance();
    const errorType = validationResult.errors?.[0] || 'Unknown validation error';
    const ip = req.ip || 'unknown';
    
    securityMetrics.recordValidationFailure(errorType, ip, {
      endpoint: req.path,
      userAgent: req.get('User-Agent'),
      errors: validationResult.errors
    });

    // Record threat event and check for auto-blocking
    const severity = validationResult.securityRisk === 'HIGH' ? 'HIGH' : 
                    validationResult.securityRisk === 'MEDIUM' ? 'MEDIUM' : 'LOW';
    
    const threatResult = threatResponse.recordThreatEvent(ip, 'VALIDATION_FAILURE', severity, {
      endpoint: req.path,
      errorType,
      errors: validationResult.errors
    });

    if (threatResult.blocked) {
      res.status(403).json({
        success: false,
        message: 'Access denied due to repeated security violations',
        code: 'IP_AUTO_BLOCKED'
      });
      return;
    }

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
