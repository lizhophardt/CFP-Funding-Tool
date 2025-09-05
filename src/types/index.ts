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
