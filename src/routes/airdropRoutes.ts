import { Router } from 'express';
import { AirdropController } from '../controllers/airdropController';
import { validateAirdropRequest, validateTestHashRequest } from '../middleware/validation';

const router = Router();
const airdropController = new AirdropController();

// POST /api/airdrop/claim - Claim an airdrop
router.post('/claim', validateAirdropRequest, (req, res) => airdropController.claimAirdrop(req, res));

// GET /api/airdrop/status - Get service status
router.get('/status', (req, res) => airdropController.getStatus(req, res));

// POST /api/airdrop/generate-test-hash - Generate a test hash for development
router.post('/generate-test-hash', validateTestHashRequest, (req, res) => airdropController.generateTestHash(req, res));

// GET /api/airdrop/health - Health check
router.get('/health', (req, res) => airdropController.healthCheck(req, res));

export default router;
