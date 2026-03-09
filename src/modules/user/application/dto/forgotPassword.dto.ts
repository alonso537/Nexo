import {z} from 'zod';

export const ForgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address').min(1, 'Email is required')
    })
})

export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordSchema>['body']