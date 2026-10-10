import mongoose, { Document, Schema } from 'mongoose';

export interface IGallery extends Document {
  photographerId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  secretKeyHash: string;
  googleDriveFolderId: string;
  favoritesDownloadLink?: string;
  coverPhotoUrl?: string;
  isActive: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  favoritesSyncStatus: 'idle' | 'syncing' | 'completed' | 'completed_with_errors' | 'error';
  favoritesSyncTotal: number;
  favoritesSyncCopied: number;
  favoritesSyncSkipped: number;
  favoritesSyncFailed: number;
  favoritesSyncError?: string;
  favoritesSyncedAt?: Date;
  photoCount: number;
  favoriteCount: number;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const gallerySchema = new Schema<IGallery>(
  {
    photographerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    secretKeyHash: { type: String, required: true },
    googleDriveFolderId: { type: String, required: true },
    favoritesDownloadLink: { type: String },
    coverPhotoUrl: { type: String },
    isActive: { type: Boolean, default: true },
    syncStatus: { type: String, enum: ['idle', 'syncing', 'error'], default: 'idle' },
    favoritesSyncStatus: { type: String, enum: ['idle', 'syncing', 'completed', 'completed_with_errors', 'error'], default: 'idle' },
    favoritesSyncTotal: { type: Number, default: 0 },
    favoritesSyncCopied: { type: Number, default: 0 },
    favoritesSyncSkipped: { type: Number, default: 0 },
    favoritesSyncFailed: { type: Number, default: 0 },
    favoritesSyncError: { type: String },
    favoritesSyncedAt: { type: Date },
    photoCount: { type: Number, default: 0 },
    favoriteCount: { type: Number, default: 0 },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

export const Gallery = mongoose.model<IGallery>('Gallery', gallerySchema);
