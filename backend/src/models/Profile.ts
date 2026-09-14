import mongoose, { Document, Schema } from 'mongoose';

export interface IProfile extends Document {
  userId: mongoose.Types.ObjectId;
  displayName?: string;
  businessName?: string;
  profileImage?: string;
  logo?: string;
  bio?: string;
  phone?: string;
  website?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
  branding?: {
    primaryColor?: string;
    accentColor?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<IProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    displayName: { type: String },
    businessName: { type: String },
    profileImage: { type: String },
    logo: { type: String },
    bio: { type: String, maxlength: 500 },
    phone: { type: String },
    website: { type: String },
    location: {
      city: { type: String },
      state: { type: String },
      country: { type: String },
    },
    socialLinks: {
      instagram: { type: String },
      facebook: { type: String },
      youtube: { type: String },
    },
    branding: {
      primaryColor: { type: String, default: '#D4AF37' }, // Default gold
      accentColor: { type: String, default: '#ffffff' },
    },
  },
  { timestamps: true }
);

export const Profile = mongoose.model<IProfile>('Profile', profileSchema);
