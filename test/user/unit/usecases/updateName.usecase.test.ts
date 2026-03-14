import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateNameUsecase } from '../../../../src/modules/user/application/usecase/updateName.usecase';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
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
  const user = UserEntity.create('testuser', 'test@gmail.com', '123456789askf');
  const code = user.toPersistence().verificationToken!.value as string;
  user.activate(code);
  // user.changeRole('ADMIN')

  return user;
}

describe('UpdateNameUseCase', () => {
  let usecase: UpdateNameUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new UpdateNameUsecase(mockRepository);
  });

  describe('execute()', () => {
    it('should update the user first name', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);

      await usecase.execute(user.toPersistence().id, { name: 'John' });

      expect(mockRepository.findById).toHaveBeenCalledWith(user.toPersistence().id);
      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];
      expect(savedUser.toPersistence().name).toBe('John');
    });
    it('should throw when the user is not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(() => usecase.execute('no-id-valid', { name: 'john' })).rejects.toThrow(
        AppError,
      );
    });
    it('should throw when name is invalid (too short, special chars)', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);

      await expect(() => usecase.execute(user.toPersistence().id, { name: 'J' })).rejects.toThrow(
        AppError,
      );
      await expect(() =>
        usecase.execute(user.toPersistence().id, { name: 'John@' }),
      ).rejects.toThrow(AppError);
    });
  });
});
