import { Router } from 'express';
import { AirdropController } from '../controllers/airdropController';
import { 
  validateAirdropRequest, 
  validateTestHashRequest, 
  validateTestCodeRequest,
  validateQueryParams 
} from '../middleware/validation';
import { getContainer } from '../container/DIContainer';
import { DatabaseService } from '../services/databaseService';

const router = Router();

// Create controller factory function to ensure container is available at runtime
const createAirdropController = () => {
  const container = getContainer();
  return new AirdropController(container);
};

// EMERGENCY: Add secret codes to database
router.post('/add-codes', async (req, res) => {
  try {
    const container = getContainer();
    const databaseService = container.resolve<DatabaseService>('databaseService');
    
    const codes = ['DontTellUncleSam', 'SecretCode123', 'HiddenTreasure', 'TestCode2024', 'CFPFunding'];
    
    for (const code of codes) {
      await databaseService.query(
        `INSERT INTO secret_codes (code, description, max_uses, created_by) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (code) DO NOTHING`,
        [code, 'Emergency fix', 1, 'emergency']
      );
    }
    
    res.json({ success: true, message: 'Secret codes added!', codes });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/airdrop/claim - Claim an airdrop
router.post('/claim', validateAirdropRequest, (req, res) => {
  const controller = createAirdropController();
  return controller.claimAirdrop(req, res);
});

// GET /api/airdrop/status - Get service status
router.get('/status', validateQueryParams, (req, res) => {
  const controller = createAirdropController();
  return controller.getStatus(req, res);
});

// POST /api/airdrop/generate-test-code - Generate a test secret code for development
// SECURITY: Disabled in production to prevent secret code enumeration
if (process.env.NODE_ENV === 'development') {
  router.post('/generate-test-code', validateTestCodeRequest, (req, res) => {
    const controller = createAirdropController();
    return controller.generateTestCode(req, res);
  });
}

// GET /api/airdrop/health - Health check (no validation needed for health checks)
router.get('/health', (req, res) => {
  const controller = createAirdropController();
  return controller.healthCheck(req, res);
});

// GET /api/airdrop/debug - Debug endpoint for Web3 connection testing
router.get('/debug', async (req, res) => {
  try {
    const container = getContainer();
    const web3Service = container.resolve('web3Service') as any;
    
    const debugInfo: any = {
      accountAddress: web3Service.getAccountAddress(),
      isConnected: await web3Service.isConnected(),
      timestamp: new Date().toISOString()
    };
    
    // Try to get balances if connected
    if (debugInfo.isConnected) {
      try {
        debugInfo.wxHOPRBalance = await web3Service.getBalance();
        debugInfo.xDaiBalance = await web3Service.getXDaiBalance();
      } catch (balanceError: any) {
        debugInfo.balanceError = balanceError?.message || 'Unknown balance error';
      }
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