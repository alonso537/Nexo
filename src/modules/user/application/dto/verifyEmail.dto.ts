
import {z} from 'zod';

export const verifyEmailSchema = z.object({
    query: z.object({
        token: z.string().min(1, 'Token is required')
    })
})

export type VerifyEmailDTO = z.infer<typeof verifyEmailSchema>['query']