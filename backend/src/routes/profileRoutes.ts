import { Router } from 'express';
import { getProfile, updateProfile, uploadProfileImage } from '../controllers/profileController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth); // All profile routes require authentication

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/upload', uploadProfileImage);

export default router;
