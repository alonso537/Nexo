import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LogoutUsecase } from '../../../../src/modules/user/application/usecase/logout.usecase';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';

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
  user.activate(user.toPersistence().verificationToken!.value);
  return user;
}

describe('LogoutUsecase', () => {
  let usecase: LogoutUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new LogoutUsecase(mockRepository);
  });

  describe('execute()', () => {
    it('should increment tokenVersion to invalidate all active sessions', async () => {
      const user = createActiveUser();
      const originalTokenVersion = user.toPersistence().tokenVersion;
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockRepository.save).mockResolvedValue();

      await usecase.execute(user.toPersistence().id.toString());

      expect(mockRepository.findById).toHaveBeenCalledWith(user.toPersistence().id.toString());
      expect(user.toPersistence().tokenVersion).toBe(originalTokenVersion + 1);
      expect(mockRepository.save).toHaveBeenCalledWith(user);
    });
    it('should throw when user is not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(() => usecase.execute('nonexistent-user-id')).rejects.toThrow();
      expect(mockRepository.findById).toHaveBeenCalledWith('nonexistent-user-id');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
