import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  photographerId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    photographerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

// A photographer cannot have two clients with the same email
clientSchema.index({ photographerId: 1, email: 1 }, { unique: true });

export const Client = mongoose.model<IClient>('Client', clientSchema);
