import { AppError } from "../../../../shared/domain/errors/AppError";
import { UserEntity } from "../../domain/entities/user.entity";
import { Role } from "../../domain/entities/user.entity";
import { UserrepositoryDomain } from "../../domain/repositories/userRepository.domain";
import { StatusBlockDTO } from "../dto/statusBlock.dto";


export class BlockUsecase {
    constructor(
        private readonly userRep: UserrepositoryDomain
    ) {}

    async execute({ id, reason }: StatusBlockDTO, requesterRole: Role): Promise<UserEntity> {
        const user = await this.userRep.findById(id);
        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        const targetRole = user.toPersistence().role;
        if (requesterRole === 'ADMIN' && (targetRole === 'ADMIN' || targetRole === 'SUPER_ADMIN')) {
            throw new AppError('Forbidden', 403, 'FORBIDDEN');
        }

        user.block(reason);
        await this.userRep.save(user);
        return user;
    }
}