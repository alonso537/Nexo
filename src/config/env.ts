import {z} from 'zod';
import 'dotenv/config';

 const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(8000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    SECRET: z.string().min(1, 'SECRET environment variable is required'),
    MONGO_URI: z.string().min(1, 'MONGO_URI environment variable is required'),
    JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET environment variable is required'),
    JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET environment variable is required'),
    JWT_ACCESS_TTL: z.string().default('15m'), // formato: 15m, 1h, etc.
    JWT_REFRESH_TTL: z.string().default('7d'), // formato: 7d, 30d, etc.
    COOKIE_SECURE: z.coerce.boolean().default(false),
    COOKIE_DOMAIN: z.string().optional(),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    CORS_METHODS: z.string().default('GET,POST,PUT,PATCH,DELETE'),
    CORS_CREDENTIALS: z.coerce.boolean().default(true),
})

export const env = envSchema.parse(process.env)