import { Router } from 'express';
import { toggleFavorite, getFavorites, getFavoritesDetails } from '../controllers/favoriteController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// These are public routes used by the client when viewing a gallery
router.post('/toggle', toggleFavorite);
router.get('/:galleryId', getFavorites);
router.get('/gallery/:galleryId/details', requireAuth, getFavoritesDetails);

export default router;
