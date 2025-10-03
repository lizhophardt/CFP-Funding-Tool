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

// DEBUG: Test different path patterns
router.post('/v1/claim', (req, res) => {
  res.json({ message: "SHORT PATH WORKS!", path: req.path });
});

router.get('/v1/airdrop/claim', (req, res) => {
  res.json({ message: "GET METHOD WORKS!", path: req.path });
});

router.post('/v1/airdrop/claim', (req, res) => {
  res.json({
    success: true,
    message: "POST TO LONG PATH WORKS!",
    path: req.path,
    originalUrl: req.originalUrl
  });
});

// Version 1 API routes (commented out for debugging)
// router.use('/v1', v1Routes);

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
