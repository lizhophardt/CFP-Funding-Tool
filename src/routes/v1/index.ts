import { Router } from 'express';
import airdropRoutes from './airdropRoutes';

const router = Router();

// Mount v1 routes
router.use('/airdrop', airdropRoutes);

export default router;
