/**
 * Automated Threat Response System
 * Automatically blocks IPs based on suspicious behavior patterns
 */

export interface ThreatRule {
  name: string;
  condition: (ip: string, events: ThreatEvent[]) => boolean;
  action: 'WARN' | 'TEMP_BLOCK' | 'PERM_BLOCK';
  blockDuration?: number; // minutes
  description: string;
}

export interface ThreatEvent {
  timestamp: string;
  ip: string;
  type: 'VALIDATION_FAILURE' | 'RATE_LIMIT' | 'SUSPICIOUS_ADDRESS' | 'FAILED_TRANSACTION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: any;
}

export interface BlockedIP {
  ip: string;
  blockedAt: string;
  expiresAt: string | null; // null for permanent blocks
  reason: string;
  rule: string;
  eventCount: number;
}

export class ThreatResponse {
  private static instance: ThreatResponse;
  private blockedIPs: Map<string, BlockedIP> = new Map();
  private threatEvents: Map<string, ThreatEvent[]> = new Map();
  private readonly MAX_EVENTS_PER_IP = 100;

  // Default threat rules
  private threatRules: ThreatRule[] = [
    {
      name: 'RAPID_VALIDATION_FAILURES',
      condition: (ip, events) => {
        const recentEvents = this.getRecentEvents(events, 5); // Last 5 minutes
        const validationFailures = recentEvents.filter(e => e.type === 'VALIDATION_FAILURE');
        return validationFailures.length >= 10; // 10+ validation failures in 5 minutes
      },
      action: 'TEMP_BLOCK',
      blockDuration: 60, // 1 hour
      description: 'Multiple validation failures in short time'
    },
    {
      name: 'REPEATED_XSS_ATTEMPTS',
      condition: (ip, events) => {
        const recentEvents = this.getRecentEvents(events, 10); // Last 10 minutes
        const xssAttempts = recentEvents.filter(e => 
          e.type === 'VALIDATION_FAILURE' && 
          JSON.stringify(e.details).toLowerCase().includes('script')
        );
        return xssAttempts.length >= 5; // 5+ XSS attempts
      },
      action: 'TEMP_BLOCK',
      blockDuration: 240, // 4 hours
      description: 'Repeated XSS injection attempts'
    },
    {
      name: 'SQL_INJECTION_ATTEMPTS',
      condition: (ip, events) => {
        const recentEvents = this.getRecentEvents(events, 10); // Last 10 minutes
        const sqlAttempts = recentEvents.filter(e => 
          e.type === 'VALIDATION_FAILURE' && 
          (JSON.stringify(e.details).toLowerCase().includes('union') ||
           JSON.stringify(e.details).toLowerCase().includes('drop') ||
           JSON.stringify(e.details).toLowerCase().includes('select'))
        );
        return sqlAttempts.length >= 3; // 3+ SQL injection attempts
      },
      action: 'TEMP_BLOCK',
      blockDuration: 480, // 8 hours
      description: 'SQL injection attack attempts'
    },
    {
      name: 'EXCESSIVE_RATE_LIMITING',
      condition: (ip, events) => {
        const recentEvents = this.getRecentEvents(events, 15); // Last 15 minutes
        const rateLimitHits = recentEvents.filter(e => e.type === 'RATE_LIMIT');
        return rateLimitHits.length >= 20; // 20+ rate limit hits
      },
      action: 'TEMP_BLOCK',
      blockDuration: 120, // 2 hours
      description: 'Excessive rate limit violations'
    },
    {
      name: 'SUSPICIOUS_ADDRESS_PATTERN',
      condition: (ip, events) => {
        const recentEvents = this.getRecentEvents(events, 30); // Last 30 minutes
        const suspiciousAddresses = recentEvents.filter(e => e.type === 'SUSPICIOUS_ADDRESS');
        return suspiciousAddresses.length >= 10; // 10+ suspicious addresses
      },
      action: 'TEMP_BLOCK',
      blockDuration: 180, // 3 hours
      description: 'Multiple suspicious address submissions'
    },
    {
      name: 'CRITICAL_THREAT_LEVEL',
      condition: (ip, events) => {
        const recentEvents = this.getRecentEvents(events, 5); // Last 5 minutes
        const criticalEvents = recentEvents.filter(e => e.severity === 'CRITICAL');
        return criticalEvents.length >= 1; // Any critical event
      },
      action: 'TEMP_BLOCK',
      blockDuration: 1440, // 24 hours
      description: 'Critical security threat detected'
    }
  ];

  private constructor() {
    // Singleton pattern
    this.startCleanupInterval();
  }

  public static getInstance(): ThreatResponse {
    if (!ThreatResponse.instance) {
      ThreatResponse.instance = new ThreatResponse();
    }
    return ThreatResponse.instance;
  }

  /**
   * Record a threat event and check for automated response
   */
  recordThreatEvent(
    ip: string, 
    type: ThreatEvent['type'], 
    severity: ThreatEvent['severity'],
    details: any = {}
  ): { blocked: boolean; rule?: string; reason?: string } {
    // Don't process events for already permanently blocked IPs
    const existingBlock = this.blockedIPs.get(ip);
    if (existingBlock && existingBlock.expiresAt === null) {
      return { blocked: true, rule: existingBlock.rule, reason: existingBlock.reason };
    }

    // Record the event
    const event: ThreatEvent = {
      timestamp: new Date().toISOString(),
      ip,
      type,
      severity,
      details
    };

    // Add to IP's event history
    if (!this.threatEvents.has(ip)) {
      this.threatEvents.set(ip, []);
    }
    
    const ipEvents = this.threatEvents.get(ip)!;
    ipEvents.push(event);
    
    // Keep only recent events to prevent memory issues
    if (ipEvents.length > this.MAX_EVENTS_PER_IP) {
      this.threatEvents.set(ip, ipEvents.slice(-this.MAX_EVENTS_PER_IP));
    }

    // Check threat rules
    const matchedRule = this.evaluateThreatRules(ip, ipEvents);
    if (matchedRule) {
      return this.executeAction(ip, matchedRule, ipEvents.length);
    }

    return { blocked: false };
  }

  /**
   * Check if an IP is currently blocked
   */
  isBlocked(ip: string): { blocked: boolean; reason?: string; expiresAt?: string } {
    const block = this.blockedIPs.get(ip);
    
    if (!block) {
      return { blocked: false };
    }

    // Check if temporary block has expired
    if (block.expiresAt && new Date() > new Date(block.expiresAt)) {
      this.blockedIPs.delete(ip);
      console.log(`⏰ Temporary block expired for IP: ${ip}`);
      return { blocked: false };
    }

    return { 
      blocked: true, 
      reason: block.reason,
      expiresAt: block.expiresAt || 'permanent'
    };
  }

  /**
   * Manually block an IP
   */
  blockIP(
    ip: string, 
    reason: string, 
    duration?: number, // minutes, null for permanent
    rule: string = 'MANUAL'
  ): void {
    const expiresAt = duration ? 
      new Date(Date.now() + duration * 60 * 1000).toISOString() : 
      null;

    const block: BlockedIP = {
      ip,
      blockedAt: new Date().toISOString(),
      expiresAt,
      reason,
      rule,
      eventCount: this.threatEvents.get(ip)?.length || 0
    };

    this.blockedIPs.set(ip, block);
    
    console.warn(`🚫 IP BLOCKED [${rule}]:`, {
      ip,
      reason,
      duration: duration ? `${duration} minutes` : 'permanent',
      eventCount: block.eventCount,
      timestamp: block.blockedAt
    });
  }

  /**
   * Unblock an IP
   */
  unblockIP(ip: string): boolean {
    const wasBlocked = this.blockedIPs.has(ip);
    this.blockedIPs.delete(ip);
    
    if (wasBlocked) {
      console.log(`✅ IP UNBLOCKED: ${ip}`);
    }
    
    return wasBlocked;
  }

  /**
   * Get blocked IPs list
   */
  getBlockedIPs(): BlockedIP[] {
    return Array.from(this.blockedIPs.values());
  }

  /**
   * Get threat events for an IP
   */
  getThreatEvents(ip: string): ThreatEvent[] {
    return this.threatEvents.get(ip) || [];
  }

  /**
   * Get threat statistics
   */
  getThreatStats(): {
    totalBlockedIPs: number;
    temporaryBlocks: number;
    permanentBlocks: number;
    activeBlocks: number;
    totalThreatEvents: number;
    threatRules: ThreatRule[];
  } {
    const blocks = Array.from(this.blockedIPs.values());
    const activeBlocks = blocks.filter(block => 
      !block.expiresAt || new Date() < new Date(block.expiresAt)
    );
    
    return {
      totalBlockedIPs: blocks.length,
      temporaryBlocks: blocks.filter(b => b.expiresAt !== null).length,
      permanentBlocks: blocks.filter(b => b.expiresAt === null).length,
      activeBlocks: activeBlocks.length,
      totalThreatEvents: Array.from(this.threatEvents.values()).reduce((sum, events) => sum + events.length, 0),
      threatRules: this.threatRules
    };
  }

  /**
   * Evaluate threat rules against IP events
   */
  private evaluateThreatRules(ip: string, events: ThreatEvent[]): ThreatRule | null {
    for (const rule of this.threatRules) {
      if (rule.condition(ip, events)) {
        return rule;
      }
    }
    return null;
  }

  /**
   * Execute automated action
   */
  private executeAction(
    ip: string, 
    rule: ThreatRule, 
    eventCount: number
  ): { blocked: boolean; rule: string; reason: string } {
    const reason = `${rule.description} (${eventCount} events)`;
    
    switch (rule.action) {
      case 'WARN':
        console.warn(`⚠️  THREAT WARNING [${rule.name}]:`, {
          ip,
          reason,
          eventCount,
          timestamp: new Date().toISOString()
        });
        return { blocked: false, rule: rule.name, reason };

      case 'TEMP_BLOCK':
        this.blockIP(ip, reason, rule.blockDuration, rule.name);
        return { blocked: true, rule: rule.name, reason };

      case 'PERM_BLOCK':
        this.blockIP(ip, reason, undefined, rule.name);
        return { blocked: true, rule: rule.name, reason };

      default:
        return { blocked: false, rule: rule.name, reason };
    }
  }

  /**
   * Get recent events within specified minutes
   */
  private getRecentEvents(events: ThreatEvent[], minutes: number): ThreatEvent[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return events.filter(event => new Date(event.timestamp) > cutoff);
  }

  /**
   * Start cleanup interval to remove expired blocks
   */
  private startCleanupInterval(): void {
    // Clean up expired blocks every 5 minutes
    setInterval(() => {
      this.cleanupExpiredBlocks();
    }, 5 * 60 * 1000);
  }

  /**
   * Remove expired temporary blocks
   */
  private cleanupExpiredBlocks(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [ip, block] of this.blockedIPs.entries()) {
      if (block.expiresAt && now > new Date(block.expiresAt)) {
        this.blockedIPs.delete(ip);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired IP blocks`);
    }
  }

  /**
   * Add custom threat rule
   */
  addThreatRule(rule: ThreatRule): void {
    this.threatRules.push(rule);
    console.log(`➕ Added custom threat rule: ${rule.name}`);
  }

  /**
   * Remove threat rule
   */
  removeThreatRule(ruleName: string): boolean {
    const initialLength = this.threatRules.length;
    this.threatRules = this.threatRules.filter(rule => rule.name !== ruleName);
    
    if (this.threatRules.length < initialLength) {
      console.log(`➖ Removed threat rule: ${ruleName}`);
      return true;
    }
    
    return false;
  }

  /**
   * Reset all data (for testing)
   */
  reset(): void {
    this.blockedIPs.clear();
    this.threatEvents.clear();
    console.log('🔄 Threat response system reset');
  }
}
