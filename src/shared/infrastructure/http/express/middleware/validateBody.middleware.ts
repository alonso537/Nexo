import { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ParsedQs } from 'qs';
import { ZodError, ZodSchema } from 'zod';
import { AppError } from '../../../../domain/errors/AppError';

interface ParsedRequest {
  body?: Record<string, unknown>;
  query?: ParsedQs;
  params?: Record<string, string>;
}

export const validate =
  (schema: ZodSchema): RequestHandler =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as ParsedRequest;

      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) {
        for (const key of Object.keys(req.query)) {
          delete (req.query as Record<string, unknown>)[key];
        }
        Object.assign(req.query, parsed.query);
      }
      if (parsed.params !== undefined) {
        for (const key of Object.keys(req.params)) {
          delete (req.params as Record<string, unknown>)[key];
        }
        Object.assign(req.params, parsed.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new AppError('Validation error', 400, 'VALIDATION_ERROR', {
            issues: error.flatten().fieldErrors,
          }),
        );
      }
      next(error);
    }
  };
