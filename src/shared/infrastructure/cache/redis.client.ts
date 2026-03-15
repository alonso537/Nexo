import Redis from 'ioredis';
import { env } from '../../../config/env';
import { logger } from '../logger/logger';

const isTest = env.NODE_ENV === 'test';

export const redisClient = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: isTest ? 0 : 3,
  enableOfflineQueue: !isTest,
});

redisClient.on('connect', () => logger.info('Connected to Redis'));
redisClient.on('error', (err) => {
  if (isTest) return;
  logger.error({ err }, 'Redis error');
});

// Opciones de conexión para BullMQ (no puede reutilizar el cliente de ioredis directamente)
export const redisConnectionOptions = {
  host: redisClient.options.host ?? '127.0.0.1',
  port: redisClient.options.port ?? 6379,
  password: redisClient.options.password,
  db: redisClient.options.db ?? 0,
  // En test: sin reintentos y sin cola offline para que falle rápido y no cuelgue
  maxRetriesPerRequest: isTest ? 0 : null,
  enableOfflineQueue: !isTest,
  lazyConnect: true,
};
