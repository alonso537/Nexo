import { MailerPort } from '../../domain/ports/mailer.port';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { ResendVerificationDTO } from '../dto/resendToken.dto';

export class ResendVerificationUsecase {
  constructor(
    private userRep: UserrepositoryDomain,
    private readonly mailPort: MailerPort,
  ) {}

  async execute({ email }: ResendVerificationDTO): Promise<void> {
    const user = await this.userRep.findByEmail(email);

    if (!user) return; // silencioso por seguridad

    user.regenerateVerificationToken();

    await this.userRep.save(user);
    await this.mailPort.sendVerificationEmail(
      user.toPersistence().email,
      user.toPersistence().verificationToken!.value,
    );
  }
}
