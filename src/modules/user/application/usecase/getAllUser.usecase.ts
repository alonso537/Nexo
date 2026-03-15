import { UserEntity } from '../../domain/entities/user.entity';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { FilterUsersDto } from '../dto/filterUsers.dto';
import { CachePort } from '../../../../shared/domain/ports/cache.port';

const TTL = 60 * 2; // 2 minutos

export class GetAllUsersUsecase {
  constructor(
    private readonly userRep: UserrepositoryDomain,
    private readonly cache: CachePort,
  ) {}

  async execute(filters: FilterUsersDto): Promise<{
    data: UserEntity[];
    total: number;
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    const cacheKey = `users:all:${JSON.stringify(filters)}`;

    try {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          ...parsed,
          // reconstruimos UserEntity[] para que el presenter pueda llamar toPrimitives()
          data: parsed.data.map((u: Parameters<typeof UserEntity.fromPrimitives>[0]) =>
            UserEntity.fromPrimitives(u)
          ),
        };
      }
    } catch { /* Redis no disponible */ }

    const { users, total } = await this.userRep.findAll(filters);
    const totalPages = Math.ceil(total / (filters.limit || 10));
    const page = filters.page || 1;

    const result = {
      data: users,
      total,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    try {
      const serializable = {
        ...result,
        data: users.map((u) => u.toPersistence()), // guardamos primitivos en Redis
      };
      await this.cache.set(cacheKey, JSON.stringify(serializable), TTL);
    } catch { /* Redis no disponible */ }

    return result;
  }
}