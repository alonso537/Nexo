import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForgotPasswordUsecase } from '../../../../src/modules/user/application/usecase/forgotPassword.usecase';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
import { MailerPort } from '../../../../src/modules/user/domain/ports/mailer.port';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
import { AppError } from '../../../../src/shared/domain/errors/AppError';

const mockEmailPort: MailerPort = {
  sendPasswordResetEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
};
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

function createActiveUser(): UserEntity {
  const user = UserEntity.create('username', 'email@gmail.com', '12245678945525');
  user.activate((user.toPersistence().verificationToken as { value: string }).value);
  return user;
}

describe('ForgotPasswordUseCase', () => {
  let usecase: ForgotPasswordUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new ForgotPasswordUsecase(mockRepository, mockEmailPort);
  });
  describe('execute()', () => {
    it('should generate a password reset token and send the email', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(user);
      vi.mocked(mockRepository.save).mockResolvedValue();
      vi.mocked(mockEmailPort.sendPasswordResetEmail).mockResolvedValue();

      await usecase.execute({ email: 'email@gmail.com' });

      expect(mockRepository.findByEmail).toHaveBeenCalledWith('email@gmail.com');
      expect(mockRepository.save).toHaveBeenCalled();
      expect(user.toPersistence().passwordResetToken).not.toBeNull();
    });
    it('should return silently when user is not found by email (no email leak)', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);

      await expect(usecase.execute({ email: 'email@gmail.com' })).resolves.toBeUndefined();
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEmailPort.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
    it('should throw when user is blocked', async () => {
      const user = createActiveUser();
      user.block('Reason for blocking');
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(user);

      await expect(() => usecase.execute({ email: 'email@gmail.com' })).rejects.toThrow(AppError);
    });
  });
});
