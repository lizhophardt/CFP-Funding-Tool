export interface AirdropRequest {
  hash: string;
  recipientAddress: string;
}

export interface AirdropResponse {
  success: boolean;
  message: string;
  transactionHash?: string;
  amount?: string;
}

export interface Config {
  chiadoRpcUrl: string;
  privateKey: string;
  secretPreimage: string;
  airdropAmountWei: string;
  port: number;
  nodeEnv: string;
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
}
