import {z} from 'zod';

export const UpdateEmailSchema = z.object({
    body: z.object({
        newEmail: z.string().email('Invalid email address').min(1, 'New email is required'),
    })
})

export type UpdateEmailDTO = z.infer<typeof UpdateEmailSchema>['body']