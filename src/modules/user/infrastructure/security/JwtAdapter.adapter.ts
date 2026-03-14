import jwt, { JsonWebTokenError, SignOptions, TokenExpiredError } from 'jsonwebtoken';
import { env } from '../../../../config/env';
import { AppError } from '../../../../shared/domain/errors/AppError';
import { TokenPayload, TokenPort } from '../../domain/ports/token.port';

export class JwtAdapter implements TokenPort {
  sign(
    payload: object,
    expiresIn?: string | number,
    tokenType: 'access' | 'refresh' = 'access',
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const secret = tokenType === 'refresh' ? env.JWT_REFRESH_SECRET : env.JWT_ACCESS_SECRET;
      jwt.sign(
        payload,
        secret,
        { expiresIn: expiresIn ?? env.JWT_ACCESS_TTL } as SignOptions,
        (err, token) => {
          if (err || !token)
            return reject(new AppError('Failed to sign token', 500, 'TOKEN_SIGN_ERROR'));
          resolve(token);
        },
      );
    });
  }

  verify<T extends TokenPayload = TokenPayload>(
    token: string,
    tokenType: 'access' | 'refresh' = 'access',
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const secret = tokenType === 'refresh' ? env.JWT_REFRESH_SECRET : env.JWT_ACCESS_SECRET;
      jwt.verify(token, secret, (err, decoded) => {
        if (err instanceof TokenExpiredError) {
          return reject(new AppError('Token has expired', 401, 'TOKEN_EXPIRED'));
        }
        if (err instanceof JsonWebTokenError) {
          return reject(new AppError('Invalid token', 401, 'TOKEN_INVALID'));
        }
        if (err || !decoded) {
          return reject(new AppError('Token verification failed', 401, 'TOKEN_INVALID'));
        }
        resolve(decoded as T);
      });
    });
  }
}
