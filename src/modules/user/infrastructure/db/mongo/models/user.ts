import { model, Schema } from 'mongoose';

export interface IUser {
  _id: string;
  name: string | null;
  lastName: string | null;
  username: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'SUPPORT';
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLOCKED';
  photoProfile: string | null;
  verifiedAt: Date | null;
  lastLogin: Date | null;
  verificationToken: {
    token: string;
    expiresAt: Date;
  } | null;
  passwordResetToken: {
    token: string;
    expiresAt: Date;
  } | null;
  blockedAt: Date | null;
  blockedReason: string | null;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const tokenSchema = new Schema(
  {
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    _id: { type: String },
    name: { type: String, default: null },
    lastName: { type: String, default: null },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'USER', 'SUPPORT'],
      default: 'USER',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED'],
      default: 'PENDING',
    },
    photoProfile: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
    lastLogin: { type: Date, default: null },
    verificationToken: { type: tokenSchema, default: null },
    passwordResetToken: { type: tokenSchema, default: null },
    blockedAt: { type: Date, default: null },
    blockedReason: { type: String, default: null },
    tokenVersion: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

export const UserModel = model<IUser>('User', userSchema);
