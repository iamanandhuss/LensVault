import { Request, Response } from 'express';
import { google } from 'googleapis';
import { AuthRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { Gallery } from '../models/Gallery';
import { Photo } from '../models/Photo';
import { getAllImagesInFolder } from '../services/googleDriveService';
import fs from 'fs';
import path from 'path';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

export const getAuthUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state: req.user._id.toString(), // Pass user ID through state
    });
    res.status(200).json({ url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate auth url' });
  }
};

export const oauthCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      res.status(400).send('Invalid request');
      return;
    }

    const { tokens } = await oauth2Client.getToken(code as string);
    
    // Save tokens to user
    await User.findByIdAndUpdate(state as string, {
      googleDriveTokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      }
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard/galleries`);
  } catch (error) {
    console.error(error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=oauth_failed`);
  }
};

export const listDriveFolders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.googleDriveTokens) {
      res.status(400).json({ error: 'Google Drive not connected' });
      return;
    }

    oauth2Client.setCredentials(user.googleDriveTokens);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name, webViewLink)',
      orderBy: 'createdTime desc',
    });

    res.status(200).json(response.data.files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
};

// Polling endpoint for frontend
export const getGallerySyncStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { galleryId } = req.params;
    const gallery = await Gallery.findOne({ _id: galleryId, photographerId: req.user._id });
    if (!gallery) {
      res.status(404).json({ error: 'Gallery not found' });
      return;
    }
    res.status(200).json({
      syncStatus: gallery.syncStatus,
      photoCount: gallery.photoCount,
      lastSyncedAt: gallery.lastSyncedAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
};

export const syncGallery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { googleDriveFolderId, galleryId } = req.body;
    const user = await User.findById(req.user._id);
    const gallery = await Gallery.findOne({ _id: galleryId, photographerId: req.user._id });

    if (!gallery) {
      res.status(404).json({ error: 'Gallery not found' });
      return;
    }

    if (gallery.syncStatus === 'syncing') {
      res.status(400).json({ error: 'Synchronization already in progress.' });
      return;
    }

    // Mark gallery as syncing
    await Gallery.findByIdAndUpdate(galleryId, { syncStatus: 'syncing' });
    
    // Return immediately to the client
    res.status(200).json({ status: 'started', message: 'Synchronization started in background.' });

    // Kick off background job (floating promise)
    runGallerySyncBackground(user, galleryId, googleDriveFolderId).catch(async (err) => {
      console.error(`Background sync failed for gallery ${galleryId}:`, err);
      await Gallery.findByIdAndUpdate(galleryId, { syncStatus: 'error' });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to start sync' });
  }
};

const runGallerySyncBackground = async (user: any, galleryId: string, folderId: string) => {
  try {
    // 1. Gather all files from Drive
    let driveFiles: any[] = [];
    
    // Check for demo mode / missing tokens
    if (!user || !user.googleDriveTokens?.access_token || process.env.GOOGLE_CLIENT_ID === 'dummy_id') {
      console.log(`Using Local Files Mode for Gallery Sync ${galleryId}`);
      const imagesDir = path.join(__dirname, '../../../frontend/public/gallery_images');
      if (fs.existsSync(imagesDir)) {
        const files = fs.readdirSync(imagesDir);
        let idCounter = 1;
        for (const file of files) {
          if (file.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
            driveFiles.push({
              id: `local-${idCounter++}`,
              name: file,
              mimeType: 'image/jpeg',
              thumbnailLink: `/gallery_images/${file}`,
              webContentLink: `/gallery_images/${file}`,
              md5Checksum: 'local-hash'
            });
          }
        }
      }
      
      // Fallback to Unsplash
      if (driveFiles.length === 0) {
        driveFiles = [
          { id: 'demo-1', name: 'wedding_1.jpg', mimeType: 'image/jpeg', thumbnailLink: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800', webContentLink: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
          { id: 'demo-2', name: 'wedding_2.jpg', mimeType: 'image/jpeg', thumbnailLink: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800', webContentLink: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800' },
        ];
      }
    } else {
      // Real API Mode
      oauth2Client.setCredentials(user.googleDriveTokens);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      
      // Extract the actual ID if the user pasted a full URL
      let parsedFolderId = folderId;
      const match = folderId.match(/[-\w]{25,}/);
      if (match) {
        parsedFolderId = match[0];
      }

      // Call our new recursive service
      driveFiles = await getAllImagesInFolder(drive, parsedFolderId, true);
    }

    // 2. Fetch existing photos from DB to compare
    const existingPhotos = await Photo.find({ galleryId });
    const existingMap = new Map(existingPhotos.map(p => [p.googleDriveFileId, p]));

    // 3. Process drive files (Upsert)
    const bulkOps: any[] = [];
    const activeDriveIds = new Set<string>();

    let sortIndex = 0;
    for (const df of driveFiles) {
      activeDriveIds.add(df.id);
      
      const existing = existingMap.get(df.id);
      if (!existing || existing.checksum !== df.md5Checksum || existing.status !== 'active') {
        bulkOps.push({
          updateOne: {
            filter: { galleryId, googleDriveFileId: df.id },
            update: {
              $set: {
                fileName: df.name,
                thumbnailUrl: df.thumbnailLink || df.webContentLink,
                fullResUrl: df.webContentLink,
                mimeType: df.mimeType,
                status: 'active',
                checksum: df.md5Checksum,
                sortOrder: sortIndex
              }
            },
            upsert: true
          }
        });
      }
      sortIndex++;
    }

    // 4. Mark removed files as deleted
    for (const existing of existingPhotos) {
      if (!activeDriveIds.has(existing.googleDriveFileId) && existing.status !== 'deleted') {
        bulkOps.push({
          updateOne: {
            filter: { _id: existing._id },
            update: { $set: { status: 'deleted' } }
          }
        });
      }
    }

    // 5. Execute bulk operations if any
    if (bulkOps.length > 0) {
      await Photo.bulkWrite(bulkOps);
    }

    // 6. Update gallery stats
    const finalPhotoCount = await Photo.countDocuments({ galleryId, status: 'active' });
    const firstPhoto = await Photo.findOne({ galleryId, status: 'active' }).sort({ sortOrder: 1 });
    
    await Gallery.findByIdAndUpdate(galleryId, {
      syncStatus: 'idle',
      photoCount: finalPhotoCount,
      coverPhotoUrl: firstPhoto ? (firstPhoto.thumbnailUrl || firstPhoto.fullResUrl) : '',
      lastSyncedAt: new Date()
    });

    console.log(`Background sync completed for gallery ${galleryId}. Total active photos: ${finalPhotoCount}`);
  } catch (err) {
    console.error(`Background sync failed in process for gallery ${galleryId}:`, err);
    await Gallery.findByIdAndUpdate(galleryId, { syncStatus: 'error' });
  }
};
