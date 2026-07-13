import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

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
      { name: 'Sports', description: 'Sports master data and player sport profiles' },
      { name: 'Teams', description: 'Team management' },
      { name: 'Tournaments', description: 'Tournament management' },
      { name: 'Matches', description: 'Match lifecycle and live scoring' },
      { name: 'Statistics', description: 'Player and team statistics & leaderboards' },
    ],
  },
  apis: [
    './src/docs/swagger.components.ts',
    './src/docs/swagger.auth.paths.ts',
    './src/docs/swagger.sports.paths.ts',
    './src/docs/swagger.teams.paths.ts',
    './src/docs/swagger.tournaments.paths.ts',
    './src/docs/swagger.matches.paths.ts',
    './src/docs/swagger.statistics.paths.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
