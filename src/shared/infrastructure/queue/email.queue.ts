import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../cache/redis.client';

export const emailQueue = new Queue('emails', {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});
