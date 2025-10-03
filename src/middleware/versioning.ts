import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Extend Request type to include version information
declare global {
  namespace Express {
    interface Request {
      apiVersion?: string;
      isLegacyRequest?: boolean;
    }
  }
}

/**
 * Middleware to detect and set API version information
 */
export const apiVersionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Get the full path including /api prefix
  const fullPath = req.originalUrl.split('?')[0]; // Remove query params
  
  // Debug logging
  logger.info('API Version Middleware Debug', {
    originalUrl: req.originalUrl,
    fullPath: fullPath,
    method: req.method
  });
  
  // Extract version from URL path - check for /api/v1/... pattern
  const versionMatch = fullPath.match(/\/api\/v(\d+)/);
  
  if (versionMatch) {
    req.apiVersion = `v${versionMatch[1]}`;
    req.isLegacyRequest = false;
    logger.info('Detected versioned endpoint', { version: req.apiVersion, path: fullPath });
  } else if (fullPath.includes('/api/airdrop') && !fullPath.includes('/api/v1/airdrop')) {
    // Legacy endpoint detection - /api/airdrop/* (not /api/v1/airdrop/*)
    req.apiVersion = 'v1'; // Default to v1 for legacy
    req.isLegacyRequest = true;
    
    // Log legacy usage for monitoring
    logger.warn('Legacy API endpoint accessed', {
      path: fullPath,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  } else {
    req.apiVersion = 'v1'; // Default version
    req.isLegacyRequest = false;
    logger.info('Default version assigned', { version: req.apiVersion, path: fullPath });
  }

  // Add version info to response headers
  res.set({
    'X-API-Version': req.apiVersion,
    'X-API-Legacy': req.isLegacyRequest ? 'true' : 'false'
  });

  // Add deprecation warning for legacy endpoints
  if (req.isLegacyRequest) {
    res.set({
      'Warning': '299 - "This API endpoint is deprecated. Please use /api/v1/ endpoints instead."',
      'Deprecation': 'true'
    });
  }

  next();
};

/**
 * Middleware to validate API version support
 */
export const validateApiVersion = (supportedVersions: string[] = ['v1']) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const requestedVersion = req.apiVersion || 'v1';
    
    if (!supportedVersions.includes(requestedVersion)) {
      res.status(400).json({
        success: false,
        message: `API version ${requestedVersion} is not supported`,
        supportedVersions,
        currentVersion: 'v1'
      });
      return;
    }
    
    next();
  };

/**
 * Utility to get version-specific response format
 */
export const getVersionedResponse = (req: Request, data: any): any => {
  const version = req.apiVersion || 'v1';
  
  switch (version) {
    case 'v1':
      return {
        ...data,
        apiVersion: 'v1',
        ...(req.isLegacyRequest && {
          _deprecationWarning: 'This endpoint is deprecated. Please use /api/v1/ endpoints.'
        })
      };
    default:
      return data;
  }
};

/**
 * Utility to log version usage metrics
 */
export const logVersionUsage = (req: Request): void => {
  logger.info('API version usage', {
    version: req.apiVersion,
    isLegacy: req.isLegacyRequest,
    endpoint: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
};
