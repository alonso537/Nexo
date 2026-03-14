import { z } from 'zod';

export const LoginUserSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(6).max(128),
  }),
});

export type LoginUserDto = z.infer<typeof LoginUserSchema.shape.body>;
