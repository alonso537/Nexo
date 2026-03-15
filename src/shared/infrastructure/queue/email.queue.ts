import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../cache/redis.client';

export const emailQueue = new Queue('emails', {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3, // 3 intentos si falla
    backoff: { type: 'exponential', delay: 5000 }, // espera 5s, 10s, 20s
    removeOnComplete: true,
    removeOnFail: 100, // guarda últimos 100 jobs fallidos
  },
});
