import { AppError } from '../../../../shared/domain/errors/AppError';
import { CachePort } from '../../../../shared/domain/ports/cache.port';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { UpdateNameDTO } from '../dto/updateName.dto';

export class UpdateNameUsecase {
  constructor(
    private readonly userRep: UserrepositoryDomain,
    private readonly cache: CachePort,
  ) {}

  async execute(userId: string, { name }: UpdateNameDTO): Promise<UserEntity> {
    const user = await this.userRep.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    const username = user.toPersistence().username as string;

    user.updateName(name);
    await this.userRep.save(user);

    try {
      await this.cache.del(`user:slug:${username}`);
    } catch {}

    return user;
  }
}
