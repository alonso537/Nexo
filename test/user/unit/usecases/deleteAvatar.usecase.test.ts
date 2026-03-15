import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteAvatarUsecase } from '../../../../src/modules/user/application/usecase/deleteAvatar.usecase';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
import { StoragePort } from '../../../../src/shared/domain/ports/storage.port';
import { AppError } from '../../../../src/shared/domain/errors/AppError';
import { CachePort } from '../../../../src/shared/domain/ports/cache.port';

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

const mockCache: CachePort = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
};

function createActiveUser(): UserEntity {
  const user = UserEntity.create('testuser', 'test@gmail.com', '123456789askf');
  const code = (user.toPersistence().verificationToken as { value: string }).value;
  user.activate(code);
  user.updatePhotoProfile('avatar/user.jpg');
  return user;
}

describe('DeleteAvatarUsecase', () => {
  let usecase: DeleteAvatarUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new DeleteAvatarUsecase(mockRepository, mockStoragePort, mockCache);
  });

  describe('execute()', () => {
    it('should remove the S3 object and clear photoProfile on the user', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);

      await usecase.execute(user.toPersistence().id as string);

      expect(mockRepository.findById).toHaveBeenCalledWith(user.toPersistence().id as string);
      expect(mockStoragePort.delete).toHaveBeenCalledWith('avatar/user.jpg');
      expect(mockRepository.save).toHaveBeenCalled();
      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];
      expect(savedUser.toPersistence().photoProfile).toBeNull();
    });

    it('should invalidate the cache after deleting', async () => {
      const user = createActiveUser();
      const username = user.toPersistence().username as string;
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockCache.del).mockResolvedValue();

      await usecase.execute(user.toPersistence().id as string);

      expect(mockCache.del).toHaveBeenCalledWith(`user:slug:${username}`);
    });

    it('should throw when the user has no avatar', async () => {
      const user = createActiveUser();
      user.removePhotoProfile();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);

      await expect(() => usecase.execute(user.toPersistence().id as string)).rejects.toThrow(AppError);
    });

    it('should throw when the user is not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(() => usecase.execute('nonexistent-id')).rejects.toThrow(AppError);
    });
  });
});
