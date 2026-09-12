import { Router } from 'express';
import { getSubscriptionStatus, upgradeSubscription } from '../controllers/subscriptionController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/status', getSubscriptionStatus);
router.post('/upgrade', upgradeSubscription);

export default router;
