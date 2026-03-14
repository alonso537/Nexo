import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VerifyEmailUsecase } from '../../../../src/modules/user/application/usecase/verifyEmail.usecase';
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

function createActiveUser(): UserEntity {
  const user = UserEntity.create('username', 'email@gmail.com', '12245678945525');
  // user.activate(user.toPersistence().verificationToken!.value);
  return user;
}

describe('VerifyEmailUseCase', () => {
  let usecase: VerifyEmailUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new VerifyEmailUsecase(mockRepository);
  });
  describe('execute()', () => {
    it('should activate the user when the code is valid and not expired', async () => {
      const user = createActiveUser();
      const token = (user.toPersistence().verificationToken as { value: string }).value;
      vi.mocked(mockRepository.findByVerificationToken).mockResolvedValue(user);
      vi.mocked(mockRepository.save).mockResolvedValue();

      await usecase.execute({ token });

      expect(mockRepository.findByVerificationToken).toHaveBeenCalledWith(token);
      expect(user.status).toBe('ACTIVE');
    });
    it('should throw when user is not found', async () => {
      vi.mocked(mockRepository.findByVerificationToken).mockResolvedValue(null);

      await expect(() => usecase.execute({ token: 'invalid-token' })).rejects.toThrow(AppError);
    });
    it('should throw when the verification code is invalid', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findByVerificationToken).mockResolvedValue(user);
      await expect(() => usecase.execute({ token: 'invalid-token' })).rejects.toThrow(AppError);
    });
    it('should throw when the verification code is expired', async () => {
      vi.useFakeTimers();
      const user = createActiveUser();
      const token = (user.toPersistence().verificationToken as { value: string }).value;
      vi.mocked(mockRepository.findByVerificationToken).mockResolvedValue(user);

      vi.advanceTimersByTime(61 * 60 * 1000); // Avanza el tiempo para simular expiración (61 minutos)

      await expect(() => usecase.execute({ token })).rejects.toThrow(AppError);
    });
    it('should resolve silently when user is already ACTIVE', async () => {
      const user = createActiveUser();
      const token = (user.toPersistence().verificationToken as { value: string }).value;
      user.activate(token);
      vi.mocked(mockRepository.findByVerificationToken).mockResolvedValue(user);
      await expect(usecase.execute({ token })).resolves.toBeUndefined();
    });
  });
});
