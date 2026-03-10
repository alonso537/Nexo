import {z} from 'zod';

export const UpdateLastNameSchema = z.object({
    body: z.object({
        lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be at most 50 characters')
    })
})

export type UpdateLastNameDTO = z.infer<typeof UpdateLastNameSchema>['body']