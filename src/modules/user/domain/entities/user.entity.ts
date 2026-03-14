import { AppError } from '../../../../shared/domain/errors/AppError';
import { ExpiringTokenVO } from '../../../../shared/domain/value-objects/expiringToken.vo';
import { EmailVo } from '../value-objects/email.vo';
import { PersonNameVO } from '../value-objects/personName.vo';
import { PhotoProfileVO } from '../value-objects/photoProfile.vo';
import { UserIdVO } from '../value-objects/userId.vo';
import { UsernameVO } from '../value-objects/username.vo';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLOCKED';

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'SUPPORT';

export class UserEntity {
    public getEmail(): string {
      return this.email.value;
    }

    public getVerificationTokenValue(): string | null {
      return this.verificationToken ? this.verificationToken.value : null;
    }
  private constructor(
    private readonly id: UserIdVO,
    private name: PersonNameVO | null,
    private lastName: PersonNameVO | null,
    private username: UsernameVO,
    private email: EmailVo,
    private passwordHash: string,
    private _role: Role,
    private _status: UserStatus,
    private photoProfile: PhotoProfileVO | null, // La "key" de S3
    private verifiedAt: Date | null,
    private lastLoginAt: Date | null,
    private verificationToken: ExpiringTokenVO | null,
    private passwordResetToken: ExpiringTokenVO | null,
    private blockedAt: Date | null,
    private blockedReason: string | null,
    private tokenVersion: number = 0, // Para invalidar tokens antiguos
    private createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null,
  ) {}

  public static create(username: string, email: string, passwordHash: string): UserEntity {
    if (!passwordHash || passwordHash.trim() === '') {
      throw new AppError('Password is required', 400, 'PASSWORD_REQUIRED');
    }

    return new UserEntity(
      UserIdVO.generate(), // Aqui se generara un id unico con un VO
      null, // name
      null, // lastName
      UsernameVO.create(username),
      EmailVo.create(email),
      passwordHash,
      'USER', // role por defecto
      'PENDING', // status por defecto
      null, // photoProfile
      null, // verifiedAt
      null, // lastLoginAt
      ExpiringTokenVO.generate(15), // verificationToken
      null, // passwordResetToken
      null, // blockedAt
      null, // blockedReason
      0, // tokenVersion
      new Date(), // createdAt
      new Date(), // updatedAt
      null, // deletedAt
    );
  }
  //getters
  get status(): UserStatus {
    return this._status;
  }
  get role(): Role {
    return this._role;
  }

  public activate(codeActive: string): void {
    this.ensureNotDeleted();
    if (this._status === 'ACTIVE') return;

    if (this._status !== 'PENDING') {
      throw new AppError(
        'User cannot be activated from current status',
        400,
        'INVALID_USER_STATUS',
      );
    }

    if (!codeActive || !this.verificationToken) {
      throw new AppError('Invalid verification code', 400, 'INVALID_VERIFICATION_CODE');
    }
    if (this.verificationToken.isExpired()) {
      throw new AppError('Verification code has expired', 400, 'VERIFICATION_CODE_EXPIRED');
    }
    if (!this.verificationToken.matches(codeActive)) {
      throw new AppError('Invalid verification code', 400, 'INVALID_VERIFICATION_CODE');
    }

    this._status = 'ACTIVE';
    this.verifiedAt = new Date();
    this.verificationToken = null;
    this.touch();
  }

  public regenerateVerificationToken(): void {
    this.ensureNotDeleted();
    if (this._status !== 'PENDING') {
      throw new AppError(
        'Only pending users can request a new verification token',
        400,
        'INVALID_USER_STATUS',
      );
    }
    this.verificationToken = ExpiringTokenVO.generate(15);
    this.touch();
  }

  public deactivate(): void {
    this.ensureNotDeleted();
    this.ensureActive();

    this._status = 'INACTIVE';
    this.touch();
  }

  public suspend(): void {
    this.ensureNotDeleted();
    this.ensureActive();

    this._status = 'SUSPENDED';
    this.touch();
  }

  public block(reason: string): void {
    this.ensureNotDeleted();
    if (this._status === 'BLOCKED') return;

    if (!reason || reason.trim() === '') {
      throw new AppError('Block reason is required', 400, 'BLOCK_REASON_REQUIRED');
    }

    this._status = 'BLOCKED';
    this.blockedAt = new Date();
    this.blockedReason = reason;
    this.touch();
  }

  public updateUserName(newUsername: string): void {
    this.ensureNotDeleted();
    this.ensureNotBlocked();

    this.username = UsernameVO.create(newUsername);
    this.touch();
  }

  public updateEmail(newEmail: string): void {
    this.ensureNotDeleted();
    this.ensureNotBlocked();
    if (this._status === 'INACTIVE') {
      throw new AppError(
        'Email can only be updated when user is active, pending or suspended',
        403,
        'INVALID_USER_STATUS',
      );
    }

    const emailVO = EmailVo.create(newEmail);

    if (this.email.equals(emailVO)) {
      throw new AppError('New email must be different from current email', 400, 'EMAIL_UNCHANGED');
    }

    this.email = emailVO;
    this._status = 'PENDING';
    this.verifiedAt = null;
    this.verificationToken = ExpiringTokenVO.generate(60);
    this.tokenVersion++;
    this.touch();
  }

  public changePassword(newPasswordHash: string): void {
    this.ensureNotDeleted();
    this.ensureNotBlocked();
    this.passwordHash = newPasswordHash;
    this.tokenVersion++;
    this.touch();
  }

  public updatePassword(newPasswordHash: string, verificationCode: string): void {
    this.ensureNotDeleted();
    this.ensureNotBlocked();

    if (!newPasswordHash || newPasswordHash.trim() === '') {
      throw new AppError('New password is required', 400, 'PASSWORD_REQUIRED');
    }

    if (!verificationCode) {
      throw new AppError('Verification code is required', 400, 'VERIFICATION_CODE_REQUIRED');
    }

    if (!this.passwordResetToken) {
      throw new AppError('Invalid verification code', 400, 'INVALID_VERIFICATION_CODE');
    }

    if (this.passwordResetToken.isExpired()) {
      throw new AppError('Verification code has expired', 400, 'VERIFICATION_CODE_EXPIRED');
    }

    if (!this.passwordResetToken.matches(verificationCode)) {
      throw new AppError('Invalid verification code', 400, 'INVALID_VERIFICATION_CODE');
    }

    this.passwordHash = newPasswordHash;
    this.passwordResetToken = null;
    this.tokenVersion++;
    this.touch();
  }

  public generatePasswordResetToken(): void {
    this.ensureNotDeleted();
    this.ensureNotBlocked();
    this.passwordResetToken = ExpiringTokenVO.generate(60); // Token valido por 60 minutos
    this.touch();
  }

  public setProfile(name: string, lastName: string): void {
    this.ensureNotDeleted();
    this.ensureNotBlocked();
    this.name = PersonNameVO.create(name);
    this.lastName = PersonNameVO.create(lastName);
    this.touch();
  }

  public updateName(name: string): void {
    this.ensureNotDeleted();
    this.ensureNotBlocked();
    this.name = PersonNameVO.create(name);
    this.touch();
  }

  public updateLastName(lastName: string): void {
    this.ensureNotDeleted();
    this.ensureNotBlocked();
    this.lastName = PersonNameVO.create(lastName);
    this.touch();
  }

  public delete(): void {
    if (this.deletedAt !== null) return;
    this.deletedAt = new Date();
    this.touch();
  }

  public changeRole(newRole: Role): void {
    this.ensureNotDeleted();
    if (this._role === newRole) return;
    this._role = newRole;
    this.touch();
  }

  public updatePhotoProfile(newPhotokey: string): void {
    this.ensureNotDeleted();
    this.ensureActive();
    this.ensureNotSuspended();
    this.photoProfile = PhotoProfileVO.create(newPhotokey);
    this.touch();
  }

  public removePhotoProfile(): void {
    this.ensureNotDeleted();
    this.photoProfile = null;
    this.touch();
  }

  public incrementTokenVersion(): void {
    this.ensureNotDeleted();
    this.tokenVersion++;
    this.touch();
  }

  public updateLastLogin(): void {
    this.lastLoginAt = new Date();
    this.touch();
  }

  public toPersistence(): Record<string, unknown> {
    return {
      id: this.id.value,
      name: this.name?.value ?? null,
      lastName: this.lastName?.value ?? null,
      username: this.username.value,
      email: this.email.value,
      passwordHash: this.passwordHash,
      role: this._role,
      status: this._status,
      photoProfile: this.photoProfile?.value ?? null,
      verifiedAt: this.verifiedAt,
      lastLoginAt: this.lastLoginAt,
      verificationToken: this.verificationToken
        ? { value: this.verificationToken.value, expiresAt: this.verificationToken.expiresAt }
        : null,
      passwordResetToken: this.passwordResetToken
        ? { value: this.passwordResetToken.value, expiresAt: this.passwordResetToken.expiresAt }
        : null,
      blockedAt: this.blockedAt,
      blockedReason: this.blockedReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      tokenVersion: this.tokenVersion,
    };
  }

  public toPrimitives(): Record<string, unknown> {
    return {
      id: this.id.value,
      name: this.name?.value ?? null,
      lastName: this.lastName?.value ?? null,
      username: this.username.value,
      email: this.email.value,
      role: this._role,
      status: this._status,
      photoProfile: this.photoProfile?.value ?? null,
      verifiedAt: this.verifiedAt,
      lastLoginAt: this.lastLoginAt,
      blockedAt: this.blockedAt,
      blockedReason: this.blockedReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }

  public static fromPrimitives(data: {
    id: string;
    name: string | null;
    lastName: string | null;
    username: string;
    email: string;
    passwordHash: string;
    role: Role;
    status: UserStatus;
    photoProfile: string | null;
    verifiedAt: Date | null;
    lastLoginAt: Date | null;
    verificationToken: { value: string; expiresAt: Date } | null;
    passwordResetToken: { value: string; expiresAt: Date } | null;
    blockedAt: Date | null;
    blockedReason: string | null;
    tokenVersion: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): UserEntity {
    return new UserEntity(
      UserIdVO.fromString(data.id),
      data.name ? PersonNameVO.create(data.name) : null,
      data.lastName ? PersonNameVO.create(data.lastName) : null,
      UsernameVO.create(data.username),
      EmailVo.create(data.email),
      data.passwordHash,
      data.role,
      data.status,
      data.photoProfile ? PhotoProfileVO.create(data.photoProfile) : null,
      data.verifiedAt,
      data.lastLoginAt,
      data.verificationToken
        ? ExpiringTokenVO.fromPersistence(
            data.verificationToken.value,
            data.verificationToken.expiresAt,
          )
        : null,
      data.passwordResetToken
        ? ExpiringTokenVO.fromPersistence(
            data.passwordResetToken.value,
            data.passwordResetToken.expiresAt,
          )
        : null,
      data.blockedAt,
      data.blockedReason,
      data.tokenVersion ?? 0,
      data.createdAt,
      data.updatedAt,
      data.deletedAt,
    );
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  private ensureActive(): void {
    if (this._status !== 'ACTIVE') {
      throw new AppError('User must be active to perform this action', 403, 'USER_NOT_ACTIVE');
    }
  }

  private ensureNotBlocked(): void {
    if (this._status === 'BLOCKED') {
      throw new AppError('Your account has been blocked', 403, 'USER_BLOCKED');
    }
  }

  private ensureNotSuspended(): void {
    if (this._status === 'SUSPENDED') {
      throw new AppError('Your account is suspended', 403, 'USER_SUSPENDED');
    }
  }

  private ensureNotDeleted(): void {
    if (this.deletedAt !== null) {
      throw new AppError('Cannot perform actions on a deleted user', 403, 'USER_DELETED');
    }
  }
}
