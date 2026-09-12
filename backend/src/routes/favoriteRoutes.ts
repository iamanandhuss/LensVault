import { Router } from 'express';
import { toggleFavorite, getFavorites } from '../controllers/favoriteController';

const router = Router();

// These are public routes used by the client when viewing a gallery
router.post('/toggle', toggleFavorite);
router.get('/:galleryId', getFavorites);

export default router;
