import { AppError } from '../../../../shared/domain/errors/AppError';
import { CachePort } from '../../../../shared/domain/ports/cache.port';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { ChangeRoleDTO } from '../dto/changeRole.dto';

export class ChangeRoleUsecase {
  constructor(
    private readonly userRep: UserrepositoryDomain,
    private readonly cache: CachePort,
  ) {}

  async execute({ id, role }: ChangeRoleDTO): Promise<UserEntity> {
    const user = await this.userRep.findById(id);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    const username = user.toPersistence().username as string;

    user.changeRole(role);
    await this.userRep.save(user);

    try {
      await this.cache.del(`user:slug:${username}`);
    } catch {
      // Redis unavailable — cache invalidation is best-effort
    }

    return user;
  }
}
