import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResetPasswordUsecase } from '../../../../src/modules/user/application/usecase/resetPassword.usecase';
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
}


function createActiveUser(): UserEntity {
  const user = UserEntity.create('username', 'email@gmail.com', '12245678945525');
  user.activate(user.toPersistence().verificationToken!.value);
  return user;
}


describe('ResetPasswordUseCase', () => {
  let usecase: ResetPasswordUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new ResetPasswordUsecase(mockRepository, mockPasswordPort);
  })
  describe('execute()', () => {
    it('should update the password when the reset code is valid', async () => {
      const user = createActiveUser();
      user.generatePasswordResetToken();
      const resetToken = user.toPersistence().passwordResetToken!.value;

      vi.mocked(mockRepository.findByPasswordResetToken).mockResolvedValue(user);
      vi.mocked(mockPasswordPort.hash).mockResolvedValue('hashed-new-password');
      vi.mocked(mockRepository.save).mockResolvedValue();

      await usecase.execute({ token: resetToken, newPassword: 'newpassword123' });

      expect(mockRepository.findByPasswordResetToken).toHaveBeenCalledWith(resetToken);
      expect(mockPasswordPort.hash).toHaveBeenCalledWith('newpassword123');
      expect(user.toPersistence().passwordHash).toBe('hashed-new-password');
      expect(user.toPersistence().passwordResetToken).toBeNull();
      expect(user.toPersistence().tokenVersion).toBe(1);
    });
    it('should hash the new password before saving', async () => {
      const user = createActiveUser();
      user.generatePasswordResetToken();
      const resetToken = user.toPersistence().passwordResetToken!.value;

      vi.mocked(mockRepository.findByPasswordResetToken).mockResolvedValue(user);
      vi.mocked(mockPasswordPort.hash).mockResolvedValue('hashed-new-password');
      vi.mocked(mockRepository.save).mockResolvedValue();

      await usecase.execute({ token: resetToken, newPassword: 'newpassword123' });

      expect(mockPasswordPort.hash).toHaveBeenCalledWith('newpassword123');
      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];
      expect(savedUser.toPersistence().passwordHash).toBe('hashed-new-password');
    });
    it('should increment tokenVersion after password reset', async () => {
      const user = createActiveUser();
      user.generatePasswordResetToken();
      const resetToken = user.toPersistence().passwordResetToken!.value;
      const initialTokenVersion = user.toPersistence().tokenVersion;

      vi.mocked(mockRepository.findByPasswordResetToken).mockResolvedValue(user);
      vi.mocked(mockPasswordPort.hash).mockResolvedValue('hashed-new-password');
      vi.mocked(mockRepository.save).mockResolvedValue();

      await usecase.execute({ token: resetToken, newPassword: 'newpassword123' });

      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];

      expect(savedUser.toPersistence().tokenVersion).toBe(initialTokenVersion + 1);
    });
    it('should throw when reset code is invalid', async () => {
      vi.mocked(mockRepository.findByPasswordResetToken).mockResolvedValue(null);

      await expect(usecase.execute({ token: 'invalid-token', newPassword: 'newpassword123' })).rejects.toThrow(AppError);
    });
    it('should throw when reset code is expired', async () => {
      vi.useFakeTimers();
      const user = createActiveUser();
      user.generatePasswordResetToken();
      const resetToken = user.toPersistence().passwordResetToken!.value;

      vi.mocked(mockRepository.findByPasswordResetToken).mockResolvedValue(user);

      // Simulate token expiration (token valid for 60 min, advance 61 min)
      vi.advanceTimersByTime(61 * 60 * 1000);

      await expect(usecase.execute({ token: resetToken, newPassword: 'newpassword123' })).rejects.toThrow(AppError);

      vi.useRealTimers();
    });
    it('should throw when user is not found', async () => {
      vi.mocked(mockRepository.findByPasswordResetToken).mockResolvedValue(null);

      await expect(usecase.execute({ token: 'non-existent-token', newPassword: 'newpassword123' })).rejects.toThrow(AppError);
    });
  });
});
