import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResendVerificationUsecase } from '../../../../src/modules/user/application/usecase/resendToken.usecase';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
import { MailerPort } from '../../../../src/modules/user/domain/ports/mailer.port';
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

const mockEmailPort: MailerPort = {
  sendPasswordResetEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
};

function createActiveUser(): UserEntity {
  const user = UserEntity.create('username', 'email@gmail.com', '12245678945525');
  // user.activate(user.toPersistence().verificationToken!.value);
  return user;
}

describe('ResendTokenUseCase', () => {
  let usecase: ResendVerificationUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new ResendVerificationUsecase(mockRepository, mockEmailPort);
  });
  describe('execute()', () => {
    it('should regenerate the verification token and send a new email', async () => {
      const user = createActiveUser();

      const oldToken = user.toPersistence().verificationToken
        ? (user.toPersistence().verificationToken as { value: string }).value
        : null;
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(user);
      vi.mocked(mockRepository.save).mockResolvedValue();
      vi.mocked(mockEmailPort.sendVerificationEmail).mockResolvedValue();

      await usecase.execute({ email: 'email@gmail.com' });

      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];
      expect((savedUser.toPersistence().verificationToken as { value: string }).value).not.toBe(oldToken);
      expect(mockEmailPort.sendVerificationEmail).toHaveBeenCalledWith(
        savedUser.toPersistence().email,
        (savedUser.toPersistence().verificationToken as { value: string }).value,
      );
    });
    it('should return silently when user is not found (no email leak)', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockEmailPort.sendVerificationEmail).mockResolvedValue();

      await expect(usecase.execute({ email: 'email@gmail.com' })).resolves.toBeUndefined();
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEmailPort.sendVerificationEmail).not.toHaveBeenCalled();
    });
    it('should throw when user is not PENDING', async () => {
      const user = createActiveUser();
      user.activate((user.toPersistence().verificationToken as { value: string }).value);
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(user);

      await expect(() => usecase.execute({ email: 'email@gmail.com' })).rejects.toThrow(AppError);
    });
  });
});
