import { UserEntity } from '../../domain/entities/user.entity';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { GetUserBySlugDTO } from '../dto/getUserBySlug.dto';
import { AppError } from '../../../../shared/domain/errors/AppError';
import { CachePort } from '../../../../shared/domain/ports/cache.port';

const TTL = 60 * 5;

export class GetUserBySlugUsecase {
  constructor(
    private readonly userRep: UserrepositoryDomain,
    private readonly cache: CachePort,
  ) {}

  async execute({ username }: GetUserBySlugDTO): Promise<UserEntity> {
    const cacheKey = `user:slug:${username}`;

    try {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return UserEntity.fromPrimitives(JSON.parse(cached));
      }
    } catch {}

    const user = await this.userRep.findByUsername(username);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    try {
      await this.cache.set(cacheKey, JSON.stringify(user.toPersistence()), TTL);
    } catch {}
    return user;
  }
}
