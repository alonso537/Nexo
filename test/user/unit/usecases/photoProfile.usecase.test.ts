import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdatePhotoProfileUsecase } from '../../../../src/modules/user/application/usecase/photoProfile.usecase';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
import { StoragePort, UploadedFile } from '../../../../src/shared/domain/ports/storage.port';
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

  return user;
}

describe('PhotoProfileUseCase', () => {
  let usecase: UpdatePhotoProfileUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new UpdatePhotoProfileUsecase(mockRepository, mockStoragePort);
  });

  describe('execute()', () => {
    it('should upload the image to S3 and update the user photoProfile key', async () => {
      const user = createActiveUser();
      const uploadedKey = `avatars/${user.toPersistence().id}.jpg`;
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockStoragePort.upload).mockResolvedValue(uploadedKey);

      const file: UploadedFile = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
        size: 1024,
        originalName: 'avatar.jpg',
      };

      await usecase.execute(user.toPersistence().id, file);

      expect(mockRepository.findById).toHaveBeenCalledWith(user.toPersistence().id);
      expect(mockStoragePort.upload).toHaveBeenCalledWith(file, 'avatars');
      expect(mockRepository.save).toHaveBeenCalled();
      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];
      expect(savedUser.toPersistence().photoProfile).toBe(uploadedKey);
    });

    it('should delete the old S3 object when replacing an existing avatar', async () => {
      const user = createActiveUser();
      const oldKey = 'avatars/old-avatar.jpg';
      const newKey = 'avatars/new-avatar.jpg';
      user.updatePhotoProfile(oldKey);
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockStoragePort.upload).mockResolvedValue(newKey);

      const file: UploadedFile = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
        size: 1024,
        originalName: 'avatar.jpg',
      };

      await usecase.execute(user.toPersistence().id, file);

      expect(mockStoragePort.delete).toHaveBeenCalledWith(oldKey);
    });

    it('should throw when the user is not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      const file: UploadedFile = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
        size: 1024,
        originalName: 'avatar.jpg',
      };

      await expect(usecase.execute('nonexistent-id', file)).rejects.toThrow(AppError);
    });

    it('should throw when the user is not ACTIVE', async () => {
      const user = UserEntity.create('testuser', 'test@gmail.com', '123456789askf'); // PENDING
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockStoragePort.upload).mockResolvedValue('avatars/photo.jpg');

      const file: UploadedFile = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
        size: 1024,
        originalName: 'avatar.jpg',
      };

      await expect(usecase.execute(user.toPersistence().id, file)).rejects.toThrow(AppError);
    });
  });
});
