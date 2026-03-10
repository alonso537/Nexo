import { AppError } from "../../../../shared/domain/errors/AppError";
import { UserEntity } from "../../domain/entities/user.entity";
import { UserrepositoryDomain } from "../../domain/repositories/userRepository.domain";
import { ChangeRoleDTO } from "../dto/changeRole.dto";


export class ChangeRoleUsecase {
    constructor(
        private readonly userRep: UserrepositoryDomain
    ) {}

    async execute({ id, role }: ChangeRoleDTO): Promise<UserEntity> {
        const user = await this.userRep.findById(id);

        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        user.changeRole(role);
        await this.userRep.save(user);
        return user;
    }
}