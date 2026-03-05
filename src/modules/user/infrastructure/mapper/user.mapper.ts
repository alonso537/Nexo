import { UserEntity } from '../../domain/entities/user.entity';
import { IUser } from '../db/mongo/models/user';

export const UserMapper = (doc: IUser): UserEntity => {
  return UserEntity.fromPrimitives({
    id: doc._id.toString(),
    name: doc.name,
    lastName: doc.lastName,
    username: doc.username,
    email: doc.email,
    passwordHash: doc.password,
    role: doc.role,
    status: doc.status,
    photoProfile: doc.photoProfile,
    verifiedAt: doc.verifiedAt,
    lastLoginAt: doc.lastLogin,
    verificationToken: doc.verificationToken
      ? { value: doc.verificationToken.token, expiresAt: doc.verificationToken.expiresAt }
      : null,
    passwordResetToken: doc.passwordResetToken
      ? { value: doc.passwordResetToken.token, expiresAt: doc.passwordResetToken.expiresAt }
      : null,
    blockedAt: doc.blockedAt,
    blockedReason: doc.blockedReason,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt,
  });
};
