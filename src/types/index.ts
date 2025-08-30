export interface AirdropRequest {
  hash: string;
  recipientAddress: string;
}

export interface AirdropResponse {
  success: boolean;
  message: string;
  transactionHash?: string;
  xDaiTransactionHash?: string;
  amount?: string;
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
