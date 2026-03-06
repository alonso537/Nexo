import { Role, UserEntity, UserStatus } from '../../domain/entities/user.entity';

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

    return {
      id: primitives.id,
      username: primitives.username,
      email: primitives.email,
      name: primitives.name,
      lastName: primitives.lastName,
      role: primitives.role,
      status: primitives.status,
      avatarUrl: primitives.photoProfile ?? null,
      createdAt: primitives.createdAt,
      updatedAt: primitives.updatedAt,
    };
  }

  many(users: UserEntity[]): UserResponse[] {
    return users.map((user) => this.one(user));
  }
}
