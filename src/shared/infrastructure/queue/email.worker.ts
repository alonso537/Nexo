import { Worker } from 'bullmq';
import { NodemailerAdapter } from '../../../modules/user/infrastructure/email/nodemailer.adapter';
import { EmailJobPayload } from '../../domain/ports/queue.port';
import { logger } from '../logger/logger';
import { redisConnectionOptions } from '../cache/redis.client';

const mailer = new NodemailerAdapter();

export const emailWorker = new Worker(
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
    concurrency: 5, // Procesa hasta 5 emails en paralelo
  },
);

emailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Email job failed');
});
