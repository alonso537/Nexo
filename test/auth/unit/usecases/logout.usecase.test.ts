import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LogoutUsecase } from '../../../../src/modules/user/application/usecase/logout.usecase';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
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
  const user = UserEntity.create('username', 'email@gmail.com', '12245678945525');
  const token = (user.toPersistence().verificationToken as { value: string }).value;
  user.activate(token);
  return user;
}

describe('LogoutUsecase', () => {
  let usecase: LogoutUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new LogoutUsecase(mockRepository, mockCache);
  });

  describe('execute()', () => {
    it('should increment tokenVersion to invalidate all active sessions', async () => {
      const user = createActiveUser();
      const originalTokenVersion = user.toPersistence().tokenVersion as number;
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockRepository.save).mockResolvedValue();

      await usecase.execute(user.toPersistence().id as string);

      expect(mockRepository.findById).toHaveBeenCalledWith(user.toPersistence().id as string);
      expect(user.toPersistence().tokenVersion as number).toBe(originalTokenVersion + 1);
      expect(mockRepository.save).toHaveBeenCalledWith(user);
    });

    it('should blacklist the access token in cache when provided', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockRepository.save).mockResolvedValue();
      vi.mocked(mockCache.set).mockResolvedValue();

      const fakeToken = 'fake.access.token';
      const ttlSeconds = 900;

      await usecase.execute(user.toPersistence().id as string, fakeToken, ttlSeconds);

      expect(mockCache.set).toHaveBeenCalledWith(`blacklist:${fakeToken}`, 'true', ttlSeconds);
    });

    it('should not call cache.set when no accessToken is provided', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockRepository.save).mockResolvedValue();

      await usecase.execute(user.toPersistence().id as string);

      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should not call cache.set when accessToken is provided but no ttl', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockRepository.save).mockResolvedValue();

      await usecase.execute(user.toPersistence().id as string, 'some.token');

      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should throw when user is not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(() => usecase.execute('nonexistent-user-id')).rejects.toThrow();
      expect(mockRepository.findById).toHaveBeenCalledWith('nonexistent-user-id');
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });
});
