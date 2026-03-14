import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
import { ChangeRoleUsecase } from '../../../../src/modules/user/application/usecase/changeRole.usecase';
import { AppError } from '../../../../src/shared/domain/errors/AppError';


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

describe('ChangeRoleUsecase', () => {
  let usecase: ChangeRoleUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new ChangeRoleUsecase(mockRepository);
  })

  describe('execute()', () => {
    it('should change the user role to the specified value', async () => {
      const user = createActiveUser()
      vi.mocked(mockRepository.findById).mockResolvedValue(user);

      await usecase.execute({id: user.toPersistence().id, role: 'ADMIN'});
      expect(mockRepository.findById).toHaveBeenCalledWith(user.toPersistence().id);
      expect(mockRepository.save).toHaveBeenCalled();
      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];
      expect(savedUser.toPersistence().role).toBe('ADMIN');
    });
    it('should do nothing when the new role is the same as the current one', async () => {
      const user = createActiveUser()
      vi.mocked(mockRepository.findById).mockResolvedValue(user);

      await expect(() => usecase.execute({id: user.toPersistence().id, role: 'USER'})).not.toThrow(AppError);
    });
    it('should throw when the user is not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(() => usecase.execute({id: 'nonexistent-id', role: 'ADMIN'})).rejects.toThrow(AppError);
    });
    it('should allow assigning any role (authorization is handled by the middleware)', async () => {
      const user = createActiveUser()
      vi.mocked(mockRepository.findById).mockResolvedValue(user);

      await usecase.execute({ id: user.toPersistence().id, role: 'ADMIN' });

      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];
      expect(savedUser.toPersistence().role).toBe('ADMIN');
    });
  });
});
