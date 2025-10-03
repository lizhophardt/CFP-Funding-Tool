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

export default router;
