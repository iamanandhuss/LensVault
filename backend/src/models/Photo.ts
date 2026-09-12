import mongoose, { Document, Schema } from 'mongoose';

export interface IPhoto extends Document {
  galleryId: mongoose.Types.ObjectId;
  googleDriveFileId: string;
  fileName: string;
  thumbnailUrl: string;
  fullResUrl?: string;
  mimeType: string;
  status: 'active' | 'deleted' | 'processing';
  checksum?: string;
  sortOrder?: number;
  createdAt: Date;
}

const photoSchema = new Schema<IPhoto>(
  {
    galleryId: { type: Schema.Types.ObjectId, ref: 'Gallery', required: true },
    googleDriveFileId: { type: String, required: true },
    fileName: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    fullResUrl: { type: String },
    mimeType: { type: String, required: true },
    status: { type: String, enum: ['active', 'deleted', 'processing'], default: 'active' },
    checksum: { type: String },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

photoSchema.index({ galleryId: 1, googleDriveFileId: 1 }, { unique: true });
photoSchema.index({ galleryId: 1, status: 1 });

export const Photo = mongoose.model<IPhoto>('Photo', photoSchema);
