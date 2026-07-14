import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/config';
import { prisma } from './config/prisma';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import authRoutes from './modules/auth/auth.routes';
import sportsRoutes from './modules/sports/sports.routes';
import playersRoutes from './modules/players/players.routes';
import teamsRoutes from './modules/teams/teams.routes';
import tournamentsRoutes from './modules/tournaments/tournaments.routes';
import matchesRoutes from './modules/matches/matches.routes';
import statisticsRoutes from './modules/statistics/statistics.routes';
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
app.use('/api/v1/sports', sportsRoutes);
app.use('/api/v1/player-profiles', playersRoutes);
app.use('/api/v1/teams', teamsRoutes);
app.use('/api/v1/tournaments', tournamentsRoutes);
app.use('/api/v1/matches', matchesRoutes);
app.use('/api/v1/statistics', statisticsRoutes);

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
      auth: '/api/v1/auth',
      sports: '/api/v1/sports',
      playerProfiles: '/api/v1/player-profiles',
      teams: '/api/v1/teams',
      tournaments: '/api/v1/tournaments',
      matches: '/api/v1/matches',
      statistics: '/api/v1/statistics',
    },
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
