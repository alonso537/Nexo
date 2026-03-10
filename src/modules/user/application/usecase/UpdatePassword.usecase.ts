import { AppError } from "../../../../shared/domain/errors/AppError";
import { UserEntity } from "../../domain/entities/user.entity";
import { PasswordPort } from "../../domain/ports/password.port";
import { UserrepositoryDomain } from "../../domain/repositories/userRepository.domain";
import { UpdatePasswordDTO } from "../dto/updatePassword.dto";


export class UpdatePasswordUsecase {
    constructor(private readonly userRep: UserrepositoryDomain, private readonly passwordPort:PasswordPort) {
        
    }

    async execute(userId:string, {currentPassword, newPassword}:UpdatePasswordDTO):Promise<UserEntity> {
        const user = await this.userRep.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        const match = await this.passwordPort.compare(currentPassword, user.toPersistence().passwordHash);

        if (!match) {
            throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
        }

        const isEqual = currentPassword === newPassword;

        if (isEqual) {
            throw new AppError('New password must be different from the current password', 400, 'PASSWORDS_MUST_BE_DIFFERENT');
        }

        const hashedPassword = await this.passwordPort.hash(newPassword);

        user.changePassword(hashedPassword);
        await this.userRep.save(user);
        return user;


    }
}