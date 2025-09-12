/**
 * Threat Protection Middleware
 * Blocks requests from IPs identified as threats
 */

import { Request, Response, NextFunction } from 'express';
import { ThreatResponse } from '../utils/threatResponse';

/**
 * Middleware to check if IP is blocked
 */
export const checkBlockedIP = (req: Request, res: Response, next: NextFunction): void => {
  const threatResponse = ThreatResponse.getInstance();
  const ip = req.ip || 'unknown';

  // Skip check for localhost in development
  if (process.env.NODE_ENV === 'development' && (ip === '::1' || ip === '127.0.0.1')) {
    next();
    return;
  }

  const blockStatus = threatResponse.isBlocked(ip);
  
  if (blockStatus.blocked) {
    console.warn(`🚫 BLOCKED IP ATTEMPT:`, {
      ip,
      reason: blockStatus.reason,
      expiresAt: blockStatus.expiresAt,
      endpoint: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    res.status(403).json({
      success: false,
      message: 'Access denied',
      code: 'IP_BLOCKED',
      details: {
        reason: 'Your IP has been temporarily blocked due to suspicious activity',
        expiresAt: blockStatus.expiresAt === 'permanent' ? null : blockStatus.expiresAt
      }
    });
    return;
  }

  next();
};

/**
 * Middleware to record threat events
 */
export const recordThreatEvent = (
  type: 'VALIDATION_FAILURE' | 'SUSPICIOUS_ADDRESS' | 'FAILED_TRANSACTION',
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const threatResponse = ThreatResponse.getInstance();
    const ip = req.ip || 'unknown';

    // Skip for localhost in development
    if (process.env.NODE_ENV === 'development' && (ip === '::1' || ip === '127.0.0.1')) {
      next();
      return;
    }

    const result = threatResponse.recordThreatEvent(ip, type, severity, {
      endpoint: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    if (result.blocked) {
      console.warn(`🚨 IP AUTO-BLOCKED:`, {
        ip,
        rule: result.rule,
        reason: result.reason,
        endpoint: req.path,
        timestamp: new Date().toISOString()
      });

      res.status(403).json({
        success: false,
        message: 'Access denied due to suspicious activity',
        code: 'IP_AUTO_BLOCKED',
        details: {
          reason: 'Your IP has been automatically blocked due to repeated security violations'
        }
      });
      return;
    }

    next();
  };
};
