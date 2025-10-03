import { Router } from 'express';
import v1Routes from './v1';
import legacyAirdropRoutes from './airdropRoutes';

const router = Router();

// Version 1 API routes
router.use('/v1', v1Routes);

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
