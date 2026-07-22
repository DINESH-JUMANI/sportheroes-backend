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
- Email or phone + password → \`POST /api/v1/auth/register\` / \`POST /api/v1/auth/login\`
- Placeholder users (teams/matches): \`POST /api/v1/auth/set-password\` then login
- Development: \`POST /api/v1/auth/dev-login\` for a 1-year JWT

**Storage**
- Images upload via multipart to our API; files stored in **Supabase Storage** (not Supabase Auth)
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
            'App JWT from POST /api/v1/auth/login, /register, /set-password, or /dev-login',
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Email/phone + password auth (app JWT)' },
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
