import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetUserBySlugUsecase } from '../../../../src/modules/user/application/usecase/getUserBySlug.usecase';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
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

describe('GetUserBySlugUseCase', () => {
  let usecase: GetUserBySlugUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new GetUserBySlugUsecase(mockRepository, mockCache);
  });

  describe('execute()', () => {
    it('should return a user when a matching username is found in DB', async () => {
      const user = createActiveUser();
      vi.mocked(mockCache.get).mockRejectedValue(new Error('Redis unavailable'));
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(user);

      const result = await usecase.execute({ username: 'testuser' });

      expect(mockRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(result).toEqual(user);
    });

    it('should return a user from cache when available', async () => {
      const user = createActiveUser();
      vi.mocked(mockCache.get).mockResolvedValue(JSON.stringify(user.toPersistence()));

      const result = await usecase.execute({ username: 'testuser' });

      expect(mockRepository.findByUsername).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(UserEntity);
    });

    it('should store result in cache after fetching from DB', async () => {
      const user = createActiveUser();
      vi.mocked(mockCache.get).mockRejectedValue(new Error('Redis unavailable'));
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(user);
      vi.mocked(mockCache.set).mockResolvedValue();

      await usecase.execute({ username: 'testuser' });

      expect(mockCache.set).toHaveBeenCalledWith(
        'user:slug:testuser',
        expect.any(String),
        expect.any(Number),
      );
    });

    it('should throw when no user matches the given username', async () => {
      vi.mocked(mockCache.get).mockRejectedValue(new Error('Redis unavailable'));
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(null);

      await expect(() => usecase.execute({ username: 'nonexistent' })).rejects.toThrow();
    });
  });
});
