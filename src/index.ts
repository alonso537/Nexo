import { logger } from './shared/infrastructure/logger/logger';
import { startServer } from "./server";

startServer().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
