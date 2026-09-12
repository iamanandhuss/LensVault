import { Router } from 'express';
import { accessGallery, getGalleryData } from '../controllers/publicController';

const router = Router();

router.post('/access', accessGallery);
router.get('/gallery/:slug', getGalleryData);

export default router;
