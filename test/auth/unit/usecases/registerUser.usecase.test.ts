import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterUserUsecase } from '../../../../src/modules/user/application/usecase/registerUser.usecase';
import { UserrepositoryDomain } from '../../../../src/modules/user/domain/repositories/userRepository.domain';
import { UserEntity } from '../../../../src/modules/user/domain/entities/user.entity';
import { PasswordPort } from '../../../../src/modules/user/domain/ports/password.port';
import { MailerPort } from '../../../../src/modules/user/domain/ports/mailer.port';
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

const mockPasswordPort:PasswordPort = {
  hash: vi.fn(),
  compare: vi.fn(),
}

const mockEmailPort:MailerPort = {
  sendPasswordResetEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
}
  




describe('RegisterUserUseCase', () => {
  let usecase: RegisterUserUsecase;

  beforeEach(() => {
    vi.clearAllMocks();
    usecase = new RegisterUserUsecase(mockRepository, mockPasswordPort, mockEmailPort);
  })
  describe('execute()', () => {
    it('should create and persist a new user', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(null);
      vi.mocked(mockPasswordPort.hash).mockResolvedValue('hashed-password');
      vi.mocked(mockRepository.save).mockResolvedValue();

      const result = await usecase.execute({ username: 'newuser', email: 'emai@gmail.com', password: 'password123' });

      expect(result).toBeInstanceOf(UserEntity);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('emai@gmail.com');
      expect(mockRepository.findByUsername).toHaveBeenCalledWith('newuser');
      expect(mockPasswordPort.hash).toHaveBeenCalledWith('password123');
      expect(mockRepository.save).toHaveBeenCalled();

    });
    it('should hash the password before saving', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(null);
      vi.mocked(mockPasswordPort.hash).mockResolvedValue('hashed-password');
      vi.mocked(mockRepository.save).mockResolvedValue();

      await usecase.execute({ username: 'newuser', email: 'email@gmail.com', password: 'password123' });

      expect(mockPasswordPort.hash).toHaveBeenCalledWith('password123');
      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];
      expect(savedUser.toPersistence().passwordHash).toBe('hashed-password');
    });
    it('should send a verification email after registration', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(null);
      vi.mocked(mockPasswordPort.hash).mockResolvedValue('hashed-password');
      vi.mocked(mockRepository.save).mockResolvedValue();
      vi.mocked(mockEmailPort.sendVerificationEmail).mockResolvedValue();

      await usecase.execute({ username: 'newuser', email: 'email@gmail.com', password: 'password123' });

      expect(mockEmailPort.sendVerificationEmail).toHaveBeenCalled();
      const savedUser = vi.mocked(mockRepository.save).mock.calls[0][0];
      expect(mockEmailPort.sendVerificationEmail).toHaveBeenCalledWith(
        savedUser.toPersistence().email,
        savedUser.toPersistence().verificationToken!.value,
      );
    });
    it('should throw when the email is already in use', async () => {
      const existingUser = UserEntity.create('existinguser', 'email@gmail.com', 'somehash');
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(existingUser);
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(null);

      await expect(() => usecase.execute({ username: 'newuser', email: 'email@gmail.com', password: 'password123' })).rejects.toThrow(AppError);
    });
    it('should throw when the username is already in use', async () => {
      const existingUser = UserEntity.create('existinguser', 'email@gmail.com', 'somehash');
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockRepository.findByUsername).mockResolvedValue(existingUser);

      await expect(() => usecase.execute({ username: 'existinguser', email: 'newemail@gmail.com', password: 'password123' })).rejects.toThrow(AppError);
    });
  });
});
