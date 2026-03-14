import { UserEntity } from '../../domain/entities/user.entity';
import { UserrepositoryDomain } from '../../domain/repositories/userRepository.domain';
import { FilterUsersDto } from '../dto/filterUsers.dto';

export class GetAllUsersUsecase {
  constructor(private readonly userRep: UserrepositoryDomain) {}

  async execute(filters: FilterUsersDto): Promise<{
    data: UserEntity[];
    total: number;
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    const { users, total } = await this.userRep.findAll(filters);
    const totalPages = Math.ceil(total / (filters.limit || 10));
    const hasNextPage = filters.page ? filters.page < totalPages : false;
    const hasPreviousPage = filters.page ? filters.page > 1 : false;
    const page = filters.page || 1;

    return {
      data: users,
      total,
      page,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }
}
