import Redis from 'ioredis';
import { env } from '../../../config/env';
import { logger } from '../logger/logger';

export const redisClient = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: env.NODE_ENV === 'test' ? 0 : 3,
  enableOfflineQueue: env.NODE_ENV !== 'test',
});

redisClient.on('connect', () => logger.info('Connected to Redis'));
redisClient.on('error', (err) => {
  // En test solo logueamos, no propagamos el error para no romper los tests e2e
  if (env.NODE_ENV === 'test') return;
  logger.error({ err }, 'Redis error');
});

export const redisConnectionOptions = {
  host: redisClient.options.host ?? '127.0.0.1',
  port: redisClient.options.port ?? 6379,
  password: redisClient.options.password,
  db: redisClient.options.db,
}
