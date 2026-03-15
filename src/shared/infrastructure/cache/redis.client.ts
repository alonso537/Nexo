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

// BullMQ connection options — parsed directly from REDIS_URL for reliability
const parsed = new URL(env.REDIS_URL);

export const redisConnectionOptions = {
  host: parsed.hostname,
  port: parseInt(parsed.port, 10) || 6379,
  password: parsed.password || undefined,
  username: parsed.username || undefined,
  db: parseInt(parsed.pathname?.replace('/', '') || '0', 10),
  maxRetriesPerRequest: isTest ? 0 : null,
  enableOfflineQueue: !isTest,
  lazyConnect: true,
};
