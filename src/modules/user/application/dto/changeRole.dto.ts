import { z } from 'zod';

export const ChangeRoleSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    role: z.enum(['ADMIN', 'USER', 'SUPPORT']),
  }),
});

// Para endpoints accesibles por ADMIN: no puede asignar rol ADMIN (evita escalación de privilegios)
export const ChangeRoleLimitedSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    role: z.enum(['USER', 'SUPPORT']),
  }),
});

export type ChangeRoleDTO = z.infer<typeof ChangeRoleSchema>['body'] &
  z.infer<typeof ChangeRoleSchema>['params'];
