import { EmailJobPayload, QueuePort } from '../../domain/ports/queue.port';
import { emailQueue } from './email.queue';
import { env } from '../../../config/env';

export class EmailQueueAdapter implements QueuePort {
  async addEmailJob(payload: EmailJobPayload): Promise<void> {
    // En test no intentamos encolar — Redis no está disponible
    if (env.NODE_ENV === 'test') return;

    try {
      await emailQueue.add(payload.type, payload);
    } catch {
      // Queue unavailable — email job dropped, worker retries are not available
    }
  }
}
