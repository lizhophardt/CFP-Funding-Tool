export interface AirdropRequest {
  hash: string;
  recipientAddress: string;
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
  secretPreimage: string;
  secretPreimages: string[];
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
