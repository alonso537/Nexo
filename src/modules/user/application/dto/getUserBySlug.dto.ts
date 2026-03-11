import {z} from 'zod';

export const GetUserBySlugSchema = z.object({
    params: z.object({
        username: z.string().trim().min(2, 'Username must be at least 2 characters').max(50, 'Username must be at most 50 characters')
    })
})

export type GetUserBySlugDTO = z.infer<typeof GetUserBySlugSchema>['params']