import {z} from 'zod';

export const ResetPasswordSchema = z.object({
    body: z.object({
        newPassword: z.string().min(6, 'Password must be at least 6 characters long').max(128, 'Password must be at most 128 characters long'),
    }),
    query: z.object({
        token: z.string().min(1, 'Token is required')
    })
})

export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>['body'] & z.infer<typeof ResetPasswordSchema>['query']