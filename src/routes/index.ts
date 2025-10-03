import { Router } from 'express';
import v1Routes from './v1';
import legacyAirdropRoutes from './airdropRoutes';

const router = Router();

// DEBUG: Simple test route at root level
router.get('/test', (req, res) => {
  res.json({ message: 'Basic routing works!', path: req.path, originalUrl: req.originalUrl });
});

// DEBUG: Simple test route for v1 structure  
router.post('/v1/test', (req, res) => {
  res.json({ message: 'V1 direct routing works!', path: req.path, originalUrl: req.originalUrl });
});

// Import the actual controller and middleware
import { AirdropController } from '../controllers/airdropController';
import { validateAirdropRequest, validateQueryParams } from '../middleware/validation';
import { getContainer } from '../container/DIContainer';

// Controller factory
const createAirdropController = () => {
  const container = getContainer();
  return new AirdropController(container);
};

// V1 API routes - registered directly (nested router mounting was broken)
router.post('/v1/airdrop/claim', validateAirdropRequest, (req, res) => {
  const controller = createAirdropController();
  return controller.claimAirdrop(req, res);
});

router.get('/v1/airdrop/status', validateQueryParams, (req, res) => {
  const controller = createAirdropController();
  return controller.getStatus(req, res);
});

router.get('/v1/airdrop/health', validateQueryParams, (req, res) => {
  const controller = createAirdropController();
  return controller.healthCheck(req, res);
});

// Development-only route
if (process.env.NODE_ENV === 'development') {
  router.post('/v1/airdrop/generate-test-code', (req, res) => {
    const controller = createAirdropController();
    return controller.generateTestCode(req, res);
  });
}

// Legacy routes (maintain backward compatibility)
// These will continue to work but are deprecated
router.use('/airdrop', legacyAirdropRoutes);

// Default version routing - redirect to v1
router.use('/', (req, res, next) => {
  // Only redirect if this is an API request that doesn't already have a version
  if (req.path.startsWith('/') && !req.path.startsWith('/v1') && !req.path.startsWith('/airdrop')) {
    // Redirect to v1
    const newPath = `/v1${req.path}`;
    return res.redirect(301, newPath);
  }
  next();
});

export default router;
