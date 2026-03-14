import { Role, UserEntity, UserStatus } from '../../domain/entities/user.entity';
import { env } from '../../../../config/env';

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  name: string | null;
  lastName: string | null;
  role: Role;
  status: UserStatus;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserPresenter {
  one(user: UserEntity): UserResponse {
    const primitives = user.toPrimitives();

    const avatarUrl = (primitives.photoProfile as string | null)
      ? `${env.STORAGE_PUBLIC_URL}/${primitives.photoProfile as string}`
      : null;

    return {
      id: primitives.id as string,
      username: primitives.username as string,
      email: primitives.email as string,
      name: primitives.name as string | null,
      lastName: primitives.lastName as string | null,
      role: primitives.role as Role,
      status: primitives.status as UserStatus,
      avatarUrl,
      createdAt: primitives.createdAt as Date,
      updatedAt: primitives.updatedAt as Date,
    };
  }

  many(users: UserEntity[]): UserResponse[] {
    return users.map((user) => this.one(user));
  }
}
