import { AppError } from "../../../../shared/domain/errors/AppError";
import { UserrepositoryDomain } from "../../domain/repositories/userRepository.domain";


export class LogoutUsecase {
    constructor(private readonly userRep:UserrepositoryDomain) {}

    async execute(userId: string): Promise<void> {
        const user = await this.userRep.findById(userId);

        if(!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        user.incrementTokenVersion();

        await this.userRep.save(user);
    }
}