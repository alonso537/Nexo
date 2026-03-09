import { AppError } from '../../../../shared/domain/errors/AppError';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';

export class GetmeUserUsecase {
  constructor(private readonly userRep: UserrepositoryDomain) {}

  async execute(id: string): Promise<UserEntity> {
    const user = await this.userRep.findById(id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.status === 'BLOCKED') {
      throw new AppError('Your account has been blocked', 403, 'USER_BLOCKED');
    }

    return user;
  }
}
