import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { errorMiddleware } from './shared/infrastructure/errors/errorMiddleware';
//rutas
import { authRoutes } from './modules/user/infrastructure/http/routes/auth.routes';
import { userRoutes } from './modules/user/infrastructure/http/routes/user.routes';

export const createApp = () => {
    // Initialize Express app
    const app = express()

    //middlewares
    app.use(helmet());
    app.use(cors({
        origin: env.CORS_ORIGINS.split(','),
        methods: env.CORS_METHODS.split(','),
        credentials: env.CORS_CREDENTIALS,
    }));
    app.use(express.json());
    app.use(cookieParser(env.SECRET))

    app.use(rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    }))

    //rutas
    app.get('/health', (_req, res) => {
        res.status(200).json({ message: 'OK' });
    });

    // Rutas de autenticación
    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);

    app.use(errorMiddleware);

    return app;

}