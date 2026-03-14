import { z } from 'zod';

export const ResendVerificationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').min(1, 'Email is required'),
  }),
});

export type ResendVerificationDTO = z.infer<typeof ResendVerificationSchema>['body'];
