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
