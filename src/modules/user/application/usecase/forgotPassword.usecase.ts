import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { ForgotPasswordDTO } from '../dto/forgotPassword.dto';

export class ForgotPasswordUsecase {
  constructor(private readonly userRep: UserrepositoryDomain) {}

  async execute({ email }: ForgotPasswordDTO): Promise<void> {
    const user = await this.userRep.findByEmail(email);

    if (!user) {
      return; // For security, we don't reveal whether the email exists
    }

    user.generatePasswordResetToken();

    //TODO: In the future, add email sending functionality here

    await this.userRep.save(user);
  }
}
