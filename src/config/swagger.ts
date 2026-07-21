import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

const docsDir = path.join(process.cwd(), 'src', 'docs');

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SportHeroes API',
      version: '1.0.0',
      description: `
SportHeroes backend REST API.

**Authentication**
- Production: Firebase Phone Auth → \`POST /api/v1/auth/login\` with Firebase \`idToken\`
- Development: Run \`npm run db:seed:dev\` then \`POST /api/v1/auth/dev-login\` for a 1-year JWT

**Swagger testing**
1. Run \`npm run db:seed:dev\`
2. Call \`POST /api/v1/auth/dev-login\`
3. Copy \`data.tokens.accessToken\`
4. Click **Authorize** → paste token (no "Bearer " prefix needed in Swagger UI)
      `.trim(),
    },
    servers: [
      {
        url: '/',
        description: 'Current host (local or Vercel)',
      },
      {
        url: `http://localhost:${config.port}`,
        description: 'Local development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'App JWT from POST /api/v1/auth/login or POST /api/v1/auth/dev-login (dev only)',
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication (Firebase + dev login)' },
      { name: 'Sports', description: 'Sports master data (CRUD)' },
      { name: 'Players', description: 'Player sport profiles' },
      { name: 'Teams', description: 'Team management' },
      { name: 'Tournaments', description: 'Tournament management' },
      { name: 'Matches', description: 'Match lifecycle and live scoring' },
      { name: 'Statistics', description: 'Player and team statistics & leaderboards' },
      { name: 'Search', description: 'Global search across users, teams, tournaments, matches, venues' },
      { name: 'Venues', description: 'Venue management with GPS location' },
      { name: 'Support', description: 'Help & support concerns and tickets' },
    ],
  },
  apis: [
    path.join(docsDir, 'swagger.components.ts'),
    path.join(docsDir, 'swagger.auth.paths.ts'),
    path.join(docsDir, 'swagger.sports.paths.ts'),
    path.join(docsDir, 'swagger.players.paths.ts'),
    path.join(docsDir, 'swagger.teams.paths.ts'),
    path.join(docsDir, 'swagger.tournaments.paths.ts'),
    path.join(docsDir, 'swagger.matches.paths.ts'),
    path.join(docsDir, 'swagger.statistics.paths.ts'),
    path.join(docsDir, 'swagger.search.paths.ts'),
    path.join(docsDir, 'swagger.venues.paths.ts'),
    path.join(docsDir, 'swagger.support.paths.ts'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
