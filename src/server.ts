import { createApp } from './app';
import { env } from './config/env';
import { ConnectDb } from './modules/user/infrastructure/db/mongo';
import { redisClient } from './shared/infrastructure/cache/redis.client';
import { emailWorker } from './shared/infrastructure/queue/email.worker'; 
import { logger } from './shared/infrastructure/logger/logger';

export const startServer = async (): Promise<void> => {
  const connectDb = new ConnectDb(env.MONGO_URI);
  await connectDb.connect();

  await redisClient.connect();

  //el worker se inicia automáticamente al importar el módulo, no es necesario hacer nada más aquí
  logger.info(`Email worker started with concurrency ${emailWorker.opts.concurrency}`);



  const app = createApp();

  return new Promise((resolve, reject) => {
    const server = app.listen(env.PORT, () => {
      logger.info(`Nexo running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      resolve();
    });

    server.on('error', reject);
  });
};
