import { Worker } from 'bullmq';
import { NodemailerAdapter } from '../../../modules/user/infrastructure/email/nodemailer.adapter';
import { EmailJobPayload } from '../../domain/ports/queue.port';
import { logger } from '../logger/logger';
import { redisConnectionOptions } from '../cache/redis.client';
import { env } from '../../../config/env';

const mailer = new NodemailerAdapter();

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
          // Increase stall time to prevent UnrecoverableError on slow SMTP connections
          stalledInterval: 60000,  // check stalled jobs every 60s (default: 30s)
          maxStalledCount: 2,      // allow 2 stalls before marking as failed (default: 1)
          lockDuration: 60000,     // job lock duration 60s (default: 30s)
        },
      );

emailWorker?.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Email job failed');
});

emailWorker?.on('error', (err) => {
  logger.error({ err }, 'Email worker error');
});
