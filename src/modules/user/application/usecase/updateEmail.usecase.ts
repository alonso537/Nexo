import { AppError } from '../../../../shared/domain/errors/AppError';
import { CachePort } from '../../../../shared/domain/ports/cache.port';
import { QueuePort } from '../../../../shared/domain/ports/queue.port';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { UpdateEmailDTO } from '../dto/updateEmail.dto';

export class UpdateEmailUsecase {
  constructor(
    private readonly userRep: UserrepositoryDomain,
    private readonly mailPort: QueuePort,
    private readonly cache: CachePort,
  ) {}

  async execute(userid: string, { newEmail }: UpdateEmailDTO): Promise<UserEntity> {
    const user = await this.userRep.findById(userid);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const existingUserByEmail = await this.userRep.findByEmail(newEmail);
    if (existingUserByEmail && existingUserByEmail.toPersistence().id !== userid) {
      throw new AppError('Email already in use', 400, 'EMAIL_IN_USE');
    }
    const username = user.toPersistence().username as string;

    user.updateEmail(newEmail);
    await this.userRep.save(user);
    await this.mailPort.addEmailJob({
      type: 'verification',
      to: newEmail,
      token: user.getVerificationTokenValue()!,
    });

    try {
      await this.cache.del(`user:slug:${username}`);
    } catch {
      // Redis unavailable — cache invalidation is best-effort
    }

    return user;
  }
}
