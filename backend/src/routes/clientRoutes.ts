import { Router } from 'express';
import { getClients, createClient } from '../controllers/clientController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/', getClients);
router.post('/', createClient);

export default router;
