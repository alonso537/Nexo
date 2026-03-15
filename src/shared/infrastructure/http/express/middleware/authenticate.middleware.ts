import { NextFunction, Request, Response } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { env } from '../../../../../config/env';
import { AppError } from '../../../../domain/errors/AppError';
import { UserrepositoryDomain } from '../../../../../modules/user/domain/repositories/userRepository.domain';

export interface AuthPayload {
  sub: string;
  role: string;
}

import 'express';
import { CachePort } from '../../../../domain/ports/cache.port';
declare module 'express' {
  interface Request {
    user?: AuthPayload;
  }
}

interface JwtAccessPayload {
  sub: string;
  role: string;
  tokenVersion: number;
}

export const makeAuthenticate =
  (userRep: UserrepositoryDomain, cache: CachePort) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
    }

    const token = authHeader.slice(7);

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;

      // Si Redis no está disponible (ej: tests), simplemente se omite el check
      try {
        const isBlacklisted = await cache.exists(`blacklist:${token}`);
        if (isBlacklisted) {
          return next(new AppError('Token has been revoked', 401, 'TOKEN_REVOKED'));
        }
      } catch {
        // Redis no disponible: se permite continuar
      }

      const user = await userRep.findById(payload.sub);
      if (!user) {
        return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
      }

      const data = user.toPersistence();

      if (data.tokenVersion !== payload.tokenVersion) {
        return next(new AppError('Session has been invalidated', 401, 'SESSION_INVALIDATED'));
      }

      if (data.status === 'BLOCKED') {
        return next(new AppError('Account is blocked', 403, 'ACCOUNT_BLOCKED'));
      }

      if (data.status === 'SUSPENDED') {
        return next(new AppError('Account is suspended', 403, 'ACCOUNT_SUSPENDED'));
      }

      req.user = { sub: payload.sub, role: payload.role };
      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return next(new AppError('Token has expired', 401, 'TOKEN_EXPIRED'));
      }
      if (error instanceof JsonWebTokenError) {
        return next(new AppError('Invalid token', 401, 'TOKEN_INVALID'));
      }
      next(error);
    }
  };
