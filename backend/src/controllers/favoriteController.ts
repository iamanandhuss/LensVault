import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Favorite } from '../models/Favorite';
import { Gallery } from '../models/Gallery';
import { Photo } from '../models/Photo';
import { getJwtSecret } from '../utils/auth';

const authorizeGallery = async (req: Request, galleryId: string) => {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { issuer: 'photographer-saas', audience: 'gallery' }) as jwt.JwtPayload;
    if (decoded.role !== 'guest' || decoded.galleryId !== galleryId) return null;
    const gallery = await Gallery.findOne({ _id: galleryId, isActive: true });
    if (!gallery) return null;
    return { gallery, sessionId: crypto.createHash('sha256').update(token).digest('hex') };
  } catch {
    return null;
  }
};

export const toggleFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { galleryId, photoId } = req.body || {};

    if (typeof galleryId !== 'string' || typeof photoId !== 'string') {
      res.status(400).json({ error: 'Gallery ID and Photo ID are required.' });
      return;
    }
    const authorized = await authorizeGallery(req, galleryId);
    if (!authorized) {
      res.status(401).json({ error: 'A valid gallery session is required.' });
      return;
    }
    const photo = await Photo.exists({ _id: photoId, galleryId, status: 'active' });
    if (!photo) {
      res.status(404).json({ error: 'Photo not found in this gallery.' });
      return;
    }

    const existingFavorite = await Favorite.findOne({ galleryId, photoId, clientSessionId: authorized.sessionId });

    if (existingFavorite) {
      // Unfavorite
      await Favorite.deleteOne({ _id: existingFavorite._id });
      res.status(200).json({ favorited: false });
    } else {
      // Favorite
      const newFavorite = new Favorite({ galleryId, photoId, clientSessionId: authorized.sessionId });
      await newFavorite.save();
      res.status(201).json({ favorited: true });
    }
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      res.status(200).json({ favorited: true });
      return;
    }
    res.status(500).json({ error: 'Failed to toggle favorite.' });
  }
};

export const getFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    const { galleryId } = req.params;
    if (typeof galleryId !== 'string') {
      res.status(400).json({ error: 'Invalid gallery ID.' });
      return;
    }
    const authorized = await authorizeGallery(req, galleryId);
    if (!authorized) {
      res.status(401).json({ error: 'A valid gallery session is required.' });
      return;
    }

    const favorites = await Favorite.find({ galleryId, clientSessionId: authorized.sessionId });
    const favoritePhotoIds = favorites.map(f => f.photoId);

    res.status(200).json({ favoritePhotoIds });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch favorites.' });
  }
};
