import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { openapi } from './shared/infrastructure/http/docs/swagger';

import { env } from './config/env';
import { errorMiddleware } from './shared/infrastructure/errors/errorMiddleware';
import { requestId } from './shared/infrastructure/http/express/middleware/requestId.middleware';
//rutas
import { authRoutes } from './modules/user/infrastructure/http/routes/auth.routes';
import { userRoutes } from './modules/user/infrastructure/http/routes/user.routes';

export const createApp = () => {
    // Initialize Express app
    const app = express()

    //middlewares
    app.use(requestId);
    app.use(helmet());
    app.use(cors({
        origin: env.CORS_ORIGINS.split(','),
        methods: env.CORS_METHODS.split(','),
        credentials: env.CORS_CREDENTIALS,
    }));
    app.use(express.json());
    app.use(cookieParser(env.SECRET))

    app.use(rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: { status: 'error', code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' },
    }))

    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: { status: 'error', code: 'TOO_MANY_REQUESTS', message: 'Too many attempts, please try again later.' },
    })

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi))

    //rutas
    app.get('/health', (_req, res) => {
        res.status(200).json({ message: 'OK' });
    });

    // Rutas de autenticación
    app.use('/api/auth', authLimiter, authRoutes);
    app.use('/api/user', userRoutes);

    app.use(errorMiddleware);

    return app;

}