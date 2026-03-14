import { FilterQuery } from 'mongoose';
import { AppError } from '../../../../../../shared/domain/errors/AppError';
import { logger } from '../../../../../../shared/infrastructure/logger/logger';
import { UserEntity } from '../../../../domain/entities/user.entity';
import {
  FiltersUsers,
  UserrepositoryDomain,
} from '../../../../domain/repositories/userRepository.domain';
import { UserMapper } from '../../../mapper/user.mapper';
import { IUser, UserModel } from '../models/user';

export class UserRepositoryImpl implements UserrepositoryDomain {
  async save(user: UserEntity): Promise<void> {
    const data = user.toPersistence();

    const persistenceData = {
      _id: data.id,
      name: data.name,
      lastName: data.lastName,
      username: data.username,
      email: data.email,
      password: data.passwordHash,
      role: data.role,
      status: data.status,
      photoProfile: data.photoProfile,
      verifiedAt: data.verifiedAt,
      lastLogin: data.lastLoginAt,
      verificationToken: data.verificationToken
        ? {
            token: (data.verificationToken as { value: string; expiresAt: Date }).value,
            expiresAt: (data.verificationToken as { value: string; expiresAt: Date }).expiresAt,
          }
        : null,
      passwordResetToken: data.passwordResetToken
        ? {
            token: (data.passwordResetToken as { value: string; expiresAt: Date }).value,
            expiresAt: (data.passwordResetToken as { value: string; expiresAt: Date }).expiresAt,
          }
        : null,
      blockedAt: data.blockedAt,
      blockedReason: data.blockedReason,
      tokenVersion: data.tokenVersion,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    };
    const { _id, createdAt, ...updateFields } = persistenceData;

    try {
      await UserModel.updateOne(
        { _id },
        {
          $set: updateFields,
          $setOnInsert: { _id, createdAt },
        },
        { upsert: true },
      );
    } catch (err: unknown) {
      this.handleError(err, `saving/updating User with id ${data.id}`);
    }

    logger.info(`User ${data.id} saved/updated.`);
  }

  async delete(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async findById(id: string): Promise<UserEntity | null> {
    const doc = await UserModel.findOne({ _id: id, deletedAt: null });
    return doc ? UserMapper(doc.toObject()) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const doc = await UserModel.findOne({ email, deletedAt: null });
    return doc ? UserMapper(doc.toObject()) : null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const doc = await UserModel.findOne({
      username: username.trim().toLowerCase(),
      deletedAt: null,
    });
    return doc ? UserMapper(doc.toObject()) : null;
  }

  async findByVerificationToken(token: string): Promise<UserEntity | null> {
    const doc = await UserModel.findOne({ 'verificationToken.token': token, deletedAt: null });
    return doc ? UserMapper(doc.toObject()) : null;
  }

  async findByPasswordResetToken(token: string): Promise<UserEntity | null> {
    const doc = await UserModel.findOne({ 'passwordResetToken.token': token, deletedAt: null });
    return doc ? UserMapper(doc.toObject()) : null;
  }

  async findAll(filters?: FiltersUsers): Promise<{ users: UserEntity[]; total: number }> {
    try {
      const query: FilterQuery<IUser> = {};

      if (!filters?.includeDeleted) {
        query.deletedAt = null;
      }

      if (filters?.username) {
        query.username = {
          $regex: filters.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          $options: 'i',
        };
      }
      if (filters?.email) {
        query.email = {
          $regex: filters.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          $options: 'i',
        };
      }
      if (filters?.name) {
        query.name = { $regex: filters.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      }
      if (filters?.lastName) {
        query.lastName = {
          $regex: filters.lastName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          $options: 'i',
        };
      }
      if (filters?.role) {
        query.role = filters.role;
      }
      if (filters?.status) {
        query.status = filters.status;
      }

      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 10;
      const skip = (page - 1) * limit;

      const [userDocs, total] = await Promise.all([
        UserModel.find(query).skip(skip).limit(limit).exec(),
        UserModel.countDocuments(query).exec(),
      ]);

      return {
        users: userDocs.map((doc) => UserMapper(doc.toObject())),
        total,
      };
    } catch (error) {
      this.handleError(error, `finding Users with filters ${JSON.stringify(filters)}`);
    }
  }

  private handleError(error: unknown, action: string): never {
    logger.error(`Error ${action}: ${error instanceof Error ? error.message : String(error)}`);
    throw new AppError(`Error ${action}`, 500, 'DATABASE_ERROR', {
      originalError: error instanceof Error ? error.message : String(error),
    });
  }
}
