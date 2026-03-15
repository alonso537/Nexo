import { EmailJobPayload, QueuePort } from "../../domain/ports/queue.port";
import { emailQueue } from "./email.queue";


export class EmailQueueAdapter implements QueuePort {
    async addEmailJob(payload: EmailJobPayload): Promise<void> {
        await emailQueue.add(payload.type, payload)
    }
}