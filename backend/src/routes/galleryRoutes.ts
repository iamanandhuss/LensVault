import { Router } from 'express';
import { getGalleries, createGallery, deleteGallery, updateGallery } from '../controllers/galleryController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/', getGalleries);
router.post('/', createGallery);
router.delete('/:id', deleteGallery);
router.put('/:id', updateGallery);

export default router;
