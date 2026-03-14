import { z } from 'zod';

export const ChangeStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

export type ChangeStatusDTO = z.infer<typeof ChangeStatusSchema>['params'];
