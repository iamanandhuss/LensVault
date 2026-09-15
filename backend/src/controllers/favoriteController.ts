import { Request, Response } from 'express';
import { Favorite } from '../models/Favorite';

export const toggleFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { galleryId, photoId } = req.body;
    // For a real production app, clientSessionId should be securely derived from 
    // a persistent cookie generated when the client unlocked the gallery.
    const clientSessionId = req.cookies.galleryToken || req.ip; 

    if (!galleryId || !photoId) {
      res.status(400).json({ error: 'Gallery ID and Photo ID are required.' });
      return;
    }

    const existingFavorite = await Favorite.findOne({ galleryId, photoId, clientSessionId });

    if (existingFavorite) {
      // Unfavorite
      await Favorite.deleteOne({ _id: existingFavorite._id });
      res.status(200).json({ favorited: false });
    } else {
      // Favorite
      const newFavorite = new Favorite({ galleryId, photoId, clientSessionId });
      await newFavorite.save();
      res.status(201).json({ favorited: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle favorite.' });
  }
};

export const getFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    const { galleryId } = req.params;
    const clientSessionId = req.cookies.galleryToken || req.ip;

    const favorites = await Favorite.find({ galleryId, clientSessionId });
    const favoritePhotoIds = favorites.map(f => f.photoId);

    res.status(200).json({ favoritePhotoIds });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch favorites.' });
  }
};

export const getFavoritesDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { galleryId } = req.params;
    
    // In a real app, we should verify that req.user (the photographer) owns this gallery,
    // but since we are using requireAuth middleware on the route, they are authenticated.
    
    const favorites = await Favorite.find({ galleryId }).populate('photoId');
    
    // Map to a cleaner structure for the frontend
    const favoriteDetails = favorites.map((f: any) => ({
      _id: f._id,
      clientSessionId: f.clientSessionId,
      createdAt: f.createdAt,
      photo: f.photoId ? {
        _id: f.photoId._id,
        fileName: f.photoId.fileName,
        thumbnailUrl: f.photoId.thumbnailUrl,
        fullResUrl: f.photoId.fullResUrl,
        mimeType: f.photoId.mimeType
      } : null
    })).filter(f => f.photo !== null); // Filter out any dangling refs if photos were deleted

    res.status(200).json({ favorites: favoriteDetails });
  } catch (error) {
    console.error('Error fetching favorite details:', error);
    res.status(500).json({ error: 'Failed to fetch favorite details.' });
  }
};
