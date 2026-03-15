import { AppError } from '../../../../shared/domain/errors/AppError';
import { CachePort } from '../../../../shared/domain/ports/cache.port';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { UpdateUsernameDTO } from '../dto/updateUsername.dto';

export class UpdateUsernameUsecase {
  constructor(
    private readonly userRep: UserrepositoryDomain,
    private readonly cache: CachePort,
  ) {}

  async execute(userId: string, { username }: UpdateUsernameDTO): Promise<UserEntity> {
    const user = await this.userRep.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const existingUserByUsername = await this.userRep.findByUsername(username);
    
    if (existingUserByUsername) {
      if (existingUserByUsername.toPersistence().id === userId) return user;
      throw new AppError('Username already in use', 400, 'USERNAME_IN_USE');
    }
    const oldUsername = user.toPersistence().username;

    user.updateUserName(username);
    await this.userRep.save(user);

    try {
      await this.cache.del(`user:slug:${oldUsername}`);
      await this.cache.del(`user:slug:${username}`);
    } catch {}

    return user;
  }
}
