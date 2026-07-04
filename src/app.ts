import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/config';
import { prisma } from './config/prisma';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import authRoutes from './modules/auth/auth.routes';
import matchRouter from './modules/matches/match-router';
import { Logger } from './utils/logger';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

if (config.swagger.enabled) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.json(swaggerSpec);
  });
}

app.use('/api/v1/auth', authRoutes);
app.use('/matches', matchRouter);

app.get('/health', async (_req: Request, res: Response) => {
  let dbConnected = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
    Logger.debug('Health check: database connected');
  } catch (error) {
    Logger.error('Health check: database disconnected', error);
    dbConnected = false;
  }

  const statusCode = dbConnected ? 200 : 500;

  res.status(statusCode).json({
    status: dbConnected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbConnected ? 'connected' : 'disconnected',
      server: 'running',
    },
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Sport Heroes Backend API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      health: '/health',
      auth: {
        login: 'POST /api/v1/auth/login',
        me: 'GET /api/v1/auth/me',
        profile: 'PATCH /api/v1/auth/profile',
        logout: 'POST /api/v1/auth/logout',
      },
    },
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
