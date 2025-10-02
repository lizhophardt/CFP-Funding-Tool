/**
 * Security headers utility for enhanced protection
 */

export interface CSPDirectives {
  [key: string]: string[];
}

export class SecurityHeaders {
  /**
   * Get Content Security Policy directives based on environment
   */
  static getCSPDirectives(environment: string = 'production'): CSPDirectives {
    const baseDirectives: CSPDirectives = {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      manifestSrc: ["'self'"],
      mediaSrc: ["'self'", "https:"],
      workerSrc: ["'self'"]
    };

    // Add development-specific directives if needed
    if (environment === 'development') {
      // Allow localhost connections for development
      baseDirectives.connectSrc.push('http://localhost:*', 'ws://localhost:*');
    }

    return baseDirectives;
  }

  /**
   * Get security headers summary for API responses
   */
  static getSecuritySummary() {
    return {
      csp: {
        status: 'Strict Content Security Policy enabled',
        scriptSrc: 'Self only (no inline scripts)',
        violations: 'Monitored and logged',
        features: [
          'XSS protection',
          'Clickjacking prevention', 
          'HTTPS upgrade in production',
          'Object injection prevention',
          'Base URI restriction'
        ]
      },
      headers: {
        hsts: 'HTTP Strict Transport Security enabled',
        xssFilter: 'X-XSS-Protection enabled',
        noSniff: 'X-Content-Type-Options: nosniff',
        referrerPolicy: 'strict-origin-when-cross-origin'
      }
    };
  }

  /**
   * Validate if a URL would be allowed by CSP
   */
  static isAllowedByCSP(url: string, directive: string, environment: string = 'production'): boolean {
    const directives = this.getCSPDirectives(environment);
    const allowedSources = directives[directive] || [];

    // Check if URL matches any allowed source
    return allowedSources.some(source => {
      if (source === "'self'") {
        // For API-only service, 'self' means the API domain
        return url.startsWith('/') || url.includes(process.env.API_DOMAIN || 'localhost');
      }
      if (source === "'none'") {
        return false;
      }
      if (source.startsWith('http')) {
        return url.startsWith(source);
      }
      return false;
    });
  }

  /**
   * Generate nonce for inline scripts if absolutely necessary
   */
  static generateNonce(): string {
    return Buffer.from(Math.random().toString()).toString('base64').substring(0, 16);
  }

  /**
   * Log CSP violation with security context
   */
  static logCSPViolation(violation: any, request: any) {
    const securityEvent = {
      type: 'CSP_VIOLATION',
      timestamp: new Date().toISOString(),
      severity: 'WARNING',
      client: {
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        referer: request.get('Referer')
      },
      violation: {
        blockedUri: violation['blocked-uri'],
        documentUri: violation['document-uri'],
        violatedDirective: violation['violated-directive'],
        originalPolicy: violation['original-policy'],
        disposition: violation.disposition,
        statusCode: violation['status-code']
      },
      risk: this.assessViolationRisk(violation)
    };

    const { logger } = require('./logger');
    logger.security('warn', 'CSP VIOLATION', securityEvent);

    // In production, you might want to send this to a security monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: await sendToSecurityMonitoring(securityEvent);
    }

    return securityEvent;
  }

  /**
   * Assess the risk level of a CSP violation
   */
  private static assessViolationRisk(violation: any): 'LOW' | 'MEDIUM' | 'HIGH' {
    const blockedUri = violation['blocked-uri'] || '';
    const violatedDirective = violation['violated-directive'] || '';

    // High risk: Script violations or data: URIs
    if (violatedDirective.includes('script-src') || blockedUri.startsWith('data:')) {
      return 'HIGH';
    }

    // Medium risk: Style or connect violations
    if (violatedDirective.includes('style-src') || violatedDirective.includes('connect-src')) {
      return 'MEDIUM';
    }

    // Low risk: Other violations
    return 'LOW';
  }
}
