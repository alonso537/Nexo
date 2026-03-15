import { Worker } from 'bullmq';
import { EmailJobPayload } from '../../domain/ports/queue.port';
import { logger } from '../logger/logger';
import { redisConnectionOptions } from '../cache/redis.client';
import { env } from '../../../config/env';
import { ResendAdapter } from '../../../modules/user/infrastructure/email/resend.adapter';

const mailer = new ResendAdapter();

// En test no levantamos el worker para evitar conexiones reales a Redis
export const emailWorker =
  env.NODE_ENV === 'test'
    ? null
    : new Worker(
        'emails',
        async (job) => {
          const { type, to, token } = job.data as EmailJobPayload;
          if (type === 'verification') {
            await mailer.sendVerificationEmail(to, token);
          } else if (type === 'password-reset') {
            await mailer.sendPasswordResetEmail(to, token);
          }
          logger.info({ jobId: job.id, type }, 'Email job completed');
        },
        {
          connection: redisConnectionOptions,
          concurrency: 5,
          stalledInterval: 60000,
          maxStalledCount: 2,
          lockDuration: 60000,
        },
      );

emailWorker?.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Email job failed');
});

emailWorker?.on('error', (err) => {
  logger.error({ err }, 'Email worker error');
});
