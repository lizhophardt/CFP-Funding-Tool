import dotenv from 'dotenv';
import { Config } from '../types';

dotenv.config();

export const config: Config = {
  gnosisRpcUrl: process.env.GNOSIS_RPC_URL || 'https://rpc.gnosischain.com',
  privateKey: process.env.PRIVATE_KEY || '',
  secretPreimage: process.env.SECRET_PREIMAGE || '',
  secretPreimages: process.env.SECRET_PREIMAGES 
    ? process.env.SECRET_PREIMAGES.split(',').map(s => s.trim())
    : [process.env.SECRET_PREIMAGE || ''],
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

  // Validate that we have at least one preimage
  if (!config.secretPreimages || config.secretPreimages.length === 0 || 
      (config.secretPreimages.length === 1 && !config.secretPreimages[0])) {
    throw new Error('Missing required environment variable: SECRET_PREIMAGE or SECRET_PREIMAGES');
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
