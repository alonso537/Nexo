import { z } from 'zod';

export const RegisterUserSchema = z.object({
  body: z.object({
    username: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(
        /^[a-z0-9_-]+$/i,
        'Username can only contain letters, numbers, underscores and hyphens',
      ),
    email: z.email(),
    password: z.string().min(6).max(128),
  }),
});

export type RegisterUserDto = z.infer<typeof RegisterUserSchema.shape.body>;
