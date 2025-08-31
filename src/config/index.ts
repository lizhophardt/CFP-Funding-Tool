import dotenv from 'dotenv';
import { Config } from '../types';

dotenv.config();

export const config: Config = {
  gnosisRpcUrl: process.env.GNOSIS_RPC_URL || 'https://rpc.gnosischain.com',
  privateKey: process.env.PRIVATE_KEY || '',
  secretCodes: process.env.SECRET_CODES 
    ? process.env.SECRET_CODES.split(',').map(s => s.trim())
    : ['DontTellUncleSam', 'SecretCode123', 'HiddenTreasure'],
  wxHoprTokenAddress: process.env.WXHOPR_TOKEN_ADDRESS || '0xD4fdec44DB9D44B8f2b6d529620f9C0C7066A2c1',
  airdropAmountWei: process.env.AIRDROP_AMOUNT_WEI || '10000000000000000', // 0.01 wxHOPR by default (18 decimals)
  xDaiAirdropAmountWei: process.env.XDAI_AIRDROP_AMOUNT_WEI || '10000000000000000', // 0.01 xDai by default (18 decimals)
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development'
};

export function validateConfig(): void {
  const requiredFields: (keyof Config)[] = ['privateKey'];
  
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Missing required environment variable: ${field.toUpperCase()}`);
    }
  }

  // Validate that we have at least one secret code
  if (!config.secretCodes || config.secretCodes.length === 0 || 
      (config.secretCodes.length === 1 && !config.secretCodes[0])) {
    throw new Error('Missing required environment variable: SECRET_CODES');
  }

  // Validate private key format
  if (!config.privateKey.match(/^[a-fA-F0-9]{64}$/)) {
    throw new Error('Private key must be a 64-character hexadecimal string');
  }

  // Validate airdrop amounts are valid numbers
  if (isNaN(Number(config.airdropAmountWei)) || Number(config.airdropAmountWei) <= 0) {
    throw new Error('wxHOPR airdrop amount must be a positive number');
  }
  
  if (isNaN(Number(config.xDaiAirdropAmountWei)) || Number(config.xDaiAirdropAmountWei) <= 0) {
    throw new Error('xDai airdrop amount must be a positive number');
  }
}
