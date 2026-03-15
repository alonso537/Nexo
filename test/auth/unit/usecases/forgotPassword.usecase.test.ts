import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForgotPasswordUsecase } from '../../../../src/modules/user/application/usecase/forgotPassword.usecase';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
import { QueuePort } from '../../../../src/shared/domain/ports/queue.port';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
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

const mockQueue: QueuePort = {
  addEmailJob: vi.fn(),
};

function createActiveUser(): UserEntity {
  const user = UserEntity.create('username', 'email@gmail.com', '12245678945525');
  user.activate((user.toPersistence().verificationToken as { value: string }).value);
  return user;
}

describe('ForgotPasswordUseCase', () => {
  let usecase: ForgotPasswordUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new ForgotPasswordUsecase(mockRepository, mockQueue);
  });

  describe('execute()', () => {
    it('should generate a password reset token and enqueue the email', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(user);
      vi.mocked(mockRepository.save).mockResolvedValue();
      vi.mocked(mockQueue.addEmailJob).mockResolvedValue();

      await usecase.execute({ email: 'email@gmail.com' });

      expect(mockRepository.findByEmail).toHaveBeenCalledWith('email@gmail.com');
      expect(mockRepository.save).toHaveBeenCalled();
      expect(user.toPersistence().passwordResetToken).not.toBeNull();
      expect(mockQueue.addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'password-reset',
          to: 'email@gmail.com',
        }),
      );
    });

    it('should return silently when user is not found (no email leak)', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);

      await expect(usecase.execute({ email: 'email@gmail.com' })).resolves.toBeUndefined();
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockQueue.addEmailJob).not.toHaveBeenCalled();
    });

    it('should throw when user is blocked', async () => {
      const user = createActiveUser();
      user.block('Reason for blocking');
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(user);

      await expect(() => usecase.execute({ email: 'email@gmail.com' })).rejects.toThrow(AppError);
    });
  });
});
