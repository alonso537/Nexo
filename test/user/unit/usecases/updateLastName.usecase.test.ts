import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateLastNameUsecase } from '../../../../src/modules/user/application/usecase/updateLastName.usecase';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
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

describe('UpdateLastNameUseCase', () => {

  let usecase: UpdateLastNameUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new UpdateLastNameUsecase(mockRepository);
  })

  describe('execute()', () => {
    it('should update the user last name', async () => {
      const user = createActiveUser()
      vi.mocked(mockRepository.findById).mockResolvedValue(user);

      const newLastName = 'Smith';

      await usecase.execute(user.toPersistence().id, { lastName:newLastName });

      expect(mockRepository.findById).toHaveBeenCalledWith(user.toPersistence().id);
      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];
      expect(savedUser.toPersistence().lastName).toBe(newLastName);


    });
    it('should throw when the user is not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null)

      await expect(usecase.execute('no-valid-id', { lastName: 'Smith' })).rejects.toThrow(AppError);
    });
    it('should throw when lastName is invalid (too short, special chars)', async () => {
      const user = createActiveUser()
      vi.mocked(mockRepository.findById).mockResolvedValue(user);

      const invalidLastName = 'S'; // Too short

      await expect(usecase.execute(user.toPersistence().id, { lastName: invalidLastName })).rejects.toThrow(AppError);

      const invalidLastName2 = 'Smith!'; // Special chars

      await expect(usecase.execute(user.toPersistence().id, { lastName: invalidLastName2 })).rejects.toThrow(AppError);

      const invalidLastName3 = 'Smith123'; // Numbers

      await expect(usecase.execute(user.toPersistence().id, { lastName: invalidLastName3 })).rejects.toThrow(AppError);
    });
  });
});
