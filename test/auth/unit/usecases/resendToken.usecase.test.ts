import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResendVerificationUsecase } from '../../../../src/modules/user/application/usecase/resendToken.usecase';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
import { QueuePort } from '../../../../src/shared/domain/ports/queue.port';
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

function createPendingUser(): UserEntity {
  return UserEntity.create('username', 'email@gmail.com', '12245678945525');
}

describe('ResendTokenUseCase', () => {
  let usecase: ResendVerificationUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new ResendVerificationUsecase(mockRepository, mockQueue);
  });

  describe('execute()', () => {
    it('should regenerate the verification token and enqueue a new email', async () => {
      const user = createPendingUser();
      const oldToken = (user.toPersistence().verificationToken as { value: string }).value;
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(user);
      vi.mocked(mockRepository.save).mockResolvedValue();
      vi.mocked(mockQueue.addEmailJob).mockResolvedValue();

      await usecase.execute({ email: 'email@gmail.com' });

      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];
      const newToken = (savedUser.toPersistence().verificationToken as { value: string }).value;
      expect(newToken).not.toBe(oldToken);
      expect(mockQueue.addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'verification',
          to: 'email@gmail.com',
          token: newToken,
        }),
      );
    });

    it('should return silently when user is not found (no email leak)', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);

      await expect(usecase.execute({ email: 'email@gmail.com' })).resolves.toBeUndefined();
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockQueue.addEmailJob).not.toHaveBeenCalled();
    });

    it('should throw when user is not PENDING', async () => {
      const user = createPendingUser();
      user.activate((user.toPersistence().verificationToken as { value: string }).value);
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(user);

      await expect(() => usecase.execute({ email: 'email@gmail.com' })).rejects.toThrow(AppError);
    });
  });
});
