import {z} from 'zod';

export const ResetPasswordSchema = z.object({
    body: z.object({
        newPassword: z.string().min(8, 'Password must be at least 8 characters long').max(100, 'Password must be at most 100 characters long'),
    }),
    query: z.object({
        token: z.string().min(1, 'Token is required')
    })
})

export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>['body'] & z.infer<typeof ResetPasswordSchema>['query']