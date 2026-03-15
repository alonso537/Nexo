import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateEmailUsecase } from '../../../../src/modules/user/application/usecase/updateEmail.usecase';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
import { MailerPort } from '../../../../src/modules/user/domain/ports/mailer.port';
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

const mockEmailPort: MailerPort = {
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
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
  return user;
}

describe('UpdateEmailUseCase', () => {
  let usecase: UpdateEmailUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new UpdateEmailUsecase(mockRepository, mockEmailPort, mockCache);
  });

  describe('execute()', () => {
    it('should update the email, set status to PENDING and send verification email', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);

      const newEmail = 'newemail@gmail.com';
      await usecase.execute(user.toPersistence().id as string, { newEmail });

      expect(mockRepository.findById).toHaveBeenCalledWith(user.toPersistence().id as string);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(newEmail);
      expect(mockRepository.save).toHaveBeenCalled();
      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];
      expect(savedUser.toPersistence().email).toBe(newEmail);
      expect(savedUser.toPersistence().status).toBe('PENDING');
      expect(mockEmailPort.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should invalidate the cache after updating', async () => {
      const user = createActiveUser();
      const username = user.toPersistence().username as string;
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockCache.del).mockResolvedValue();

      await usecase.execute(user.toPersistence().id as string, { newEmail: 'newemail@gmail.com' });

      expect(mockCache.del).toHaveBeenCalledWith(`user:slug:${username}`);
    });

    it('should increment tokenVersion after email update', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);

      const result = await usecase.execute(user.toPersistence().id as string, { newEmail: 'newemail@gmail.com' });

      expect(result.toPersistence().tokenVersion as number).toBe(1);
    });

    it('should throw when the new email is already in use by another user', async () => {
      const user = createActiveUser();
      const otherUser = UserEntity.create('otheruser', 'taken@gmail.com', 'password123');
      otherUser.activate((otherUser.toPersistence().verificationToken as { value: string }).value);
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(otherUser);

      await expect(
        usecase.execute(user.toPersistence().id as string, { newEmail: 'taken@gmail.com' }),
      ).rejects.toThrow(AppError);
    });

    it('should throw when the new email is the same as the current one', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);

      await expect(
        usecase.execute(user.toPersistence().id as string, { newEmail: 'test@gmail.com' }),
      ).rejects.toThrow(AppError);
    });

    it('should throw when the user is not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(usecase.execute('nonexistent-id', { newEmail: 'newemail@gmail.com' })).rejects.toThrow(AppError);
    });
  });
});
