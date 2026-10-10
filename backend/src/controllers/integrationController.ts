import { Request, Response } from 'express';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { Gallery } from '../models/Gallery';
import { Photo } from '../models/Photo';
import { Favorite } from '../models/Favorite';
import { getAllImagesInFolder, copyFilesToFolder } from '../services/googleDriveService';
import { getJwtSecret } from '../utils/auth';

const createOAuthClient = () => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error('Google Drive OAuth is not configured.');
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
};

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const parseDriveFolderId = (value: string): string | null => {
  try {
    const url = new URL(value);
    if (url.hostname !== 'drive.google.com') return null;
    const folderPath = url.pathname.match(/\/folders\/([\w-]+)/);
    const id = folderPath?.[1] || url.searchParams.get('id');
    return id && /^[\w-]+$/.test(id) ? id : null;
  } catch {
    return /^[\w-]{10,}$/.test(value) ? value : null;
  }
};

export const getAuthUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const oauth2Client = createOAuthClient();
    const state = jwt.sign({ sub: req.user._id.toString(), nonce: crypto.randomBytes(24).toString('hex') }, getJwtSecret(), {
      expiresIn: '10m', issuer: 'photographer-saas', audience: 'google-oauth',
    });
    res.cookie('google_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/integrations/google/callback',
      maxAge: 10 * 60 * 1000,
    });
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state,
    });
    res.status(200).json({ url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate auth url' });
  }
};

export const oauthCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error: oauthError } = req.query;
    const savedState = req.cookies?.google_oauth_state;
    res.clearCookie('google_oauth_state', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/integrations/google/callback' });
    if (oauthError || !code || typeof code !== 'string' || typeof state !== 'string' || !savedState || state !== savedState) {
      res.status(400).send('Invalid request');
      return;
    }

    const stateClaims = jwt.verify(state, getJwtSecret(), { issuer: 'photographer-saas', audience: 'google-oauth' }) as jwt.JwtPayload;
    if (typeof stateClaims.sub !== 'string' || typeof stateClaims.nonce !== 'string') {
      res.status(400).send('Invalid OAuth state');
      return;
    }
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code as string);
    const user = await User.findById(stateClaims.sub);
    if (!user || !tokens.access_token) {
      res.status(400).send('Unable to connect this Google account');
      return;
    }
    user.googleDriveTokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || user.googleDriveTokens?.refresh_token || '',
      expiry_date: tokens.expiry_date || 0,
    };
    await user.save();

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/galleries`);
  } catch (error) {
    console.error('Google OAuth callback failed.');
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?error=oauth_failed`);
  }
};

export const listDriveFolders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.googleDriveTokens) {
      res.status(400).json({ error: 'Google Drive not connected' });
      return;
    }

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(user.googleDriveTokens);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name, webViewLink)',
      orderBy: 'createdTime desc',
    });

    res.status(200).json(response.data.files);
  } catch (error) {
    console.error('Google Drive folder listing failed.');
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
    const { galleryId } = req.body || {};
    const user = await User.findById(req.user._id);
    const gallery = await Gallery.findOne({ _id: galleryId, photographerId: req.user._id });

    if (!gallery) {
      res.status(404).json({ error: 'Gallery not found' });
      return;
    }
    if (!user?.googleDriveTokens?.access_token) {
      res.status(400).json({ error: 'Google Drive not connected.' });
      return;
    }

    if (gallery.syncStatus === 'syncing') {
      res.status(400).json({ error: 'Synchronization already in progress.' });
      return;
    }

    const claimedGallery = await Gallery.findOneAndUpdate(
      { _id: galleryId, photographerId: req.user._id, syncStatus: { $ne: 'syncing' } },
      { $set: { syncStatus: 'syncing' } },
      { new: true },
    );
    if (!claimedGallery) {
      res.status(409).json({ error: 'Synchronization already in progress.' });
      return;
    }
    
    // Return immediately to the client
    res.status(200).json({ status: 'started', message: 'Synchronization started in background.' });

    // Kick off background job (floating promise)
    runGallerySyncBackground(user, galleryId, claimedGallery.googleDriveFolderId).catch(async (err) => {
      console.error(`Background sync failed for gallery ${galleryId}:`, err instanceof Error ? err.message : 'Unknown error');
      await Gallery.findByIdAndUpdate(galleryId, { syncStatus: 'error' });
    });

  } catch (error) {
    console.error('Google Drive sync request failed.');
    res.status(500).json({ error: 'Failed to start sync' });
  }
};

const runGallerySyncBackground = async (user: any, galleryId: string, folderId: string) => {
  try {
    if (!user?.googleDriveTokens?.access_token || !folderId) throw new Error('Google Drive credentials or folder are missing.');
    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(user.googleDriveTokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const match = folderId.match(/[-\w]{25,}/);
    const parsedFolderId = match?.[0] || folderId;
    const driveFiles = await getAllImagesInFolder(drive, parsedFolderId, true);

    const owner = await User.findById(user._id).select('subscription.plan');
    if ((owner?.subscription?.plan || 'FREE') === 'FREE' && driveFiles.length > 500) {
      throw new Error('The free plan supports up to 500 photos per gallery.');
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
                thumbnailUrl: df.thumbnailLink || df.webContentLink || `https://drive.google.com/thumbnail?id=${encodeURIComponent(df.id)}&sz=w1200`,
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

export const syncFavoritesToDrive = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { galleryId } = req.body || {};
    if (typeof galleryId !== 'string') {
      res.status(400).json({ error: 'Gallery ID is required.' });
      return;
    }
    const user = await User.findById(req.user._id);
    const gallery = await Gallery.findOne({ _id: galleryId, photographerId: req.user._id });

    if (!gallery) {
      res.status(404).json({ error: 'Gallery not found' });
      return;
    }

    if (!gallery.favoritesDownloadLink) {
      res.status(400).json({ error: 'No favorites download link set for this gallery' });
      return;
    }

    if (!user || !user.googleDriveTokens?.access_token) {
      res.status(400).json({ error: 'Google Drive not connected' });
      return;
    }

    const parsedFolderId = parseDriveFolderId(gallery.favoritesDownloadLink.trim());
    if (!parsedFolderId) {
      res.status(400).json({ error: 'Enter a valid Google Drive folder link or folder ID.' });
      return;
    }

    // 1. Get all favorite Photo IDs for this gallery
    const favorites = await Favorite.find({ galleryId });
    if (favorites.length === 0) {
      res.status(400).json({ error: 'No favorites found for this gallery' });
      return;
    }

    // Get unique photoIds
    const uniquePhotoIds = Array.from(new Set(favorites.map(f => f.photoId.toString())));

    // 2. Fetch the Photos to get their Google Drive File IDs
    const photos = await Photo.find({
      _id: { $in: uniquePhotoIds },
      galleryId,
      status: 'active'
    });

    const fileIdsToCopy = Array.from(new Set(photos.map(p => p.googleDriveFileId).filter(Boolean)));

    if (fileIdsToCopy.length === 0) {
      res.status(400).json({ error: 'No active Google Drive files found for the favorites' });
      return;
    }

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(user.googleDriveTokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const destination = await drive.files.get({
      fileId: parsedFolderId,
      fields: 'id,name,mimeType,capabilities(canAddChildren)',
      supportsAllDrives: true,
    });
    if (destination.data.mimeType !== 'application/vnd.google-apps.folder') {
      res.status(400).json({ error: 'The download link must point to a Google Drive folder.' });
      return;
    }
    if (!destination.data.capabilities?.canAddChildren) {
      res.status(403).json({ error: 'Your connected Google account needs Editor access to the destination folder.' });
      return;
    }

    const claimedGallery = await Gallery.findOneAndUpdate(
      { _id: galleryId, photographerId: req.user._id, favoritesSyncStatus: { $ne: 'syncing' } },
      { $set: {
        favoritesSyncStatus: 'syncing', favoritesSyncTotal: fileIdsToCopy.length,
        favoritesSyncCopied: 0, favoritesSyncSkipped: 0, favoritesSyncFailed: 0, favoritesSyncError: '',
      } },
      { new: true },
    );
    if (!claimedGallery) {
      res.status(409).json({ error: 'A favorites transfer is already in progress.' });
      return;
    }

    res.status(202).json({ status: 'syncing', total: fileIdsToCopy.length });
    void copyFilesToFolder(drive, fileIdsToCopy, parsedFolderId).then(async result => {
      await Gallery.findByIdAndUpdate(galleryId, { $set: {
        favoritesSyncStatus: result.failed ? 'completed_with_errors' : 'completed',
        favoritesSyncCopied: result.success,
        favoritesSyncSkipped: result.skipped,
        favoritesSyncFailed: result.failed,
        favoritesSyncError: result.failed ? 'Check that each source photo can be copied and that the destination folder is writable.' : '',
        favoritesSyncedAt: new Date(),
      } });
    }).catch(async error => {
      console.error(`Favorites transfer failed for gallery ${galleryId}:`, error instanceof Error ? error.message : 'Unknown error');
      await Gallery.findByIdAndUpdate(galleryId, { $set: {
        favoritesSyncStatus: 'error', favoritesSyncFailed: fileIdsToCopy.length,
        favoritesSyncError: 'Google Drive could not complete the transfer. Check Drive access and try again.',
      } });
    });

  } catch (error) {
    const driveError = error as { code?: number; response?: { status?: number } };
    const status = driveError.code || driveError.response?.status;
    if (status === 404) {
      res.status(404).json({ error: 'Destination folder was not found or is not shared with your connected Google account.' });
      return;
    }
    if (status === 403) {
      res.status(403).json({ error: 'Google Drive denied access. Give your connected account Editor access to the destination folder.' });
      return;
    }
    console.error('Failed to start favorites transfer.');
    res.status(500).json({ error: 'Could not start the Google Drive transfer. Check the Drive connection and folder link.' });
  }
};

export const getFavoritesSyncStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { galleryId } = req.params;
    if (typeof galleryId !== 'string') {
      res.status(400).json({ error: 'Invalid gallery ID.' });
      return;
    }
    const gallery = await Gallery.findOne({ _id: galleryId, photographerId: req.user._id }).select(
      'favoritesSyncStatus favoritesSyncTotal favoritesSyncCopied favoritesSyncSkipped favoritesSyncFailed favoritesSyncError favoritesSyncedAt',
    );
    if (!gallery) {
      res.status(404).json({ error: 'Gallery not found.' });
      return;
    }
    res.status(200).json(gallery);
  } catch {
    res.status(500).json({ error: 'Could not read the transfer status.' });
  }
};
