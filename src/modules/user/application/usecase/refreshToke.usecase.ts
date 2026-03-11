import { env } from "../../../../config/env";
import { AppError } from "../../../../shared/domain/errors/AppError";
import { TokenPort } from "../../domain/ports/token.port";
import { UserrepositoryDomain } from "../../domain/repositories/userRepository.domain";


interface RefreshTokenPayload {
    sub: string;
    role: string;
    type: string;
    tokenVersion: number;
    [key: string]: unknown;
}

export class RefreshTokenUsecase {
    constructor(
        private readonly userRep: UserrepositoryDomain,
        private readonly tokenPort: TokenPort,
    ){}

    async execute(refreshToken:string) :Promise<{accessToken: string}>{
        let payload: RefreshTokenPayload;

        try {
            payload = (await this.tokenPort.verify<RefreshTokenPayload>(refreshToken));
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Invalid refresh token', 401, 'TOKEN_INVALID');
        }

        if(payload.type !== 'refresh') {
            throw new AppError('Invalid token type', 400, 'INVALID_TOKEN_TYPE');
        }

        const user = await this.userRep.findById(payload.sub);
        if (!user) {
            throw new AppError('Invalid credentials', 401, 'AUTH_ERROR');
        }

        if (user.status === 'BLOCKED') {
            throw new AppError('Invalid credentials', 401, 'AUTH_ERROR');
        }

        const data = user.toPersistence();

        if (payload.tokenVersion !== data.tokenVersion) {
            throw new AppError('Token has been revoked', 401, 'TOKEN_REVOKED');
        }

        const accessToken = await this.tokenPort.sign(
            { sub: data.id, role: data.role, tokenVersion: data.tokenVersion },
            env.JWT_ACCESS_TTL,
        );

        return { accessToken };
    }
}