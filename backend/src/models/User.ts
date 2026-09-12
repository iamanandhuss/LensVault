import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  googleDriveTokens?: {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  };
  subscriptionPlan: 'Free' | 'Starter' | 'Pro' | 'Studio';
  role: 'photographer' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['photographer', 'admin'], default: 'photographer' },
    googleDriveTokens: {
      access_token: String,
      refresh_token: String,
      expiry_date: Number,
    },
    subscriptionPlan: {
      type: String,
      enum: ['Free', 'Starter', 'Pro', 'Studio'],
      default: 'Free',
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
