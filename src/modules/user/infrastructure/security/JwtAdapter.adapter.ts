import jwt, { JsonWebTokenError, SignOptions, TokenExpiredError } from 'jsonwebtoken';
import { env } from '../../../../config/env';
import { AppError } from '../../../../shared/domain/errors/AppError';
import { TokenPayload, TokenPort } from '../../domain/ports/token.port';

export class JwtAdapter implements TokenPort {
  sign(payload: object, expiresIn?: string | number): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        env.JWT_ACCESS_SECRET,
        { expiresIn: expiresIn ?? env.JWT_ACCESS_TTL } as SignOptions,
        (err, token) => {
          if (err || !token) return reject(new AppError('Failed to sign token', 500, 'TOKEN_SIGN_ERROR'));
          resolve(token);
        },
      );
    });
  }

  verify<T extends TokenPayload = TokenPayload>(token: string): Promise<T> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, env.JWT_ACCESS_SECRET, (err, decoded) => {
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
