import { Router } from 'express';
import { AirdropController } from '../controllers/airdropController';
import { 
  validateAirdropRequest, 
  validateTestHashRequest, 
  validateTestCodeRequest,
  validateQueryParams 
} from '../middleware/validation';

const router = Router();
const airdropController = new AirdropController();

// POST /api/airdrop/claim - Claim an airdrop
router.post('/claim', validateAirdropRequest, (req, res) => airdropController.claimAirdrop(req, res));

// GET /api/airdrop/status - Get service status
router.get('/status', validateQueryParams, (req, res) => airdropController.getStatus(req, res));

// POST /api/airdrop/generate-test-code - Generate a test secret code for development
// SECURITY: Disabled in production to prevent secret code enumeration
if (process.env.NODE_ENV === 'development') {
  router.post('/generate-test-code', validateTestCodeRequest, (req, res) => airdropController.generateTestCode(req, res));
}

// GET /api/airdrop/health - Health check
router.get('/health', validateQueryParams, (req, res) => airdropController.healthCheck(req, res));

export default router;
