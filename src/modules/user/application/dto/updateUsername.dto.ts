import {z} from 'zod';

export const UpdateUsernameSchema = z.object({
    body: z.object({
        username: z.string().trim().min(3, 'Username must be at least 3 characters').max(30, 'Username must be at most 30 characters').regex(/^[a-z0-9_-]+$/i, 'Username can only contain letters, numbers, underscores and hyphens')
    })
})

export type UpdateUsernameDTO = z.infer<typeof UpdateUsernameSchema>['body']