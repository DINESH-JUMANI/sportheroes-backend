import dotenv from 'dotenv';
// Load environment variables before importing any config/routes
dotenv.config();

import app from './app';
import { testConnection } from './config/database';

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  console.log('[Server] Initializing Sport Heroes backend...');

  // Verify database connection at startup
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.warn('[Server] WARNING: Server is starting without database connectivity. Check your DATABASE_URL in .env');
  }

  app.listen(PORT, () => {
    console.log(`[Server] Server is running on http://localhost:${PORT}`);
    console.log(`[Server] Health check endpoint: http://localhost:${PORT}/health`);
  });
}

bootstrap().catch((error) => {
  console.error('[Server] Critical bootstrap error:', error);
  process.exit(1);
});
