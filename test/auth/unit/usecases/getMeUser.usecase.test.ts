import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetmeUserUsecase } from '../../../../src/modules/user/application/usecase/getMeUser.usecase';
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
  const user = UserEntity.create('username', 'email@gmail.com', '12245678945525');
  user.activate(user.toPersistence().verificationToken!.value);
  return user;
}

describe('GetMeUserUseCase', () => {
  let usecase: GetmeUserUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new GetmeUserUsecase(mockRepository);
  });
  describe('execute()', () => {
    it('should return the authenticated user data', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findById).mockResolvedValue(user);

      const result = await usecase.execute(user.toPersistence().id.toString());
      expect(mockRepository.findById).toHaveBeenCalledWith(user.toPersistence().id.toString());
      expect(result).toEqual(user);
    });
    it('should throw when user is not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(usecase.execute('nonexistent-user-id')).rejects.toThrow(AppError);
    });
  });
});
