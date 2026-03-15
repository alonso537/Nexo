import { AppError } from '../../../../shared/domain/errors/AppError';
import { CachePort } from '../../../../shared/domain/ports/cache.port';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { UpdateLastNameDTO } from '../dto/updateLastName.dto';

export class UpdateLastNameUsecase {
  constructor(
    private readonly userRep: UserrepositoryDomain,
    private readonly cache: CachePort,
  ) {}

  async execute(userId: string, { lastName }: UpdateLastNameDTO): Promise<UserEntity> {
    const user = await this.userRep.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    const username = user.toPersistence().username as string;

    user.updateLastName(lastName);
    await this.userRep.save(user);

    try {
      await this.cache.del(`user:slug:${username}`);
    } catch {
      // Redis unavailable — cache invalidation is best-effort
    }

    return user;
  }
}
