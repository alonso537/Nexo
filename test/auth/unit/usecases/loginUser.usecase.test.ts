import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginuserUsecase } from '../../../../src/modules/user/application/usecase/loginuser.usecase';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
import { TokenPort } from '../../../../src/modules/user/domain/ports/token.port';
import { PasswordPort } from '../../../../src/modules/user/domain/ports/password.port';
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

const mockTokenPort:TokenPort = {
  sign: vi.fn(),
  verify: vi.fn(),
}

const mockPasswordPort:PasswordPort = {
  hash: vi.fn(),
  compare: vi.fn(),
}

function createActiveUser(): UserEntity {
  const user = UserEntity.create('username', 'email@gmail.com', '12245678945525');
  user.activate(user.toPersistence().verificationToken!.value);
  return user;
}


describe('LoginUserUseCase', () => {
  let usecase: LoginuserUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new LoginuserUsecase(mockRepository, mockTokenPort, mockPasswordPort);
  });
  describe('execute()', () => {
    it('should return access and refresh tokens on valid credentials', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(user);
      vi.mocked(mockPasswordPort.compare).mockResolvedValue(true);
      vi.mocked(mockTokenPort.sign).mockResolvedValue('mock-token');

      const result = await usecase.execute({ email: 'email@gmail.com', password: '12245678945525' });

      expect(result).toEqual({ accessToken: 'mock-token', refreshToken: 'mock-token' });
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('email@gmail.com');
      expect(mockPasswordPort.compare).toHaveBeenCalled();
      expect(mockTokenPort.sign).toHaveBeenCalledTimes(2);
      expect(mockRepository.save).toHaveBeenCalled();
    });
    it('should update lastLoginAt on successful login', async () => {
      const user = createActiveUser();
      const lastLoginBefore = user.toPersistence().lastLoginAt;
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(user);
      vi.mocked(mockPasswordPort.compare).mockResolvedValue(true);
      vi.mocked(mockTokenPort.sign).mockResolvedValue('mock-token');

      await usecase.execute({ email: 'email@gmail.com', password: '12245678945525' });

      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];
      expect(savedUser.toPersistence().lastLoginAt).not.toBe(lastLoginBefore);
      expect(savedUser.toPersistence().lastLoginAt).toBeInstanceOf(Date);
    });
    it('should throw when user is not found', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);

      await expect(usecase.execute({ email: 'notfound@gmail.com', password: '12245678945525' })).rejects.toThrow(AppError);
    });
    it('should throw when password does not match', async () => {
      const user = createActiveUser();
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(user);
      vi.mocked(mockPasswordPort.compare).mockResolvedValue(false);

      await expect(usecase.execute({ email: 'email@gmail.com', password: 'wrongpassword' })).rejects.toThrow(AppError);
    });
    it('should throw when user is not ACTIVE (PENDING, SUSPENDED, BLOCKED)', async () => {
      // BLOCKED user
      const blockedUser = createActiveUser();
      blockedUser.block('Violation');
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(blockedUser);

      await expect(usecase.execute({ email: 'email@gmail.com', password: '12245678945525' })).rejects.toThrow(AppError);
    });
  });
});
