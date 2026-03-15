import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { openapi } from './shared/infrastructure/http/docs/swagger';
import { RedisStore, RedisReply } from 'rate-limit-redis';
import { redisClient } from './shared/infrastructure/cache/redis.client';

import { env } from './config/env';
import { errorMiddleware } from './shared/infrastructure/errors/errorMiddleware';
import { requestId } from './shared/infrastructure/http/express/middleware/requestId.middleware';
//rutas
import { authRoutes } from './modules/user/infrastructure/http/routes/auth.routes';
import { userRoutes } from './modules/user/infrastructure/http/routes/user.routes';

import type { Express } from 'express';

const makeRedisStore = (prefix: string) => {
  if (env.NODE_ENV === 'test') return undefined;
  return new RedisStore({
    prefix, // prefijo único por limiter para evitar ERR_ERL_DOUBLE_COUNT
    sendCommand: (...args: [string, ...string[]]) =>
      redisClient.call(...args) as unknown as Promise<RedisReply>,
  });
};

export const createApp = (): Express => {
  const app = express();

  // Trust Railway's reverse proxy so express-rate-limit can read X-Forwarded-For correctly
  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(requestId);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS.split(','),
      methods: env.CORS_METHODS.split(','),
      credentials: env.CORS_CREDENTIALS,
    }),
  );
  app.use(express.json());
  app.use(cookieParser(env.SECRET));

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'test' ? 10000 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeRedisStore('rl:global:'),
    message: {
      status: 'error',
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please try again later.',
    },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'test' ? 1000 : 10,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeRedisStore('rl:auth:'),
    message: {
      status: 'error',
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many attempts, please try again later.',
    },
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));

  app.get('/health', (_req, res) => {
    res.status(200).json({ message: 'OK' });
  });

  // Rutas de auth usan solo authLimiter (más estricto)
  app.use('/api/auth', authLimiter, authRoutes);

  // Rutas de user usan solo globalLimiter
  app.use('/api/user', globalLimiter, userRoutes);

  app.use(errorMiddleware);

  return app;
};
