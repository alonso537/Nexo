import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const id = (req.headers['x-request-id'] as string) || randomUUID();
  req.headers['x-request-id'] = id;
  res.setHeader('x-request-id', id);
  next();
};
