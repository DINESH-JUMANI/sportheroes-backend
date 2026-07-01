import express, { Request, Response } from 'express';
import cors from 'cors';
import { testConnection } from './config/database';
import matchRouter from './modules/matches/match-router';

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Register routes
app.use('/matches', matchRouter);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const dbConnected = await testConnection();


  if (dbConnected) {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        server: 'running',
      },
    });
  } else {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        server: 'running',
      },
    });
  }
});

// Default root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Sport Heroes Backend API',
    version: '1.0.0',
    documentation: '/docs',
    endpoints: {
      health: '/health',
    },
  });
});

export default app;
