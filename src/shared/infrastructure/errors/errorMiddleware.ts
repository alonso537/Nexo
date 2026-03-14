import type { ErrorRequestHandler } from 'express';
import { AppError } from '../../domain/errors/AppError';
import { logger } from '../logger/logger';

export const errorMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
  const isAppError = err instanceof AppError;
  const status = isAppError ? err.statusCode : 500;
  const isDev = process.env.NODE_ENV === 'development';

  if (!isAppError) {
    logger.error(`[ERROR] ${req.method} ${req.path} ->`, err);
  } else if (status >= 500) {
    logger.error(`[APP_ERROR] ${err.code}: ${err.message}`);
  }

  const payload = {
    status: 'error',
    code: isAppError ? err.code : 'INTERNAL_SERVER_ERROR',
    message: isAppError || isDev ? err.message : 'Algo salió muy mal en nuestros servidores',
    requestId: req.headers['x-request-id'] || null,
    details: isAppError ? err.details : undefined,
    stack: isDev ? err.stack : undefined,
  };

  res.status(status).json(payload);
};
