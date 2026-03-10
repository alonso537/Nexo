import { AppError } from '../../../../shared/domain/errors/AppError';
import { UserEntity } from '../../domain/entities/user.entity';
import { MailerPort } from '../../domain/ports/mailer.port';
import { PasswordPort } from '../../domain/ports/password.port';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { RegisterUserDto } from '../dto/registerUser.dto';

export class RegisterUserUsecase {
  constructor(
    private readonly userRep: UserrepositoryDomain,
    private readonly passwordPort: PasswordPort,
    private readonly mailPort: MailerPort,
  ) {}

  async execute({ email, password, username }: RegisterUserDto): Promise<UserEntity> {
    const [existingUserByEmail, existingUserByUsername] = await Promise.all([
      this.userRep.findByEmail(email),
      this.userRep.findByUsername(username),
    ]);

    if (existingUserByEmail) {
      throw new AppError('Email already in use', 400, 'EMAIL_IN_USE');
    }

    if (existingUserByUsername) {
      throw new AppError('Username already in use', 400, 'USERNAME_IN_USE');
    }

    const hashedpassword = await this.passwordPort.hash(password);

    const user = UserEntity.create(username, email, hashedpassword);

    await this.userRep.save(user);

    await this.mailPort.sendVerificationEmail(
      user.toPersistence().email,
      user.toPersistence().verificationToken!.value,
    );

    return user;
  }
}
