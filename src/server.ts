import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import { assertConfig, config } from './config/config';
import { initFirebase } from './config/firebase';
import { prisma } from './config/prisma';
import { Logger } from './utils/logger';

async function bootstrap() {
  Logger.info('Initializing Sport Heroes backend...');

  assertConfig();
  initFirebase();

  try {
    await prisma.$queryRaw`SELECT 1`;
    Logger.info('Database connected successfully via Prisma');
  } catch (error) {
    Logger.warn('Server is starting without database connectivity. Check DATABASE_URL in .env');
    Logger.error('Database connection failed', error);
  }

  app.listen(config.port, () => {
    Logger.info(`Server is running on http://localhost:${config.port}`);
    Logger.info(`Health check: http://localhost:${config.port}/health`);
    if (config.swagger.enabled) {
      Logger.info(`Swagger docs: http://localhost:${config.port}/api/docs`);
    }
  });
}

bootstrap().catch(async (error) => {
  Logger.error('Critical bootstrap error', error);
  await prisma.$disconnect();
  process.exit(1);
});
