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

// En test no se usa RedisStore para evitar dependencia de Redis en los tests
const makeRedisStore = () => {
  if (env.NODE_ENV === 'test') return undefined;
  return new RedisStore({
    sendCommand: (...args: [string, ...string[]]) =>
      redisClient.call(...args) as unknown as Promise<RedisReply>,
  });
};

export const createApp = (): Express => {
  const app = express();

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

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: env.NODE_ENV === 'test' ? 10000 : 100,
      standardHeaders: true,
      legacyHeaders: false,
      store: makeRedisStore(), // undefined en test → usa store en memoria por defecto
      message: {
        status: 'error',
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests, please try again later.',
      },
    }),
  );

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'test' ? 1000 : 10,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeRedisStore(), // undefined en test → usa store en memoria por defecto
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

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/user', userRoutes);

  app.use(errorMiddleware);

  return app;
};
