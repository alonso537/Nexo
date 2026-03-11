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
    SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
    SMTP_PORT: z.coerce.number().int().default(587),
    SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
    SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
    SMTP_FROM: z.string().default('Nexo <no-reply@nexo.app>'),
    FRONTEND_URL: z.string().url().default('http://localhost:8000/api/auth'),
    STORAGE_ENDPOINT: z.string().url('STORAGE_ENDPOINT must be a valid URL').optional(),
    STORAGE_REGION: z.string().default('auto'),
    STORAGE_ACCESS_KEY: z.string().min(1, 'STORAGE_ACCESS_KEY is required'),
    STORAGE_SECRET_KEY: z.string().min(1, 'STORAGE_SECRET_KEY is required'),
    STORAGE_BUCKET: z.string().min(1, 'STORAGE_BUCKET is required'),
    STORAGE_PUBLIC_URL: z.string().url('STORAGE_PUBLIC_URL must be a valid URL'),
})

export const env = envSchema.parse(process.env)

function parseTimeToMs(timeStr: string): number {
    const match = timeStr.match(/^(\d+)([smhd])$/);
    if (!match) {
        throw new Error(`Invalid time format: ${timeStr}. Use format like: 15m, 7d, 2h, 30s`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: throw new Error(`Unknown time unit: ${unit}`);
    }
}

export function getJwtAccessTtlMs(): number {
    return parseTimeToMs(env.JWT_ACCESS_TTL);
}

export function getJwtRefreshTtlMs(): number {
    return  parseTimeToMs(env.JWT_REFRESH_TTL);
}