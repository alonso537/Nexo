import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetUserBySlugUsecase } from '../../../../src/modules/user/application/usecase/getUserBySlug.usecase';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';


const mockRepository:UserrepositoryDomain = {
  save: vi.fn(),
  delete: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findByUsername: vi.fn(),
  findByVerificationToken: vi.fn(),
  findByPasswordResetToken: vi.fn(),
  findAll: vi.fn(),
}

function createActiveUser(): UserEntity {
  const user = UserEntity.create('testuser', 'test@gmail.com', '123456789askf');
  const code = user.toPersistence().verificationToken!.value as string;
  user.activate(code);
  // user.changeRole('ADMIN')

  return user;
}

describe('GetUserBySlugUseCase', () => {
  let usecase: GetUserBySlugUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new GetUserBySlugUsecase(mockRepository);
  })

  describe('execute()', () => {
    it('should return a user when a matching username is found', async () => {
      const user = createActiveUser()
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(user);

      const result = await usecase.execute({username:'testuser'});

      expect(mockRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(result).toEqual(user);


    });
    it('should throw when no user matches the given username', async () => {
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(null);

      await expect(() => usecase.execute({username:'nonexistent'})).rejects.toThrow();

    });
  });
});
