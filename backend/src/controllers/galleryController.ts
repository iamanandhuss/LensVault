import { Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/authMiddleware';
import { Gallery } from '../models/Gallery';
import { Client } from '../models/Client';

export const getGalleries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const galleries = await Gallery.find({ photographerId: req.user._id })
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(galleries);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching galleries' });
  }
};

export const createGallery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, clientId, googleDriveFolderId } = req.body;

    if (!name || !clientId || !googleDriveFolderId) {
      res.status(400).json({ error: 'Name, client, and drive folder are required.' });
      return;
    }

    // Verify client belongs to this photographer
    const client = await Client.findOne({ _id: clientId, photographerId: req.user._id });
    if (!client) {
      res.status(404).json({ error: 'Client not found.' });
      return;
    }

    // Generate a unique slug for the public URL
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${crypto.randomBytes(3).toString('hex')}`;

    // Generate a secure, readable secret key (e.g., A7F9-K2P4)
    const rawSecretKey = crypto.randomBytes(4).toString('hex').toUpperCase();
    const formattedSecretKey = `${rawSecretKey.slice(0, 4)}-${rawSecretKey.slice(4)}`;

    // Hash the secret key for secure storage
    const salt = await bcrypt.genSalt(10);
    const secretKeyHash = await bcrypt.hash(formattedSecretKey, salt);

    const newGallery = new Gallery({
      photographerId: req.user._id,
      clientId,
      name,
      slug,
      secretKeyHash,
      googleDriveFolderId,
    });

    await newGallery.save();

    res.status(201).json({
      gallery: newGallery,
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
    const { Photo } = await import('../models/Photo');
    await Photo.deleteMany({ galleryId: id });
    
    // Delete the gallery itself
    await Gallery.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Gallery deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting gallery' });
  }
};
