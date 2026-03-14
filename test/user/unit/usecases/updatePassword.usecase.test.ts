import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdatePasswordUsecase } from '../../../../src/modules/user/application/usecase/UpdatePassword.usecase';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
import { PasswordPort } from '../../../../src/modules/user/domain/ports/password.port';
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

const mockPasswordPort: PasswordPort = {
  hash: vi.fn(),
  compare: vi.fn(),
};

function createActiveUser(): UserEntity {
  const user = UserEntity.create('testuser', 'test@gmail.com', '123456789askf');
  const code = user.toPersistence().verificationToken!.value as string;
  user.activate(code);
  // user.changeRole('ADMIN')

  return user;
}

describe('UpdatePasswordUseCase', () => {
  let usecase: UpdatePasswordUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new UpdatePasswordUsecase(mockRepository, mockPasswordPort);
  });

  describe('execute()', () => {
    it('should update the password when current password is correct', async () => {
      const user = createActiveUser();
      const originalPasswordHash = user.toPersistence().passwordHash;
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockPasswordPort.compare).mockResolvedValue(true);
      vi.mocked(mockPasswordPort.hash).mockResolvedValue('hashed_nuevaContrasena123');

      await usecase.execute(user.toPersistence().id, {
        currentPassword: '123456789askf',
        newPassword: 'nuevaContrasena123',
      });

      expect(mockRepository.findById).toHaveBeenCalledWith(user.toPersistence().id);
      expect(mockPasswordPort.compare).toHaveBeenCalledWith('123456789askf', originalPasswordHash);
      expect(mockPasswordPort.hash).toHaveBeenCalledWith('nuevaContrasena123');
      expect(mockRepository.save).toHaveBeenCalled();
    });
    it('should hash the new password before saving', async () => {
      const user = createActiveUser();
      const originalPasswordHash = user.toPersistence().passwordHash;
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockPasswordPort.compare).mockResolvedValue(true);
      vi.mocked(mockPasswordPort.hash).mockResolvedValue('hashed_nuevaContrasena123');

      await usecase.execute(user.toPersistence().id, {
        currentPassword: '123456789askf',
        newPassword: 'nuevaContrasena123',
      });

      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];

      expect(savedUser.toPersistence().passwordHash).toBe('hashed_nuevaContrasena123');
      expect(savedUser.toPersistence().passwordHash).not.toBe(originalPasswordHash);
    });
    it('should increment tokenVersion after password change', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockPasswordPort.compare).mockResolvedValue(true);
      vi.mocked(mockPasswordPort.hash).mockResolvedValue('hashed_nuevaContrasena123');

      const result = await usecase.execute(user.toPersistence().id, {
        currentPassword: '123456789askf',
        newPassword: 'nuevaContrasena123',
      });

      expect(result.toPersistence().tokenVersion).toBe(1);
    });
    it('should throw when the current password is incorrect', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockPasswordPort.compare).mockResolvedValue(false);
      vi.mocked(mockPasswordPort.hash).mockResolvedValue('hashed_nuevaContrasena123');

      await expect(
        usecase.execute(user.toPersistence().id, {
          currentPassword: 'wrongPassword',
          newPassword: 'nuevaContrasena123',
        }),
      ).rejects.toThrow(AppError);
    });
    it('should throw when the user is not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);
      vi.mocked(mockPasswordPort.compare).mockResolvedValue(true);
      vi.mocked(mockPasswordPort.hash).mockResolvedValue('hashed_nuevaContrasena123');

      await expect(
        usecase.execute('no-valid-id', {
          currentPassword: '123456789askf',
          newPassword: 'nuevaContrasena123',
        }),
      ).rejects.toThrow(AppError);
    });
  });
});
