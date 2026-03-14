import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { StoragePort, UploadedFile } from '../../../../shared/domain/ports/storage.port';
import { AppError } from '../../../../shared/domain/errors/AppError';
import { UserEntity } from '../../domain/entities/user.entity';

export class UpdatePhotoProfileUsecase {
  constructor(
    private readonly userRep: UserrepositoryDomain,
    private readonly storagePort: StoragePort,
  ) {}

  async execute(userId: string, file: UploadedFile): Promise<UserEntity> {
    const user = await this.userRep.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const oldAvatarKey = user.toPrimitives().photoProfile as string | null;
    if (oldAvatarKey) {
      await this.storagePort.delete(oldAvatarKey);
    }

    const uploadedKey = await this.storagePort.upload(file, 'avatars');

    user.updatePhotoProfile(uploadedKey);
    await this.userRep.save(user);
    return user;
  }
}
