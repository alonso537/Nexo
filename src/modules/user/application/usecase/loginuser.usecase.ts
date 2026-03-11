import { env } from '../../../../config/env';
import { AppError } from '../../../../shared/domain/errors/AppError';
import { PasswordPort } from '../../domain/ports/password.port';
import { TokenPort } from '../../domain/ports/token.port';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { LoginUserDto } from '../dto/loginUser.dto';

export class LoginuserUsecase {
  constructor(
    private readonly userRep: UserrepositoryDomain,
    private readonly tokenPort: TokenPort,
    private readonly passwordPort: PasswordPort,
  ) {}

  async execute({
    email,
    password,
  }: LoginUserDto): Promise<{ accessToken: string; refreshToken: string }> {
    const existingUser = await this.userRep.findByEmail(email);

    if (!existingUser) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    if (existingUser.status === 'BLOCKED') {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const data = existingUser.toPersistence();

    const match = await this.passwordPort.compare(password, data.passwordHash);

    if (!match) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenPort.sign({ sub: data.id, role: data.role, tokenVersion: data.tokenVersion }, env.JWT_ACCESS_TTL),
      this.tokenPort.sign(
        { sub: data.id, role: data.role, type: 'refresh', tokenVersion: data.tokenVersion },
        env.JWT_REFRESH_TTL,
      ),
    ]);

    existingUser.updateLastLogin();
    await this.userRep.save(existingUser);

    return { accessToken, refreshToken };
  }
}
