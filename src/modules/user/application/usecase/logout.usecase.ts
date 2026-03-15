import { AppError } from '../../../../shared/domain/errors/AppError';
import { CachePort } from '../../../../shared/domain/ports/cache.port';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';

export class LogoutUsecase {
  constructor(
    private readonly userRep: UserrepositoryDomain,
    private readonly cachePort: CachePort,
  ) {}

  async execute(userId: string, accessToken?: string, accessTokenTtl?: number): Promise<void> {
    const user = await this.userRep.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    user.incrementTokenVersion();
    await this.userRep.save(user);

    // Blacklist del access token — si Redis no está disponible se omite sin romper el logout
    if (accessToken && accessTokenTtl) {
      try {
        await this.cachePort.set(`blacklist:${accessToken}`, 'true', accessTokenTtl);
      } catch {
        // Redis no disponible: el logout sigue siendo válido por tokenVersion
      }
    }
  }
}
