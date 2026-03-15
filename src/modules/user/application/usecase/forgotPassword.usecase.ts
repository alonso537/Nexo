import { QueuePort } from '../../../../shared/domain/ports/queue.port';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { ForgotPasswordDTO } from '../dto/forgotPassword.dto';

export class ForgotPasswordUsecase {
  constructor(
    private readonly userRep: UserrepositoryDomain,
    private readonly mailPort: QueuePort,
  ) {}

  async execute({ email }: ForgotPasswordDTO): Promise<void> {
    const user = await this.userRep.findByEmail(email);

    if (!user) {
      return; // For security, we don't reveal whether the email exists
    }

    user.generatePasswordResetToken();

    await this.userRep.save(user);
    await this.mailPort.addEmailJob({
      type: 'password-reset',
      to: email,
      token: (user.toPersistence()!.passwordResetToken as {value:string}).value
    })
  }
}
