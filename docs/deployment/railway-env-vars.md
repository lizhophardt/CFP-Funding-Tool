# Railway Environment Variables

Copy these environment variables to Railway dashboard:

## Required Variables:
- **PRIVATE_KEY**: Your wallet private key (without 0x prefix)
- **SECRET_PREIMAGE**: Your secret preimage for hash validation  
- **WXHOPR_TOKEN_ADDRESS**: 0xD4fdec44DB9D44B8f2b6d529620f9C0C7066A2c1
- **GNOSIS_RPC_URL**: https://rpc.gnosischain.com
- **AIRDROP_AMOUNT_WEI**: 10000000000000000
- **PORT**: 3000
- **NODE_ENV**: production

## Optional Variables:
- **SECRET_PREIMAGES**: (comma-separated if using multiple preimages)

## Notes:
- Keep your PRIVATE_KEY secure - never share it
- The wallet needs wxHOPR tokens and xDai for gas fees
- Default airdrop amount is 0.01 wxHOPR token (10000000000000000 wei)
