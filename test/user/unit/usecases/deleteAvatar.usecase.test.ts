import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteAvatarUsecase } from '../../../../src/modules/user/application/usecase/deleteAvatar.usecase';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
import { StoragePort } from '../../../../src/shared/domain/ports/storage.port';
import { AppError } from '../../../../src/shared/domain/errors/AppError';

const mockRepository: UserrepositoryDomain = {
  save: vi.fn(),
  delete: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findByUsername: vi.fn(),
  findByVerificationToken: vi.fn(),
  findByPasswordResetToken: vi.fn(),
  findAll: vi.fn(),
};

const mockStoragePort: StoragePort = {
  upload: vi.fn(),
  delete: vi.fn(),
  getUrl: vi.fn(),
};

function createActiveUser(): UserEntity {
  const user = UserEntity.create('testuser', 'test@gmail.com', '123456789askf');
  const code = user.toPersistence().verificationToken!.value as string;
  user.activate(code);
  // user.changeRole('ADMIN')

  user.updatePhotoProfile('avatar/user.jpg');

  return user;
}

describe('DeleteAvatarUsecase', () => {
  let usecase: DeleteAvatarUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new DeleteAvatarUsecase(mockRepository, mockStoragePort);
  });
  describe('execute()', () => {
    it('should remove the S3 object and clear photoProfile on the user', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);

      const result = await usecase.execute(user.toPersistence().id);

      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      expect(mockRepository.findById).toHaveBeenCalledWith(user.toPersistence().id);
      expect(mockStoragePort.delete).toHaveBeenCalledWith('avatar/user.jpg');
      expect(mockRepository.save).toHaveBeenCalled();
      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];
      expect(savedUser.toPersistence().photoProfile).toBeNull();
    });
    it('should throw when the user has no avatar', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      user.removePhotoProfile();

      await expect(() => usecase.execute(user.toPersistence().id)).rejects.toThrow(AppError);
    });
    it('should throw when the user is not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(() => usecase.execute('nonexistent-id')).rejects.toThrow(AppError);
    });
  });
});
