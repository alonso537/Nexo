
import { NextFunction, Request, Response } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { env } from '../../../../../config/env';
import { AppError } from '../../../../domain/errors/AppError';

export interface AuthPayload {
  sub: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
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
