import mongoose, { Document, Schema } from 'mongoose';

export interface IFavorite extends Document {
  galleryId: mongoose.Types.ObjectId;
  photoId: mongoose.Types.ObjectId;
  // We identify the client session so a client doesn't need a registered account to favorite
  clientSessionId: string; 
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    galleryId: { type: Schema.Types.ObjectId, ref: 'Gallery', required: true },
    photoId: { type: Schema.Types.ObjectId, ref: 'Photo', required: true },
    clientSessionId: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent the same photo from being favorited twice by the same session
favoriteSchema.index({ galleryId: 1, photoId: 1, clientSessionId: 1 }, { unique: true });

export const Favorite = mongoose.model<IFavorite>('Favorite', favoriteSchema);
