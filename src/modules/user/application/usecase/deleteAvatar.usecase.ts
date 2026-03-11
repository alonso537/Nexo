import { AppError } from '../../../../shared/domain/errors/AppError';
import { StoragePort } from '../../../../shared/domain/ports/storage.port';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';

export class DeleteAvatarUsecase {
  constructor(
    private readonly userRep: UserrepositoryDomain,
    private readonly storagePort: StoragePort,
  ) {}

  async execute(userId: string): Promise<UserEntity> {
    const user = await this.userRep.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const key = user.toPrimitives().photoProfile;
    if (!key) {
      throw new AppError('No avatar to delete', 404, 'NO_AVATAR');
    }

    await this.storagePort.delete(key);
    user.removePhotoProfile();
    await this.userRep.save(user);

    return user;
  }
}
