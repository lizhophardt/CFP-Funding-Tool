/**
 * Security Metrics Collection and Dashboard System
 * Tracks security events, attacks, and system health in real-time
 */

export interface SecurityMetric {
  timestamp: string;
  type: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  details: any;
}

export interface SecurityStats {
  totalRequests: number;
  validationFailures: number;
  rateLimitHits: number;
  xssAttempts: number;
  sqlInjectionAttempts: number;
  commandInjectionAttempts: number;
  suspiciousAddresses: number;
  successfulTransactions: number;
  failedTransactions: number;
  uniqueIPs: number;
  topAttackIPs: { ip: string; count: number }[];
  recentEvents: SecurityMetric[];
}

export class SecurityMetrics {
  private static instance: SecurityMetrics;
  private metrics: SecurityMetric[] = [];
  private stats: SecurityStats = {
    totalRequests: 0,
    validationFailures: 0,
    rateLimitHits: 0,
    xssAttempts: 0,
    sqlInjectionAttempts: 0,
    commandInjectionAttempts: 0,
    suspiciousAddresses: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    uniqueIPs: 0,
    topAttackIPs: [],
    recentEvents: []
  };
  private ipCounts: Map<string, number> = new Map();
  private readonly MAX_EVENTS = 1000; // Keep last 1000 events
  private readonly MAX_RECENT_EVENTS = 50; // Show last 50 in dashboard

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): SecurityMetrics {
    if (!SecurityMetrics.instance) {
      SecurityMetrics.instance = new SecurityMetrics();
    }
    return SecurityMetrics.instance;
  }

  /**
   * Record a security event
   */
  recordEvent(
    type: string,
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    source: string,
    details: any = {}
  ): void {
    const event: SecurityMetric = {
      timestamp: new Date().toISOString(),
      type,
      level,
      source,
      details
    };

    // Add to metrics array
    this.metrics.push(event);

    // Keep only recent events to prevent memory issues
    if (this.metrics.length > this.MAX_EVENTS) {
      this.metrics = this.metrics.slice(-this.MAX_EVENTS);
    }

    // Update stats
    this.updateStats(event);

    // Log high/critical events
    if (level === 'HIGH' || level === 'CRITICAL') {
      console.warn(`🚨 SECURITY EVENT [${level}]:`, {
        type,
        source,
        timestamp: event.timestamp,
        details: this.sanitizeDetailsForLog(details)
      });
    }
  }

  /**
   * Record a request (for total request counting)
   */
  recordRequest(ip: string): void {
    this.stats.totalRequests++;
    
    // Track unique IPs
    if (!this.ipCounts.has(ip)) {
      this.stats.uniqueIPs++;
    }
    
    // Update IP count
    this.ipCounts.set(ip, (this.ipCounts.get(ip) || 0) + 1);
    
    // Update top attack IPs
    this.updateTopAttackIPs();
  }

  /**
   * Record validation failure
   */
  recordValidationFailure(type: string, ip: string, details: any = {}): void {
    this.stats.validationFailures++;
    
    // Categorize the type of attack
    const lowerType = type.toLowerCase();
    if (lowerType.includes('xss') || lowerType.includes('script')) {
      this.stats.xssAttempts++;
    } else if (lowerType.includes('sql') || lowerType.includes('union') || lowerType.includes('drop')) {
      this.stats.sqlInjectionAttempts++;
    } else if (lowerType.includes('command') || lowerType.includes('exec') || lowerType.includes('eval')) {
      this.stats.commandInjectionAttempts++;
    }

    this.recordEvent('VALIDATION_FAILURE', 'MEDIUM', ip, { type, ...details });
  }

  /**
   * Record rate limit hit
   */
  recordRateLimitHit(ip: string, endpoint: string): void {
    this.stats.rateLimitHits++;
    this.recordEvent('RATE_LIMIT_HIT', 'MEDIUM', ip, { endpoint });
  }

  /**
   * Record suspicious address
   */
  recordSuspiciousAddress(address: string, reason: string, ip: string): void {
    this.stats.suspiciousAddresses++;
    this.recordEvent('SUSPICIOUS_ADDRESS', 'HIGH', ip, { 
      address: address.substring(0, 10) + '...', // Partial address for privacy
      reason 
    });
  }

  /**
   * Record successful transaction
   */
  recordSuccessfulTransaction(txHash: string, ip: string): void {
    this.stats.successfulTransactions++;
    this.recordEvent('SUCCESSFUL_TRANSACTION', 'LOW', ip, { 
      txHash: txHash.substring(0, 10) + '...' // Partial hash
    });
  }

  /**
   * Record failed transaction
   */
  recordFailedTransaction(reason: string, ip: string): void {
    this.stats.failedTransactions++;
    this.recordEvent('FAILED_TRANSACTION', 'MEDIUM', ip, { reason });
  }

  /**
   * Get current security statistics
   */
  getStats(): SecurityStats {
    return {
      ...this.stats,
      recentEvents: this.metrics.slice(-this.MAX_RECENT_EVENTS),
      topAttackIPs: this.getTopAttackIPs()
    };
  }

  /**
   * Get security dashboard data
   */
  getDashboardData(): {
    stats: SecurityStats;
    alerts: SecurityMetric[];
    trends: {
      hourlyRequests: number[];
      hourlyAttacks: number[];
    };
    summary: {
      securityLevel: 'SECURE' | 'MODERATE' | 'HIGH_RISK' | 'CRITICAL';
      activeThreats: number;
      recommendations: string[];
    };
  } {
    const stats = this.getStats();
    const alerts = this.getActiveAlerts();
    const trends = this.getTrends();
    const summary = this.getSecuritySummary(stats, alerts);

    return {
      stats,
      alerts,
      trends,
      summary
    };
  }

  /**
   * Get active security alerts (HIGH/CRITICAL events from last hour)
   */
  private getActiveAlerts(): SecurityMetric[] {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    return this.metrics.filter(event => 
      new Date(event.timestamp) > oneHourAgo &&
      (event.level === 'HIGH' || event.level === 'CRITICAL')
    );
  }

  /**
   * Get security trends (hourly data for last 24 hours)
   */
  private getTrends(): { hourlyRequests: number[]; hourlyAttacks: number[] } {
    const hours = 24;
    const hourlyRequests = new Array(hours).fill(0);
    const hourlyAttacks = new Array(hours).fill(0);
    
    const now = new Date();
    
    this.metrics.forEach(event => {
      const eventTime = new Date(event.timestamp);
      const hoursAgo = Math.floor((now.getTime() - eventTime.getTime()) / (1000 * 60 * 60));
      
      if (hoursAgo >= 0 && hoursAgo < hours) {
        const index = hours - 1 - hoursAgo;
        
        if (event.type === 'REQUEST') {
          hourlyRequests[index]++;
        } else if (event.level === 'MEDIUM' || event.level === 'HIGH' || event.level === 'CRITICAL') {
          hourlyAttacks[index]++;
        }
      }
    });
    
    return { hourlyRequests, hourlyAttacks };
  }

  /**
   * Get overall security summary
   */
  private getSecuritySummary(stats: SecurityStats, alerts: SecurityMetric[]): {
    securityLevel: 'SECURE' | 'MODERATE' | 'HIGH_RISK' | 'CRITICAL';
    activeThreats: number;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let securityLevel: 'SECURE' | 'MODERATE' | 'HIGH_RISK' | 'CRITICAL' = 'SECURE';
    
    const criticalAlerts = alerts.filter(a => a.level === 'CRITICAL').length;
    const highAlerts = alerts.filter(a => a.level === 'HIGH').length;
    
    // Determine security level
    if (criticalAlerts > 0) {
      securityLevel = 'CRITICAL';
      recommendations.push('Immediate action required: Critical security events detected');
    } else if (highAlerts > 5) {
      securityLevel = 'HIGH_RISK';
      recommendations.push('High number of security events - review and investigate');
    } else if (stats.validationFailures > 100 || stats.rateLimitHits > 50) {
      securityLevel = 'MODERATE';
      recommendations.push('Moderate security activity detected - monitor closely');
    }

    // Add specific recommendations
    if (stats.xssAttempts > 10) {
      recommendations.push('Multiple XSS attempts detected - review input validation');
    }
    if (stats.sqlInjectionAttempts > 5) {
      recommendations.push('SQL injection attempts detected - verify database security');
    }
    if (stats.suspiciousAddresses > 20) {
      recommendations.push('High number of suspicious addresses - review address validation');
    }
    if (stats.rateLimitHits > 20) {
      recommendations.push('Frequent rate limiting - consider adjusting limits or blocking IPs');
    }

    return {
      securityLevel,
      activeThreats: criticalAlerts + highAlerts,
      recommendations
    };
  }

  /**
   * Update statistics based on new event
   */
  private updateStats(event: SecurityMetric): void {
    // This is handled by specific record methods
  }

  /**
   * Update top attack IPs
   */
  private updateTopAttackIPs(): void {
    this.stats.topAttackIPs = Array.from(this.ipCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));
  }

  /**
   * Get top attack IPs
   */
  private getTopAttackIPs(): { ip: string; count: number }[] {
    return this.stats.topAttackIPs;
  }

  /**
   * Sanitize details for logging (remove sensitive information)
   */
  private sanitizeDetailsForLog(details: any): any {
    const sanitized = { ...details };
    
    // Remove or truncate sensitive fields
    if (sanitized.secretCode) {
      sanitized.secretCode = sanitized.secretCode.substring(0, 5) + '...';
    }
    if (sanitized.address) {
      sanitized.address = sanitized.address.substring(0, 10) + '...';
    }
    if (sanitized.userAgent && sanitized.userAgent.length > 50) {
      sanitized.userAgent = sanitized.userAgent.substring(0, 50) + '...';
    }
    
    return sanitized;
  }

  /**
   * Reset metrics (for testing or maintenance)
   */
  reset(): void {
    this.metrics = [];
    this.stats = {
      totalRequests: 0,
      validationFailures: 0,
      rateLimitHits: 0,
      xssAttempts: 0,
      sqlInjectionAttempts: 0,
      commandInjectionAttempts: 0,
      suspiciousAddresses: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      uniqueIPs: 0,
      topAttackIPs: [],
      recentEvents: []
    };
    this.ipCounts.clear();
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): {
    generatedAt: string;
    totalEvents: number;
    stats: SecurityStats;
    events: SecurityMetric[];
  } {
    return {
      generatedAt: new Date().toISOString(),
      totalEvents: this.metrics.length,
      stats: this.getStats(),
      events: this.metrics
    };
  }
}
