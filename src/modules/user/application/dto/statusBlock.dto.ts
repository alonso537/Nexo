import { z } from 'zod';

export const StatusBlockSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    reason: z.string().min(1, 'Reason for blocking is required'),
  }),
});

export type StatusBlockDTO = z.infer<typeof StatusBlockSchema>['body'] &
  z.infer<typeof StatusBlockSchema>['params'];
