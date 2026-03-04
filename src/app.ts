import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

export const createApp = () => {
    // Initialize Express app
    const app = express()

    //middlewares
    app.use(helmet());
    app.use(cors())
    app.use(express.json());
    app.use(cookieParser())

    app.use(rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    }))

    //rutas

    return app;

}