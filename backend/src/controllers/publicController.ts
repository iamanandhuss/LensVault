import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Gallery } from '../models/Gallery';
import { Photo } from '../models/Photo';
import { Favorite } from '../models/Favorite';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_dev_only';

// 1. Verify Secret Key and unlock gallery
export const accessGallery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug, secretKey } = req.body;

    if (!slug || !secretKey) {
      res.status(400).json({ error: 'Gallery slug and secret key are required.' });
      return;
    }

    const gallery = await Gallery.findOne({ slug, isActive: true });
    if (!gallery) {
      res.status(404).json({ error: 'Gallery not found or inactive.' });
      return;
    }

    const isMatch = await bcrypt.compare(secretKey, gallery.secretKeyHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid secret key.' });
      return;
    }

    // Generate a guest token scoped to this specific gallery
    // We use this token so the client doesn't have to keep entering the password
    const guestToken = jwt.sign(
      { galleryId: gallery._id, role: 'guest' }, 
      JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: 'Access granted',
      galleryToken: guestToken,
      gallery: {
        id: gallery._id,
        name: gallery.name,
        coverPhotoUrl: gallery.coverPhotoUrl,
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// 2. Fetch photos for the unlocked gallery with pagination
export const getGalleryData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 60;
    const skip = (page - 1) * limit;

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing gallery token' });
      return;
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      res.status(401).json({ error: 'Invalid or expired gallery token' });
      return;
    }

    const gallery = await Gallery.findOne({ slug, _id: decoded.galleryId });
    if (!gallery) {
      res.status(404).json({ error: 'Gallery not found' });
      return;
    }

    // Fetch the photographer's profile for branding
    const { Profile } = await import('../models/Profile');
    const photographerProfile = await Profile.findOne({ userId: gallery.photographerId });

    // Only fetch active photos
    const filter: any = { galleryId: gallery._id, status: 'active' };
    
    const photos = await Photo.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Photo.countDocuments(filter);
    
    res.status(200).json({
      gallery: { id: gallery._id, name: gallery.name, photographerId: gallery.photographerId },
      photographerProfile,
      photos,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + photos.length < total
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
};
