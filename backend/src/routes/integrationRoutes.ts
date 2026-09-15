import { Router } from 'express';
import { getAuthUrl, oauthCallback, listDriveFolders, syncGallery, getGallerySyncStatus, syncFavoritesToDrive } from '../controllers/integrationController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Public callback route
router.get('/google/callback', oauthCallback);

// Protected routes
router.use(requireAuth);
router.get('/google/auth-url', getAuthUrl);
router.get('/google/folders', listDriveFolders);
router.post('/google/sync-gallery', syncGallery);
router.post('/google/sync-favorites', syncFavoritesToDrive);
router.get('/google/sync-status/:galleryId', getGallerySyncStatus);

export default router;
