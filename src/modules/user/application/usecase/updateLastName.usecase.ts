import { AppError } from '../../../../shared/domain/errors/AppError';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { UpdateLastNameDTO } from '../dto/updateLastName.dto';

export class UpdateLastNameUsecase {
  constructor(private readonly userRep: UserrepositoryDomain) {}

  async execute(userId: string, { lastName }: UpdateLastNameDTO): Promise<UserEntity> {
    const user = await this.userRep.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    user.updateLastName(lastName);
    await this.userRep.save(user);
    return user;
  }
}
