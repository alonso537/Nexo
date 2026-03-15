import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetAllUsersUsecase } from '../../../../src/modules/user/application/usecase/getAllUser.usecase';
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

describe('GetAllUsersUsecase', () => {
  let usecase: GetAllUsersUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new GetAllUsersUsecase(mockRepository, mockCache);
  });

  describe('execute()', () => {
    it('should return a paginated list of users', async () => {
      const users = [createActiveUser(), createActiveUser(), createActiveUser()];
      vi.mocked(mockRepository.findAll).mockResolvedValue({ users, total: users.length });
      vi.mocked(mockCache.get).mockRejectedValue(new Error('Redis unavailable'));

      const result = await usecase.execute({ page: 1, limit: 10, includeDeleted: false });

      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });

    it('should return cached result when available', async () => {
      const users = [createActiveUser()];
      const filters = { page: 1, limit: 10, includeDeleted: false };
      const cachedData = {
        data: users.map((u) => u.toPersistence()),
        total: 1,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      vi.mocked(mockCache.get).mockResolvedValue(JSON.stringify(cachedData));

      const result = await usecase.execute(filters);

      expect(mockRepository.findAll).not.toHaveBeenCalled();
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toBeInstanceOf(UserEntity);
    });

    it('should store result in cache after fetching from DB', async () => {
      const users = [createActiveUser()];
      vi.mocked(mockRepository.findAll).mockResolvedValue({ users, total: 1 });
      vi.mocked(mockCache.get).mockRejectedValue(new Error('Redis unavailable'));
      vi.mocked(mockCache.set).mockResolvedValue();

      await usecase.execute({ page: 1, limit: 10, includeDeleted: false });

      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should apply username filter when provided', async () => {
      vi.mocked(mockRepository.findAll).mockResolvedValue({ users: [], total: 0 });
      vi.mocked(mockCache.get).mockRejectedValue(new Error('Redis unavailable'));

      await usecase.execute({ page: 1, limit: 10, includeDeleted: false, username: 'john' });

      expect(mockRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({ username: 'john' }));
    });

    it('should apply email filter when provided', async () => {
      vi.mocked(mockRepository.findAll).mockResolvedValue({ users: [], total: 0 });
      vi.mocked(mockCache.get).mockRejectedValue(new Error('Redis unavailable'));

      await usecase.execute({ page: 1, limit: 10, includeDeleted: false, email: 'john@test.com' });

      expect(mockRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({ email: 'john@test.com' }));
    });

    it('should apply role filter when provided', async () => {
      vi.mocked(mockRepository.findAll).mockResolvedValue({ users: [], total: 0 });
      vi.mocked(mockCache.get).mockRejectedValue(new Error('Redis unavailable'));

      await usecase.execute({ page: 1, limit: 10, includeDeleted: false, role: 'ADMIN' });

      expect(mockRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({ role: 'ADMIN' }));
    });

    it('should apply status filter when provided', async () => {
      vi.mocked(mockRepository.findAll).mockResolvedValue({ users: [], total: 0 });
      vi.mocked(mockCache.get).mockRejectedValue(new Error('Redis unavailable'));

      await usecase.execute({ page: 1, limit: 10, includeDeleted: false, status: 'ACTIVE' });

      expect(mockRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'ACTIVE' }));
    });

    it('should exclude deleted users by default', async () => {
      vi.mocked(mockRepository.findAll).mockResolvedValue({ users: [], total: 0 });
      vi.mocked(mockCache.get).mockRejectedValue(new Error('Redis unavailable'));

      await usecase.execute({ page: 1, limit: 10, includeDeleted: false });

      expect(mockRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({ includeDeleted: false }));
    });

    it('should include deleted users when includeDeleted is true', async () => {
      vi.mocked(mockRepository.findAll).mockResolvedValue({ users: [], total: 0 });
      vi.mocked(mockCache.get).mockRejectedValue(new Error('Redis unavailable'));

      await usecase.execute({ page: 1, limit: 10, includeDeleted: true });

      expect(mockRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({ includeDeleted: true }));
    });
  });
});
