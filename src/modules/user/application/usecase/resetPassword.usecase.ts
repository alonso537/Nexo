import { AppError } from "../../../../shared/domain/errors/AppError";
import { PasswordPort } from "../../domain/ports/password.port";
import { UserrepositoryDomain } from "../../domain/repositories/userRepository.domain";
import { ResetPasswordDTO } from "../dto/resetPassword.dto";


export class ResetPasswordUsecase {
    constructor(
        private readonly userRep: UserrepositoryDomain,
        private readonly passwordPort: PasswordPort,
    ){}

    async execute({ token, newPassword }: ResetPasswordDTO): Promise<void> {
        const user = await this.userRep.findByPasswordResetToken(token);

        if (!user) {
            throw new AppError('Invalid or expired password reset token', 404, 'TOKEN_INVALID');
        }

        

        const newPasswordHash = await this.passwordPort.hash(newPassword);
        user.updatePassword(newPasswordHash, token);

        await this.userRep.save(user);
    }
}