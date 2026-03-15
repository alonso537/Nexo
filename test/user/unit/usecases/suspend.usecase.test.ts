import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SuspendUsecase } from '../../../../src/modules/user/application/usecase/suspend.usecase';
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

describe('SuspendUseCase', () => {
  let usecase: SuspendUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new SuspendUsecase(mockRepository, mockCache);
  });

  describe('execute()', () => {
    it('should set the user status to SUSPENDED', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);

      await usecase.execute({ id: user.toPersistence().id as string }, 'ADMIN');

      expect(mockRepository.findById).toHaveBeenCalledWith(user.toPersistence().id as string);
      expect(mockRepository.save).toHaveBeenCalled();
      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];
      expect(savedUser.toPersistence().status).toBe('SUSPENDED');
    });

    it('should invalidate the cache after suspending', async () => {
      const user = createActiveUser();
      const username = user.toPersistence().username as string;
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockCache.del).mockResolvedValue();

      await usecase.execute({ id: user.toPersistence().id as string }, 'ADMIN');

      expect(mockCache.del).toHaveBeenCalledWith(`user:slug:${username}`);
    });

    it('should throw when the user is not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(() => usecase.execute({ id: 'nonexistent-id' }, 'ADMIN')).rejects.toThrow(AppError);
    });

    it('should throw when the user is not ACTIVE', async () => {
      const user = createActiveUser();
      user.deactivate();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);

      await expect(() => usecase.execute({ id: user.toPersistence().id as string }, 'ADMIN')).rejects.toThrow(AppError);
    });
  });
});
