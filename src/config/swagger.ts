import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SportHeroes API',
      version: '1.0.0',
      description:
        'SportHeroes backend API. Authentication uses Firebase Phone Auth on the client; the API verifies the Firebase ID token and issues an app JWT.',
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
          description: 'App access token returned by POST /api/v1/auth/login',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Phone-number authentication via Firebase',
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*-router.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
