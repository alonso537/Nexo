import { AppError } from '../../../../shared/domain/errors/AppError';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { VerifyEmailDTO } from '../dto/verifyEmail.dto';

export class VerifyEmailUsecase {
  constructor(private readonly userRep: UserrepositoryDomain) {}

  async execute({ token }: VerifyEmailDTO): Promise<void> {
    const user = await this.userRep.findByVerificationToken(token);

    if (!user) {
      throw new AppError('Invalid or expired verification token', 404, 'TOKEN_INVALID');
    }

    user.activate(token);

    await this.userRep.save(user);
  }
}
