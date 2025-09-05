import { Router } from 'express';
import { AirdropController } from '../controllers/airdropController';
import { validateAirdropRequest } from '../middleware/validation';
import { 
  claimRateLimit, 
  statusRateLimit, 
  healthRateLimit, 
  testCodeRateLimit 
} from '../middleware/rateLimiting';

const router = Router();
const airdropController = new AirdropController();

// POST /api/airdrop/claim - Claim an airdrop (STRICT rate limiting)
router.post('/claim', claimRateLimit, validateAirdropRequest, (req, res) => airdropController.claimAirdrop(req, res));

// GET /api/airdrop/status - Get service status (MODERATE rate limiting)
router.get('/status', statusRateLimit, (req, res) => airdropController.getStatus(req, res));

// POST /api/airdrop/generate-test-code - Generate a test secret code for development (DEV rate limiting)
// SECURITY: Disabled in production to prevent secret code enumeration
if (process.env.NODE_ENV === 'development') {
  router.post('/generate-test-code', testCodeRateLimit, (req, res) => airdropController.generateTestCode(req, res));
}

// GET /api/airdrop/health - Health check (LENIENT rate limiting)
router.get('/health', healthRateLimit, (req, res) => airdropController.healthCheck(req, res));

export default router;
