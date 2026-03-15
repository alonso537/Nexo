import { AppError } from '../../../../shared/domain/errors/AppError';
import { CachePort } from '../../../../shared/domain/ports/cache.port';
import { UserEntity, Role } from '../../domain/entities/user.entity';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { StatusBlockDTO } from '../dto/statusBlock.dto';

export class BlockUsecase {
  constructor(
    private readonly userRep: UserrepositoryDomain,
    private readonly cache: CachePort,
  ) {}

  async execute({ id, reason }: StatusBlockDTO, requesterRole: Role): Promise<UserEntity> {
    const user = await this.userRep.findById(id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    const username = user.toPersistence().username as string;

    const targetRole = user.toPersistence().role;
    if (requesterRole === 'ADMIN' && (targetRole === 'ADMIN' || targetRole === 'SUPER_ADMIN')) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    const wasBlocked = user.status === 'BLOCKED';
    user.block(reason);
    if (!wasBlocked) user.incrementTokenVersion();
    await this.userRep.save(user);

    try {
      await this.cache.del(`user:slug:${username}`);
    } catch {
      // Redis unavailable — cache invalidation is best-effort
    }

    return user;
  }
}
