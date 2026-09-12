import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Client } from '../models/Client';
import { Gallery } from '../models/Gallery';
import { Photo } from '../models/Photo';
import { Favorite } from '../models/Favorite';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const photographerId = req.user._id;

    // 1. Total Clients
    const totalClients = await Client.countDocuments({ photographerId });

    // 2. Active Galleries
    const galleries = await Gallery.find({ photographerId }).populate('clientId', 'name').sort({ createdAt: -1 });
    const activeGalleriesCount = galleries.filter(g => g.isActive).length;
    const galleryIds = galleries.map(g => g._id);

    // 3. Total Photos
    const totalPhotos = await Photo.countDocuments({ galleryId: { $in: galleryIds } });

    // 4. Total Favorites
    const totalFavorites = await Favorite.countDocuments({ galleryId: { $in: galleryIds } });

    // 5. Recent Galleries (top 5) with their photo and favorite counts
    const topGalleries = galleries.slice(0, 5);
    const recentGalleries = await Promise.all(
      topGalleries.map(async (gallery: any) => {
        const photoCount = await Photo.countDocuments({ galleryId: gallery._id });
        const favoriteCount = await Favorite.countDocuments({ galleryId: gallery._id });
        
        return {
          _id: gallery._id,
          name: gallery.name,
          clientName: gallery.clientId?.name || 'Unknown',
          photoCount,
          favoriteCount,
          isActive: gallery.isActive,
        };
      })
    );

    res.status(200).json({
      totalClients,
      activeGalleries: activeGalleriesCount,
      totalPhotos,
      totalFavorites,
      recentGalleries
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
