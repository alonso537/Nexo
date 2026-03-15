

export interface EmailJobPayload {
    type: 'verification' | 'password-reset';
    to: string;
    token: string;
}

export interface QueuePort {
    addEmailJob(payload: EmailJobPayload): Promise<void>;
}