import { AppError } from "../../../../shared/domain/errors/AppError";
import { UserEntity } from "../../domain/entities/user.entity";
import { UserrepositoryDomain } from "../../domain/repositories/userRepository.domain";
import { UpdateNameDTO } from "../dto/updateName.dto";



export class UpdateNameUsecase {
    constructor(private readonly userRep: UserrepositoryDomain) {}

    async execute(userId:string, {name}:UpdateNameDTO):Promise<UserEntity>{
        const user = await this.userRep.findById(userId)

        if(!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        user.updateName(name);
        await this.userRep.save(user);
        return user;

    }
}