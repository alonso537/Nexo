import { z } from 'zod';

export const UpdateNameSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be at most 50 characters'),
  }),
});

export type UpdateNameDTO = z.infer<typeof UpdateNameSchema>['body'];
