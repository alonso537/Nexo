import {z} from 'zod';

export const UpdateUsernameSchema = z.object({
    body: z.object({
        username: z.string().min(2, 'Username must be at least 2 characters').max(50, 'Username must be at most 50 characters')
    })
})

export type UpdateUsernameDTO = z.infer<typeof UpdateUsernameSchema>['body']