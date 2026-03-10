import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../../domain/errors/AppError';

export const IsSuperAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
  }

  next();
};

export const IsAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  }

  if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
    return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
  }

  next();
};
