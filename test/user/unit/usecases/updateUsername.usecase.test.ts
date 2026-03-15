import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateUsernameUsecase } from '../../../../src/modules/user/application/usecase/updateUsername.usecase';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
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

describe('UpdateUsernameUseCase', () => {
  let usecase: UpdateUsernameUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new UpdateUsernameUsecase(mockRepository, mockCache);
  });

  describe('execute()', () => {
    it('should update the username', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);

      await usecase.execute(user.toPersistence().id as string, { username: 'newusername' });

      expect(mockRepository.findById).toHaveBeenCalledWith(user.toPersistence().id as string);
      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];
      expect(savedUser.toPersistence().username).toBe('newusername');
    });

    it('should invalidate both old and new username cache keys', async () => {
      const user = createActiveUser();
      const oldUsername = user.toPersistence().username as string;
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockCache.del).mockResolvedValue();

      await usecase.execute(user.toPersistence().id as string, { username: 'newusername' });

      expect(mockCache.del).toHaveBeenCalledWith(`user:slug:${oldUsername}`);
      expect(mockCache.del).toHaveBeenCalledWith('user:slug:newusername');
    });

    it('should throw when the username is already taken', async () => {
      const user = createActiveUser();
      const otherUser = UserEntity.create('otherusername', 'other@gmail.com', 'password123');
      const otherCode = (otherUser.toPersistence().verificationToken as { value: string }).value;
      otherUser.activate(otherCode);

      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(otherUser);

      await expect(() =>
        usecase.execute(user.toPersistence().id as string, { username: 'otherusername' }),
      ).rejects.toThrow(AppError);
    });

    it('should throw when the user is not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(() =>
        usecase.execute('nonexistent-id', { username: 'newusername' }),
      ).rejects.toThrow(AppError);
    });

    it('should throw when username is invalid', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);

      await expect(() => usecase.execute(user.toPersistence().id as string, { username: '' })).rejects.toThrow(AppError);
      await expect(() => usecase.execute(user.toPersistence().id as string, { username: 'invalid username' })).rejects.toThrow(AppError);
      await expect(() => usecase.execute(user.toPersistence().id as string, { username: 'user@name' })).rejects.toThrow(AppError);
    });
  });
});
