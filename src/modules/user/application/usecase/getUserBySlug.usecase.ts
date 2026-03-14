import { UserEntity } from '../../domain/entities/user.entity';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { GetUserBySlugDTO } from '../dto/getUserBySlug.dto';
import { AppError } from '../../../../shared/domain/errors/AppError';

export class GetUserBySlugUsecase {
  constructor(private readonly userRep: UserrepositoryDomain) {}

  async execute({ username }: GetUserBySlugDTO): Promise<UserEntity> {
    const user = await this.userRep.findByUsername(username);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return user;
  }
}
