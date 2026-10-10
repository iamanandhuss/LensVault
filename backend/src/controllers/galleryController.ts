import { Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/authMiddleware';
import { Gallery } from '../models/Gallery';
import { Client } from '../models/Client';
import { User } from '../models/User';

export const getGalleries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const galleries = await Gallery.find({ photographerId: req.user._id })
      .select('-secretKeyHash')
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(galleries);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching galleries' });
  }
};

export const createGallery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, clientId, googleDriveFolderId } = req.body || {};

    if (typeof name !== 'string' || !name.trim() || name.length > 120 || typeof clientId !== 'string' || typeof googleDriveFolderId !== 'string' || !googleDriveFolderId.trim()) {
      res.status(400).json({ error: 'Name, client, and drive folder are required.' });
      return;
    }

    // Verify client belongs to this photographer
    const client = await Client.findOne({ _id: clientId, photographerId: req.user._id });
    if (!client) {
      res.status(404).json({ error: 'Client not found.' });
      return;
    }

    const user = await User.findById(req.user._id).select('subscription.plan');
    const activeGalleryCount = await Gallery.countDocuments({ photographerId: req.user._id, isActive: true });
    if ((user?.subscription?.plan || 'FREE') === 'FREE' && activeGalleryCount >= 10) {
      res.status(403).json({ error: 'The free plan includes up to 10 active galleries.' });
      return;
    }

    // Generate a unique slug for the public URL
    const slugBase = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'gallery';
    const slug = `${slugBase}-${crypto.randomBytes(3).toString('hex')}`;

    // Generate a secure, readable secret key (e.g., A7F9-K2P4)
    const rawSecretKey = crypto.randomBytes(8).toString('hex').toUpperCase();
    const formattedSecretKey = rawSecretKey.match(/.{1,4}/g)!.join('-');

    // Hash the secret key for secure storage
    const salt = await bcrypt.genSalt(10);
    const secretKeyHash = await bcrypt.hash(formattedSecretKey, salt);

    const newGallery = new Gallery({
      photographerId: req.user._id,
      clientId,
      name: name.trim(),
      slug,
      secretKeyHash,
      googleDriveFolderId,
    });

    await newGallery.save();

    res.status(201).json({
      gallery: { _id: newGallery._id, name: newGallery.name, slug: newGallery.slug, clientId: newGallery.clientId },
      rawSecretKey: formattedSecretKey, // Only sent once!
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating gallery' });
  }
};

export const deleteGallery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Ensure gallery belongs to user
    const gallery = await Gallery.findOne({ _id: id, photographerId: req.user._id });
    if (!gallery) {
      res.status(404).json({ error: 'Gallery not found' });
      return;
    }
    
    // Delete all associated photos
    const [{ Photo }, { Favorite }] = await Promise.all([
      import('../models/Photo'),
      import('../models/Favorite'),
    ]);
    await Promise.all([Photo.deleteMany({ galleryId: id }), Favorite.deleteMany({ galleryId: id })]);
    
    // Delete the gallery itself
    await Gallery.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Gallery deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting gallery' });
  }
};

export const updateGallery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { favoritesDownloadLink } = req.body;
    
    const gallery = await Gallery.findOneAndUpdate(
      { _id: id, photographerId: req.user._id },
      { favoritesDownloadLink },
      { new: true }
    );
    
    if (!gallery) {
      res.status(404).json({ error: 'Gallery not found' });
      return;
    }
    
    res.status(200).json(gallery);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating gallery' });
  }
};
