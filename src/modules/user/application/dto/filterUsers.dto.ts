import {z} from 'zod';

export const FilterUsersSchema = z.object({
    query: z.object({
        username: z.string().trim().min(2, 'Username must be at least 2 characters').max(50, 'Username must be at most 50 characters').optional(),
        email: z.email().optional(),
        name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters').optional(),
        role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT']).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'BLOCKED']).optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(10),
        includeDeleted: z.boolean().default(false),
    })
})

export type FilterUsersDto = z.infer<typeof FilterUsersSchema>['query'];