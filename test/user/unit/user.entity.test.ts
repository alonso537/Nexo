import { describe, expect, it, vi } from 'vitest';
import { UserEntity } from '../../../src/modules/user/domain/entities/user.entity';
import { AppError } from '../../../src/shared/domain/errors/AppError';

const VALID_USERNAME = 'validuser';
const VALID_EMAIL = 'validemail@gmail.com';
const VALID_PASSWORD_HASH = 'hashedpassword';

describe('UserEntity', () => {
  describe('create()', () => {
    it('should create a user with PENDING status and USER role by default', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);

      expect(user.status).toBe('PENDING');
      expect(user.role).toBe('USER');
    });
    it('should throw AppError when passwordHash is empty', () => {
      expect(() => UserEntity.create(VALID_USERNAME, VALID_EMAIL, '')).toThrow(AppError);
    });
    it('should generate a verification token on creation', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      expect(user.toPersistence().verificationToken).toBeDefined();
    });
    it('should set name and lastName to null on creation', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);

      expect(user.toPersistence().name).toBeNull();
      expect(user.toPersistence().lastName).toBeNull();
    });
  });

  describe('activate()', () => {
    it('should set status to ACTIVE when given a valid verification code', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);

      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);

      expect(user.status).toBe('ACTIVE');
      expect(user.toPersistence().verificationToken).toBeNull();
    });
    it('should throw when status is not PENDING', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);

      const code = (user.toPersistence().verificationToken as { value: string } | null)?.value as string;
      user.activate(code); // ACTIVE
      user.deactivate(); // INACTIVE

      expect(() => user.activate('any-code')).toThrow(AppError);
    });
    it('should throw when the verification code does not match', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);

      expect(() => user.activate('invalid-code')).toThrow(AppError);
    });
    it('should throw when the verification token has expired', () => {
      vi.useFakeTimers();
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      vi.advanceTimersByTime(16 * 60 * 1000); // advance 16 min — token expires after 15

      const code = (user.toPersistence().verificationToken as { value: string } | null)?.value as string;
      expect(() => user.activate(code)).toThrow(AppError);

      vi.useRealTimers();
    });
    it('should clear the verification token after activation', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value: string } | null)?.value as string;
      user.activate(code);

      expect(user.toPersistence().verificationToken).toBeNull();
    });
  });

  describe('regenerateVerificationToken()', () => {
    it('should generate a new verification token for PENDING users', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const firstToken = user.toPersistence().verificationToken;
      user.regenerateVerificationToken();
      const secondToken = user.toPersistence().verificationToken;

      expect(secondToken).toBeDefined();
      expect(secondToken).not.toEqual(firstToken);
    });
    it('should throw when user is not PENDING', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value: string }).value as string;
      user.activate(code); // ACTIVE

      expect(() => user.regenerateVerificationToken()).toThrow(AppError);
    });
  });

  describe('deactivate()', () => {
    it('should set status to INACTIVE when user is ACTIVE', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value: string }).value as string;
      user.activate(code); // ACTIVE

      user.deactivate();
      expect(user.status).toBe('INACTIVE');
    });
    it('should throw when user is not ACTIVE', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      expect(() => user.deactivate()).toThrow(AppError);
    });
  });

  describe('suspend()', () => {
    it('should set status to SUSPENDED when user is ACTIVE', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value: string }).value as string;
      user.activate(code); // ACTIVE
      user.suspend();
      expect(user.status).toBe('SUSPENDED');
    });
    it('should throw when user is not ACTIVE', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      expect(() => user.suspend()).toThrow(AppError);
    });
  });

  describe('block()', () => {
    it('should set status to BLOCKED and store the reason', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const reason = 'Violation of terms';
      user.block(reason);
      expect(user.status).toBe('BLOCKED');
      expect(user.toPersistence().blockedReason).toBe(reason);
    });
    it('should throw when reason is empty', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      expect(() => user.block('')).toThrow(AppError);
    });
    it('should do nothing when user is already BLOCKED', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const reason = 'Violation of terms';
      user.block(reason);
      user.block('Another reason'); // should do nothing
      expect(user.status).toBe('BLOCKED');
      expect(user.toPersistence().blockedReason).toBe(reason); // reason should not change
    });
  });

  describe('updateEmail()', () => {
    it('should update email, reset status to PENDING and increment tokenVersion', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value: string }).value as string;
      user.activate(code);

      const newEmail = 'newemail@gmail.com';
      user.updateEmail(newEmail);

      const tokenVersion = user.toPersistence().tokenVersion as number;

      expect(user.toPersistence().email).toBe(newEmail);
      expect(user.status).toBe('PENDING');
      expect(tokenVersion).toBe(1); // tokenVersion should be incremented
    });
    it('should throw when new email is the same as current email', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value: string }).value as string;
      user.activate(code);

      expect(() => user.updateEmail(VALID_EMAIL)).toThrow(AppError);
    });
    it('should throw when user is INACTIVE', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value: string } | null)?.value as string;
      user.activate(code);
      user.deactivate(); // INACTIVE

      expect(() => user.updateEmail('newemail@gmail.com')).toThrow(AppError);
    });
    it('should throw when user is BLOCKED', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value: string } | null)?.value as string;
      user.activate(code);
      user.block('Violation of terms'); // BLOCKED

      expect(() => user.updateEmail('newemail@gmail.com')).toThrow(AppError);
    });
  });

  describe('changePassword()', () => {
    it('should update passwordHash and increment tokenVersion', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value: string } | null)?.value as string;
      user.activate(code);

      const newPasswordHash = 'newhashedpassword';
      user.changePassword(newPasswordHash);

      expect(user.toPersistence().passwordHash).toBe(newPasswordHash);
      expect(user.toPersistence().tokenVersion).toBe(1); // tokenVersion should be incremented
    });
    it('should throw when user is BLOCKED', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value: string } | null)?.value as string;
      user.activate(code);
      user.block('Violation of terms'); // BLOCKED

      expect(() => user.changePassword('newhashedpassword')).toThrow(AppError);
    });
  });

  describe('updatePassword()', () => {
    it('should update passwordHash when verification code is valid', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);

      user.generatePasswordResetToken();
      const resetToken = (user.toPersistence().passwordResetToken as { value: string } | null)?.value as string;

      user.updatePassword('newhashedpassword', resetToken);

      expect(user.toPersistence().passwordHash).toBe('newhashedpassword');
      expect(user.toPersistence().passwordResetToken).toBeNull(); // token should be cleared after use
    });
    it('should throw when no passwordResetToken exists', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);

      expect(() => user.updatePassword('newhashedpassword', 'any-token')).toThrow(AppError);
    });
    it('should throw when verification code is expired', () => {
      vi.useFakeTimers();
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);

      user.generatePasswordResetToken();
      const resetToken = (user.toPersistence().passwordResetToken as { value: string } | null)?.value as string;

      vi.advanceTimersByTime(61 * 60 * 1000); // advance 61 min — token expires after 15

      expect(() => user.updatePassword('newhashedpassword', resetToken)).toThrow(AppError);

      vi.useRealTimers();
    });
    it('should throw when verification code does not match', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);

      user.generatePasswordResetToken();
      const resetToken = (user.toPersistence().passwordResetToken as { value: string } | null)?.value as string;

      expect(() => user.updatePassword('newhashedpassword', 'invalid-token')).toThrow(AppError);
    });
  });

  describe('generatePasswordResetToken()', () => {
    it('should generate a new passwordResetToken', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);

      user.generatePasswordResetToken();

      const resetToken = user.toPersistence().passwordResetToken;

      expect(resetToken).toBeDefined();
    });
    it('should throw when user is blocked', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);
      user.block('Violation of terms'); // BLOCKED

      expect(() => user.generatePasswordResetToken()).toThrow(AppError);
    });
  });

  describe('updateUserName()', () => {
    it('should update the username', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);

      user.updateUserName('newusername');

      expect(user.toPersistence().username).toBe('newusername');
    });
    it('should throw when user is blocked', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);
      user.block('Violation of terms'); // BLOCKED

      expect(() => user.updateUserName('newusername')).toThrow(AppError);
    });
  });

  describe('updateName() / updateLastName()', () => {
    it('should update name correctly', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);

      user.updateName('NewName');

      expect(user.toPersistence().name).toBe('NewName');
    });
    it('should update lastName correctly', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);

      user.updateLastName('NewLastName');

      expect(user.toPersistence().lastName).toBe('NewLastName');
    });
  });

  describe('changeRole()', () => {
    it('should change the role to the new value', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);

      user.changeRole('ADMIN');
      expect(user.toPersistence().role).toBe('ADMIN');
    });
    it('should do nothing when role is the same', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);

      user.changeRole('USER'); // same role
      expect(user.toPersistence().role).toBe('USER'); // role should not change
    });
  });

  describe('updatePhotoProfile()', () => {
    it('should set photoProfile to the new S3 key', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);

      const S3Key = 'avatar/image.jpg';
      user.updatePhotoProfile(S3Key);

      expect(user.toPersistence().photoProfile).toBe(S3Key);
    });
    it('should throw when user is not ACTIVE', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);

      expect(() => user.updatePhotoProfile('avatar/image.jpg')).toThrow(AppError);
    });
  });

  describe('removePhotoProfile()', () => {
    it('should set photoProfile to null', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);
      user.updatePhotoProfile('avatar/image.jpg'); // set a photo first
      user.removePhotoProfile();
      expect(user.toPersistence().photoProfile).toBeNull();
    });
  });

  describe('delete()', () => {
    it('should set deletedAt to current date', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);

      user.delete();

      expect(user.toPersistence().deletedAt).toBeInstanceOf(Date);
    });
    it('should do nothing when already deleted', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);
      user.delete();
      const firstDeletedAt = user.toPersistence().deletedAt as Date;
      user.delete(); // call delete again
      const secondDeletedAt = user.toPersistence().deletedAt as Date;
      expect(secondDeletedAt.getTime()).toBe(firstDeletedAt.getTime()); // deletedAt should not change
    });
  });

  describe('toPersistence()', () => {
    it('should return all fields including passwordHash', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);

      const persistenceData = user.toPersistence();

      expect(persistenceData).toMatchObject({
        username: VALID_USERNAME,
        email: VALID_EMAIL,
        passwordHash: VALID_PASSWORD_HASH,
        role: 'USER',
        status: 'ACTIVE',
        name: null,
        lastName: null,
        photoProfile: null,
        verifiedAt: expect.any(Date),
        lastLoginAt: null,
        verificationToken: null,
        passwordResetToken: null,
        blockedAt: null,
        blockedReason: null,
        tokenVersion: 0,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        deletedAt: null,
      });
    });
  });

  describe('toPrimitives()', () => {
    it('should return all public fields without passwordHash', () => {
      const user = UserEntity.create(VALID_USERNAME, VALID_EMAIL, VALID_PASSWORD_HASH);
      const code = (user.toPersistence().verificationToken as { value?: string } | null)?.value as string;
      user.activate(code);

      const primitivesData = user.toPrimitives();

      expect(primitivesData).toMatchObject({
        username: VALID_USERNAME,
        email: VALID_EMAIL,
        role: 'USER',
        status: 'ACTIVE',
        name: null,
        lastName: null,
        photoProfile: null,
        verifiedAt: expect.any(Date),
        lastLoginAt: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
