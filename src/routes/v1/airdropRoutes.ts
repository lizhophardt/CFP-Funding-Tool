import { Router } from 'express';
import { AirdropController } from '../../controllers/airdropController';
import { 
  validateAirdropRequest, 
  validateTestHashRequest, 
  validateTestCodeRequest,
  validateQueryParams 
} from '../../middleware/validation';
import { getContainer } from '../../container/DIContainer';

const router = Router();

// Create controller factory function to ensure container is available at runtime
const createAirdropController = () => {
  const container = getContainer();
  return new AirdropController(container);
};

// POST /api/v1/airdrop/claim - Claim an airdrop
router.post('/claim', validateAirdropRequest, (req, res) => {
  const controller = createAirdropController();
  return controller.claimAirdrop(req, res);
});

// GET /api/v1/airdrop/status - Get service status
router.get('/status', validateQueryParams, (req, res) => {
  const controller = createAirdropController();
  return controller.getStatus(req, res);
});

// POST /api/v1/airdrop/generate-test-code - Generate a test secret code for development
// SECURITY: Disabled in production to prevent secret code enumeration
if (process.env.NODE_ENV === 'development') {
  router.post('/generate-test-code', validateTestCodeRequest, (req, res) => {
    const controller = createAirdropController();
    return controller.generateTestCode(req, res);
  });
}

// GET /api/v1/airdrop/health - Health check
router.get('/health', validateQueryParams, (req, res) => {
  const controller = createAirdropController();
  return controller.healthCheck(req, res);
});

// GET /api/v1/airdrop/debug - Debug endpoint for Web3 connection testing
router.get('/debug', async (req, res) => {
  try {
    const container = getContainer();
    
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      config: {
        wxHoprTokenAddress: process.env.WXHOPR_TOKEN_ADDRESS || 'NOT_SET',
        hasPrivateKey: !!process.env.PRIVATE_KEY || !!process.env.ENCRYPTED_PRIVATE_KEY,
        privateKeyLength: process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.length : 0,
        encryptedKeyExists: !!process.env.ENCRYPTED_PRIVATE_KEY,
        encryptionPasswordExists: !!process.env.ENCRYPTION_PASSWORD,
        nodeEnv: process.env.NODE_ENV,
        gnosisRpcUrl: process.env.GNOSIS_RPC_URL || 'NOT_SET',
        fallbackRpcUrls: process.env.GNOSIS_FALLBACK_RPC_URLS || 'NOT_SET'
      }
    };
    
    // Test RPC connectivity directly
    debugInfo.rpcTests = {};
    const rpcEndpoints = [
      'https://rpc.gnosischain.com',
      'https://gnosis-mainnet.public.blastapi.io',
      'https://rpc.gnosis.gateway.fm',
      'https://gnosis.drpc.org'
    ];
    
    for (const rpc of rpcEndpoints) {
      try {
        const response = await fetch(rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1
          }),
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (response.ok) {
          const data = await response.json() as any;
          debugInfo.rpcTests[rpc] = {
            status: 'success',
            blockNumber: data.result
          };
        } else {
          debugInfo.rpcTests[rpc] = {
            status: 'failed',
            error: `HTTP ${response.status}`
          };
        }
      } catch (error: any) {
        debugInfo.rpcTests[rpc] = {
          status: 'failed',
          error: error?.message || 'Unknown error'
        };
      }
    }

    try {
      const web3Service = container.resolve('web3Service') as any;
      debugInfo.web3Service = {
        created: true,
        accountAddress: web3Service.getAccountAddress(),
        isConnected: await web3Service.isConnected()
      };
      
      // Try to get balances if connected
      if (debugInfo.web3Service.isConnected) {
        try {
          debugInfo.web3Service.wxHOPRBalance = await web3Service.getBalance();
          debugInfo.web3Service.xDaiBalance = await web3Service.getXDaiBalance();
        } catch (balanceError: any) {
          debugInfo.web3Service.balanceError = balanceError?.message || 'Unknown balance error';
        }
      }
    } catch (web3Error: any) {
      debugInfo.web3Service = {
        created: false,
        error: web3Error?.message || 'Unknown Web3Service error',
        stack: web3Error?.stack
      };
    }
    
    res.json({ success: true, debug: debugInfo });
  } catch (error: any) {
    res.json({ 
      success: false, 
      error: error?.message || 'Unknown error',
      debug: {
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;
