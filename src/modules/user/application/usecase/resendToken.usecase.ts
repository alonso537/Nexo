import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { ResendVerificationDTO } from '../dto/resendToken.dto';

export class ResendVerificationUsecase {
  constructor(private userRep: UserrepositoryDomain) {}

  async execute({ email }: ResendVerificationDTO): Promise<void> {
    const user = await this.userRep.findByEmail(email);

    if (!user) return; // silencioso por seguridad

    user.regenerateVerificationToken();

    // TODO: reenviar correo

    await this.userRep.save(user);
  }
}
