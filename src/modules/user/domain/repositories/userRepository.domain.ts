import { Role, UserEntity, UserStatus } from '../entities/user.entity';

export interface FiltersUsers {
  username?: string;
  email?: string;
  name?: string;
  lastName?: string;
  role?: Role;
  status?: UserStatus;
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

export interface UserrepositoryDomain {
  save(user: UserEntity): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  findByVerificationToken(token: string): Promise<UserEntity | null>;
  findByPasswordResetToken(token: string): Promise<UserEntity | null>;
  findAll(filters?: FiltersUsers): Promise<{
    users: UserEntity[];
    total: number;
  }>;
}
