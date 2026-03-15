import { CachePort } from '../../domain/ports/cache.port';
import { redisClient } from './redis.client';

export class RedisAdapter implements CachePort {
  async get(key: string): Promise<string | null> {
    return redisClient.get(key);
  }
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await redisClient.set(key, value, 'EX', ttlSeconds);
    } else {
      await redisClient.set(key, value);
    }
  }
  async del(key: string): Promise<void> {
    await redisClient.del(key);
  }
  async exists(key: string): Promise<boolean> {
    const result = await redisClient.exists(key);
    return result === 1;
  }
}
