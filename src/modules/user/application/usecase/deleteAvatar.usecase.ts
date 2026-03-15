import { AppError } from '../../../../shared/domain/errors/AppError';
import { CachePort } from '../../../../shared/domain/ports/cache.port';
import { StoragePort } from '../../../../shared/domain/ports/storage.port';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';

export class DeleteAvatarUsecase {
  constructor(
    private readonly userRep: UserrepositoryDomain,
    private readonly storagePort: StoragePort,
    private readonly cache: CachePort,
  ) {}

  async execute(userId: string): Promise<UserEntity> {
    const user = await this.userRep.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    const username = user.toPersistence().username as string;

    const key = user.toPrimitives().photoProfile as string | null;
    if (!key) {
      throw new AppError('No avatar to delete', 404, 'NO_AVATAR');
    }

    await this.storagePort.delete(key);
    user.removePhotoProfile();
    await this.userRep.save(user);

    try {
      await this.cache.del(`user:slug:${username}`);
    } catch {}

    return user;
  }
}
