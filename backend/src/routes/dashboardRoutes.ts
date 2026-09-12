import express from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { getDashboardStats } from '../controllers/dashboardController';

const router = express.Router();

router.get('/stats', requireAuth, getDashboardStats);

export default router;
