import { z } from 'zod';

export const UpdateEmailSchema = z.object({
  body: z.object({
    newEmail: z.email(),
  }),
});

export type UpdateEmailDTO = z.infer<typeof UpdateEmailSchema>['body'];
