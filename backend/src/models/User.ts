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
  subscription: {
    plan: 'FREE' | 'STARTER' | 'PRO' | 'STUDIO';
    status: 'active' | 'canceled' | 'past_due' | 'unpaid';
    cancelAtPeriodEnd: boolean;
  };
  role: 'photographer' | 'super_admin';
  status: 'active' | 'suspended' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['photographer', 'super_admin'], default: 'photographer' },
    status: { type: String, enum: ['active', 'suspended', 'deleted'], default: 'active' },
    googleDriveTokens: {
      access_token: String,
      refresh_token: String,
      expiry_date: Number,
    },
    subscription: {
      plan: { type: String, enum: ['FREE', 'STARTER', 'PRO', 'STUDIO'], default: 'FREE' },
      status: { type: String, enum: ['active', 'canceled', 'past_due', 'unpaid'], default: 'active' },
      cancelAtPeriodEnd: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
