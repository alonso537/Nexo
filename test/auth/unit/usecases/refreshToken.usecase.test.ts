import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RefreshTokenUsecase } from '../../../../src/modules/user/application/usecase/refreshToken.usecase';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
import { TokenPort } from '../../../../src/modules/user/domain/ports/token.port';
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


function createActiveUser(): UserEntity {
  const user = UserEntity.create('username', 'email@gmail.com', '12245678945525');
  user.activate(user.toPersistence().verificationToken!.value);
  return user;
}


describe('RefreshTokenUseCase', () => {
  let usecase: RefreshTokenUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new RefreshTokenUsecase(mockRepository, mockTokenPort);
  });
  describe('execute()', () => {
    it('should return a new access token when refresh token is valid', async () => {
      const user = createActiveUser();
      const refreshTokenPayload = {
        sub: user.toPersistence().id.toString(),
        role: user.toPersistence().role,
        type: 'refresh',
        tokenVersion: user.toPersistence().tokenVersion,
      };
      vi.mocked(mockTokenPort.verify).mockResolvedValue(refreshTokenPayload);
      vi.mocked(mockRepository.findById).mockResolvedValue(user);
      vi.mocked(mockTokenPort.sign).mockResolvedValue('new-access-token');

      const result = await usecase.execute('valid-refresh-token');

      expect(result).toEqual({ accessToken: 'new-access-token' });
      expect(mockTokenPort.verify).toHaveBeenCalledWith('valid-refresh-token', 'refresh');
      expect(mockRepository.findById).toHaveBeenCalledWith(user.toPersistence().id.toString());
    });
    it('should throw when the refresh token is invalid or expired', async () => {
      vi.mocked(mockTokenPort.verify).mockRejectedValue(new Error('Invalid token'));

      await expect(usecase.execute('invalid-refresh-token')).rejects.toThrow(AppError);
      expect(mockTokenPort.verify).toHaveBeenCalledWith('invalid-refresh-token', 'refresh');
    });
    it('should throw when tokenVersion does not match (invalidated session)', async () => {
      const user = createActiveUser();
      const refreshTokenPayload = {
        sub: user.toPersistence().id.toString(),
        role: user.toPersistence().role,
        type: 'refresh',
        tokenVersion: user.toPersistence().tokenVersion + 1, // Simulate tokenVersion mismatch
      };
      vi.mocked(mockTokenPort.verify).mockResolvedValue(refreshTokenPayload);
      vi.mocked(mockRepository.findById).mockResolvedValue(user);

      await expect(usecase.execute('valid-refresh-token')).rejects.toThrow(AppError);
      expect(mockTokenPort.verify).toHaveBeenCalledWith('valid-refresh-token', 'refresh');
      expect(mockRepository.findById).toHaveBeenCalledWith(user.toPersistence().id.toString());
    });
    it('should throw when user is not found', async () => {
      const refreshTokenPayload = {
        sub: 'nonexistent-user-id',
        role: 'user',
        type: 'refresh',
        tokenVersion: 0,
      };
      vi.mocked(mockTokenPort.verify).mockResolvedValue(refreshTokenPayload);
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(usecase.execute('valid-refresh-token')).rejects.toThrow(AppError);
      expect(mockTokenPort.verify).toHaveBeenCalledWith('valid-refresh-token', 'refresh');
      expect(mockRepository.findById).toHaveBeenCalledWith('nonexistent-user-id');
    });
    it('should throw when the user is BLOCKED', async () => {
      const user = createActiveUser();
      user.block('Account suspended');
      const refreshTokenPayload = {
        sub: user.toPersistence().id.toString(),
        role: user.toPersistence().role,
        type: 'refresh',
        tokenVersion: user.toPersistence().tokenVersion,
      };
      vi.mocked(mockTokenPort.verify).mockResolvedValue(refreshTokenPayload);
      vi.mocked(mockRepository.findById).mockResolvedValue(user);

      await expect(usecase.execute('valid-refresh-token')).rejects.toThrow(AppError);
    });
  });
});
