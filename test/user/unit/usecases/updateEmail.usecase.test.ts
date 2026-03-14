import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateEmailUsecase } from '../../../../src/modules/user/application/usecase/updateEmail.usecase';
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
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
};

function createActiveUser(): UserEntity {
  const user = UserEntity.create('testuser', 'test@gmail.com', '123456789askf');
  const code = user.toPersistence().verificationToken!.value as string;
  user.activate(code);
  // user.changeRole('ADMIN')

  return user;
}

describe('UpdateEmailUseCase', () => {
  let usecase: UpdateEmailUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new UpdateEmailUsecase(mockRepository, mockEmailPort);
  });
  describe('execute()', () => {
    it('should update the email, set status to PENDING and send verification email', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);

      const newEmail = 'newemail@gmail.com';

      await usecase.execute(user.toPersistence().id, { newEmail });

      expect(mockRepository.findById).toHaveBeenCalledWith(user.toPersistence().id);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(newEmail);
      expect(mockRepository.save).toHaveBeenCalled();
      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];
      expect(savedUser.toPersistence().email).toBe(newEmail);
      expect(savedUser.toPersistence().status).toBe('PENDING');
      expect(mockEmailPort.sendVerificationEmail).toHaveBeenCalled();
    });
    it('should increment tokenVersion after email update', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);

      const newEmail = 'newemail@gmail.com';

      const result = await usecase.execute(user.toPersistence().id, { newEmail });

      expect(result.toPersistence().tokenVersion).toBe(1);
    });
    it('should throw when the new email is already in use by another user', async () => {
      const user = createActiveUser();
      const otherUser = UserEntity.create('otheruser', 'taken@gmail.com', 'password123');
      otherUser.activate(otherUser.toPersistence().verificationToken!.value);
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(otherUser); // different user owns this email

      await expect(
        usecase.execute(user.toPersistence().id, { newEmail: 'taken@gmail.com' }),
      ).rejects.toThrow(AppError);
    });
    it('should throw when the new email is the same as the current one', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);

      await expect(
        usecase.execute(user.toPersistence().id, { newEmail: 'test@gmail.com' }),
      ).rejects.toThrow(AppError);
    });
    it('should throw when the user is not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      const newEmail = 'newemail@gmail.com';

      await expect(usecase.execute('nonexistent-id', { newEmail })).rejects.toThrow(AppError);
    });
  });
});
