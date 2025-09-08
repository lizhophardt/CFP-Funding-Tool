export interface AirdropRequest {
  secretCode: string;
  recipientAddress: string;
}

export interface ValidationMeta {
  validated: boolean;
  securityRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: string;
}

// Extend Express Request interface to include validation metadata
declare global {
  namespace Express {
    interface Request {
      validationMeta?: ValidationMeta;
    }
  }
}

export interface AirdropResponse {
  success: boolean;
  message: string;
  wxHOPRTransactionHash?: string;
  xDaiTransactionHash?: string;
  wxHOPRAmount?: string;
  xDaiAmount?: string;
}

export interface Config {
  gnosisRpcUrl: string;
  privateKey: string;
  secretCodes: string[];
  wxHoprTokenAddress: string;
  airdropAmountWei: string;
  xDaiAirdropAmountWei: string;
  port: number;
  nodeEnv: string;
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

// Security types
export type SecurityRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ThreatEventType = 'VALIDATION_FAILURE' | 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_PATTERN' | 'IP_BLOCKED';

export interface SecurityEvent {
  type: string;
  eventType: string;
  timestamp: string;
  risk: SecurityRiskLevel;
  data: Record<string, unknown>;
  client?: Record<string, unknown>;
}

export interface ThreatEvent {
  ip: string;
  type: ThreatEventType;
  severity: SecurityRiskLevel;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// Web3 types
export interface DualTransactionResult {
  wxHoprTxHash: string;
  xDaiTxHash: string;
}

export interface AddressValidation {
  isValid: boolean;
  checksumAddress?: string;
  securityLevel?: string;
  reason?: string;
  error?: string;
}

// Service status types
export interface ServiceStatus {
  isConnected: boolean;
  accountAddress: string;
  balance: string;
  xDaiBalance: string;
  processedCount: number;
}

// Logging types
export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
export type LogContext = 'airdrop' | 'web3' | 'security' | 'validation' | 'config' | 'startup';

export interface LogMetadata {
  type?: string;
  timestamp?: string;
  [key: string]: unknown;
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

// Environment types
export type NodeEnvironment = 'development' | 'production' | 'test';
